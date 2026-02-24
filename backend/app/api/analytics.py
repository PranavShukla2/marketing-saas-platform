import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Official Google Libraries
from google.oauth2.credentials import Credentials
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest
from google.analytics.admin import AnalyticsAdminServiceClient 

# Adjust these imports to match your project structure
from app.api.deps import get_db, get_current_user 
from app.db.models import Integration, User

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

    creds_data = json.loads(integration.encrypted_credentials)
    
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
        # --- THE FIX: Graceful Degradation ---
        # If the token is expired or invalid, don't crash the server!
        # Tell the frontend to show the 'Sign in with Google' button so they can reconnect.
        return {"data": {"status": "pending_integration"}}

    # If the user has GA connected but no actual websites set up in GA
    if not properties_list:
        return {"data": {"status": "pending", "message": "No Google Analytics properties found on your account."}}

    # If the frontend sent a specific ID (via dropdown), use it. Otherwise, use their first property!
    target_property_id = property_id if property_id else properties_list[0]["id"]

    # --- FETCH THE DATA ---
    client = BetaAnalyticsDataClient(credentials=credentials)

    try:
        # Summary Metrics
        summary_request = RunReportRequest(
            property=target_property_id,
            dimensions=[],
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="screenPageViews"),
                Metric(name="bounceRate"),
                Metric(name="averageSessionDuration"),
            ],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )
        summary_response = client.run_report(summary_request)
        
        summary_data = {"active_users": "0", "page_views": "0", "bounce_rate": "0%", "avg_duration": "0s"}
        if summary_response.rows:
            row = summary_response.rows[0]
            summary_data = {
                "active_users": row.metric_values[0].value,
                "page_views": row.metric_values[1].value,
                "bounce_rate": f"{round(float(row.metric_values[2].value) * 100, 1)}%",
                "avg_duration": f"{round(float(row.metric_values[3].value), 1)}s"
            }

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
                "anomaly": {"is_anomaly": False, "message": ""},
                "suggestions": dynamic_insights
            }
        }

    except Exception as e:
        print(f"GA4 Data API Error: {e}")
        # Catch Data API token failures as well
        return {"data": {"status": "pending_integration"}}