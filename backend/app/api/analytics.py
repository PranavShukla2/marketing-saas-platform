import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Official Google Libraries
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest
from google.analytics.admin import AnalyticsAdminServiceClient

# Adjust these imports to match your project structure
from app.api.deps import get_db, get_current_user
from app.db.models import Integration, User
from app.core.security import decrypt_credentials, encrypt_credentials

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
TOKEN_URI = "https://oauth2.googleapis.com/token"

@router.get("/dashboard")
def get_dashboard_data(
    property_id: str = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetches live Google Analytics data for the logged-in user dynamically."""
    
    integration = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.provider == "google_analytics"
    ).first()

    # 1. If they never connected
    if not integration:
        return {"data": {"status": "pending_integration"}}

    creds_data = decrypt_credentials(integration.encrypted_credentials)
    
    # 2. If the database row exists but is missing the token
    if not creds_data.get("access_token"):
         return {"data": {"status": "pending_integration"}}
    
    credentials = Credentials(
        token=creds_data.get("access_token"),
        refresh_token=creds_data.get("refresh_token"),
        token_uri=TOKEN_URI,
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )

    # Access tokens live ~1 hour and we don't persist an expiry, so google-auth
    # would happily keep using a stale token (it thinks it's still valid) until
    # the API 401s and the workspace looks "disconnected". Proactively refresh
    # with the long-lived refresh token and save the new access token back.
    if creds_data.get("refresh_token"):
        try:
            credentials.refresh(GoogleAuthRequest())
            creds_data["access_token"] = credentials.token
            integration.encrypted_credentials = encrypt_credentials(creds_data)
            db.commit()
        except Exception as e:
            print(f"Token refresh failed: {e}")
            return {"data": {"status": "reauth_required"}}

    admin_client = AnalyticsAdminServiceClient(credentials=credentials)
    properties_list = []

    try:
        # Ask Google for every account and property this user owns
        account_summaries = admin_client.list_account_summaries()
        for account in account_summaries:
            for prop in account.property_summaries:
                properties_list.append({
                    "id": prop.property, # Formatted perfectly as "properties/12345"
                    "name": f"{account.display_name} - {prop.display_name}"
                })
    except Exception as e:
        print(f"Admin API Error: {e}")
        # Reached Google but the call failed — almost always the Analytics Admin/Data
        # APIs aren't enabled on the Cloud project, or this account lacks GA4 access.
        return {"data": {"status": "no_access", "message": "Couldn't reach Google Analytics. Make sure the Analytics Admin & Data APIs are enabled and this Google account has GA4 access."}}

    # Connected fine, but this Google account has no GA4 properties set up.
    if not properties_list:
        return {"data": {"status": "no_properties", "message": "No Google Analytics properties found on this account."}}

    # If the frontend sent a specific ID (via dropdown), use it. Otherwise, use their first property!
    target_property_id = property_id if property_id else properties_list[0]["id"]

    # --- FETCH THE DATA ---
    client = BetaAnalyticsDataClient(credentials=credentials)

    try:
        def _fmt_duration(seconds: float) -> str:
            seconds = int(round(seconds))
            m, s = divmod(seconds, 60)
            return f"{m}m {s}s" if m else f"{s}s"

        # Summary Metrics — the core KPI band (GA4 allows up to 10 metrics/request).
        # Keep the original four keys (active_users/page_views/bounce_rate/avg_duration)
        # for backwards compatibility and add the rest of the headline numbers.
        summary_data = {
            "active_users": "0", "new_users": "0", "sessions": "0", "engaged_sessions": "0",
            "page_views": "0", "engagement_rate": "0%", "bounce_rate": "0%",
            "avg_duration": "0s", "events": "0", "views_per_session": "0",
            "total_revenue": "0", "transactions": "0", "conversions": "0",
        }
        try:
            summary_request = RunReportRequest(
                property=target_property_id,
                dimensions=[],
                metrics=[
                    Metric(name="activeUsers"),
                    Metric(name="newUsers"),
                    Metric(name="sessions"),
                    Metric(name="engagedSessions"),
                    Metric(name="screenPageViews"),
                    Metric(name="engagementRate"),
                    Metric(name="bounceRate"),
                    Metric(name="averageSessionDuration"),
                    Metric(name="eventCount"),
                    Metric(name="screenPageViewsPerSession"),
                ],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            summary_response = client.run_report(summary_request)
            if summary_response.rows:
                v = summary_response.rows[0].metric_values
                summary_data.update({
                    "active_users": v[0].value,
                    "new_users": v[1].value,
                    "sessions": v[2].value,
                    "engaged_sessions": v[3].value,
                    "page_views": v[4].value,
                    "engagement_rate": f"{round(float(v[5].value) * 100, 1)}%",
                    "bounce_rate": f"{round(float(v[6].value) * 100, 1)}%",
                    "avg_duration": _fmt_duration(float(v[7].value)),
                    "events": v[8].value,
                    "views_per_session": str(round(float(v[9].value), 1)),
                })
        except Exception as e:
            print(f"Summary query error: {e}")

        # Revenue / conversions live in a second request (often zero for non-ecommerce
        # properties, and a bad metric here shouldn't blank the whole KPI band).
        try:
            revenue_request = RunReportRequest(
                property=target_property_id,
                dimensions=[],
                metrics=[
                    Metric(name="totalRevenue"),
                    Metric(name="transactions"),
                    Metric(name="conversions"),
                ],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            revenue_response = client.run_report(revenue_request)
            if revenue_response.rows:
                v = revenue_response.rows[0].metric_values
                summary_data.update({
                    "total_revenue": str(round(float(v[0].value), 2)),
                    "transactions": v[1].value,
                    "conversions": str(int(round(float(v[2].value)))),
                })
        except Exception as e:
            print(f"Revenue query error: {e}")

        # Channel Metrics
        source_request = RunReportRequest(
            property=target_property_id,
            dimensions=[Dimension(name="sessionSource")],
            metrics=[Metric(name="activeUsers"), Metric(name="screenPageViews")],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )
        source_response = client.run_report(source_request)
        
        post_level_data = []
        for row in source_response.rows:
            post_level_data.append({
                "source": row.dimension_values[0].value.capitalize(),
                "users": int(row.metric_values[0].value),
                "views": int(row.metric_values[1].value)
            })

        # Device Metrics
        device_request = RunReportRequest(
            property=target_property_id,
            dimensions=[Dimension(name="deviceCategory")],
            metrics=[Metric(name="activeUsers")],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )
        device_response = client.run_report(device_request)
        device_data = []
        for row in device_response.rows:
            device_data.append({
                "device": row.dimension_values[0].value.capitalize(),
                "users": int(row.metric_values[0].value)
            })

        # Pages Metrics
        pages_request = RunReportRequest(
            property=target_property_id,
            dimensions=[Dimension(name="pagePath")],
            metrics=[Metric(name="screenPageViews"), Metric(name="averageSessionDuration")],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )
        pages_response = client.run_report(pages_request)
        pages_data = []
        for row in pages_response.rows:
            pages_data.append({
                "path": row.dimension_values[0].value,
                "views": int(row.metric_values[0].value),
                "avg_duration": round(float(row.metric_values[1].value), 1)
            })
        pages_data = sorted(pages_data, key=lambda x: x["views"], reverse=True)[:10]

        # Ecommerce Metrics (Top Products)
        ecommerce_request = RunReportRequest(
            property=target_property_id,
            dimensions=[Dimension(name="itemName")],
            metrics=[Metric(name="itemsPurchased"), Metric(name="itemRevenue")],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )
        ecommerce_response = client.run_report(ecommerce_request)
        ecommerce_data = []
        for row in ecommerce_response.rows:
            ecommerce_data.append({
                "name": row.dimension_values[0].value,
                "purchases": int(row.metric_values[0].value),
                "revenue": float(row.metric_values[1].value)
            })
        ecommerce_data = sorted(ecommerce_data, key=lambda x: x["revenue"], reverse=True)[:5]

        # Funnel Events (page_view -> add_to_cart -> begin_checkout -> purchase)
        funnel_data = []
        try:
            funnel_request = RunReportRequest(
                property=target_property_id,
                dimensions=[Dimension(name="eventName")],
                metrics=[Metric(name="eventCount")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            funnel_response = client.run_report(funnel_request)
            event_counts = {}
            for row in funnel_response.rows:
                event_counts[row.dimension_values[0].value] = int(row.metric_values[0].value)
            
            # Build funnel from standard GA4 event names
            funnel_steps = [
                ("Page View", event_counts.get("page_view", 0)),
                ("Add to Cart", event_counts.get("add_to_cart", 0)),
                ("Begin Checkout", event_counts.get("begin_checkout", 0)),
                ("Purchase", event_counts.get("purchase", 0)),
            ]
            funnel_data = [{"step": s, "count": c} for s, c in funnel_steps if c > 0]
        except Exception as e:
            print(f"Funnel query error: {e}")

        # Weekly New vs Returning Users (for retention cohort)
        cohort_data = []
        try:
            cohort_request = RunReportRequest(
                property=target_property_id,
                dimensions=[Dimension(name="newVsReturning"), Dimension(name="week")],
                metrics=[Metric(name="activeUsers")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            cohort_response = client.run_report(cohort_request)
            weeks = {}
            for row in cohort_response.rows:
                user_type = row.dimension_values[0].value  # "new" or "returning"
                week = row.dimension_values[1].value
                users = int(row.metric_values[0].value)
                if week not in weeks:
                    weeks[week] = {"week": week, "new": 0, "returning": 0}
                weeks[week][user_type] = users
            cohort_data = sorted(weeks.values(), key=lambda x: x["week"])
        except Exception as e:
            print(f"Cohort query error: {e}")

        # Daily time series (last 30 days) — powers the trend chart.
        time_series = []
        try:
            ts_request = RunReportRequest(
                property=target_property_id,
                dimensions=[Dimension(name="date")],
                metrics=[
                    Metric(name="activeUsers"),
                    Metric(name="sessions"),
                    Metric(name="screenPageViews"),
                ],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            ts_response = client.run_report(ts_request)
            for row in ts_response.rows:
                raw = row.dimension_values[0].value  # YYYYMMDD
                label = f"{raw[4:6]}/{raw[6:8]}" if len(raw) == 8 else raw
                time_series.append({
                    "date": label,
                    "raw": raw,
                    "users": int(row.metric_values[0].value),
                    "sessions": int(row.metric_values[1].value),
                    "views": int(row.metric_values[2].value),
                })
            time_series = sorted(time_series, key=lambda x: x["raw"])
        except Exception as e:
            print(f"Time series query error: {e}")

        # Default channel grouping (Organic Search, Direct, Paid, Social, ...).
        channel_data = []
        try:
            ch_request = RunReportRequest(
                property=target_property_id,
                dimensions=[Dimension(name="sessionDefaultChannelGroup")],
                metrics=[Metric(name="activeUsers"), Metric(name="sessions")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            ch_response = client.run_report(ch_request)
            for row in ch_response.rows:
                channel_data.append({
                    "channel": row.dimension_values[0].value or "Unassigned",
                    "users": int(row.metric_values[0].value),
                    "sessions": int(row.metric_values[1].value),
                })
            channel_data = sorted(channel_data, key=lambda x: x["users"], reverse=True)
        except Exception as e:
            print(f"Channel query error: {e}")

        # Geography — top countries by users.
        geo_data = []
        try:
            geo_request = RunReportRequest(
                property=target_property_id,
                dimensions=[Dimension(name="country")],
                metrics=[Metric(name="activeUsers"), Metric(name="sessions")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            geo_response = client.run_report(geo_request)
            for row in geo_response.rows:
                geo_data.append({
                    "country": row.dimension_values[0].value or "(not set)",
                    "users": int(row.metric_values[0].value),
                    "sessions": int(row.metric_values[1].value),
                })
            geo_data = sorted(geo_data, key=lambda x: x["users"], reverse=True)[:8]
        except Exception as e:
            print(f"Geo query error: {e}")

        # Browser breakdown.
        browser_data = []
        try:
            br_request = RunReportRequest(
                property=target_property_id,
                dimensions=[Dimension(name="browser")],
                metrics=[Metric(name="activeUsers")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            br_response = client.run_report(br_request)
            for row in br_response.rows:
                browser_data.append({
                    "browser": row.dimension_values[0].value or "(other)",
                    "users": int(row.metric_values[0].value),
                })
            browser_data = sorted(browser_data, key=lambda x: x["users"], reverse=True)[:6]
        except Exception as e:
            print(f"Browser query error: {e}")

        # Operating system breakdown.
        os_data = []
        try:
            os_request = RunReportRequest(
                property=target_property_id,
                dimensions=[Dimension(name="operatingSystem")],
                metrics=[Metric(name="activeUsers")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            os_response = client.run_report(os_request)
            for row in os_response.rows:
                os_data.append({
                    "os": row.dimension_values[0].value or "(other)",
                    "users": int(row.metric_values[0].value),
                })
            os_data = sorted(os_data, key=lambda x: x["users"], reverse=True)[:6]
        except Exception as e:
            print(f"OS query error: {e}")

        # Top events by count.
        events_data = []
        try:
            ev_request = RunReportRequest(
                property=target_property_id,
                dimensions=[Dimension(name="eventName")],
                metrics=[Metric(name="eventCount")],
                date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            )
            ev_response = client.run_report(ev_request)
            for row in ev_response.rows:
                events_data.append({
                    "event": row.dimension_values[0].value,
                    "count": int(row.metric_values[0].value),
                })
            events_data = sorted(events_data, key=lambda x: x["count"], reverse=True)[:8]
        except Exception as e:
            print(f"Events query error: {e}")

        # --- DYNAMIC INSIGHTS ENGINE ---
        if post_level_data:
            top_channel = sorted(post_level_data, key=lambda x: x["views"], reverse=True)[0]
            top_name = top_channel["source"]
            
            dynamic_insights = {
                "primary_focus": f"Scale up {top_name}",
                "reason": f"{top_name} is your absolute best acquisition channel, currently driving {top_channel['views']} views.",
                "action_item": f"Reallocate 15% of your marketing budget or content resources to amplify {top_name}."
            }
        else:
            dynamic_insights = {
                "primary_focus": "Awaiting Data",
                "reason": "Not enough traffic data recorded in the last 30 days.",
                "action_item": "Ensure your GA4 tracking tag is installed on your website."
            }

        # --- SEND TO FRONTEND ---
        return {
            "data": {
                "status": "active",
                "company_name": current_user.company_name,
                "active_property_id": target_property_id,
                "properties": properties_list,
                "summary": summary_data,
                "post_level": post_level_data,
                "device_data": device_data,
                "pages_data": pages_data,
                "ecommerce_data": ecommerce_data,
                "funnel_data": funnel_data,
                "cohort_data": cohort_data,
                "time_series": time_series,
                "channel_data": channel_data,
                "geo_data": geo_data,
                "browser_data": browser_data,
                "os_data": os_data,
                "events_data": events_data,
                "anomaly": {"is_anomaly": False, "message": ""},
                "suggestions": dynamic_insights
            }
        }

    except Exception as e:
        print(f"GA4 Data API Error: {e}")
        # Connected, but pulling the report failed (Data API disabled, quota, etc.)
        return {"data": {"status": "no_access", "message": "Connected, but couldn't pull GA4 reports. Check that the Analytics Data API is enabled."}}