import json
import numpy as np
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Metric, Dimension, RunReportRequest

def fetch_ga4_metrics(property_id: str, decrypted_json_str: str) -> dict:
    try:
        credentials_dict = json.loads(decrypted_json_str)
        credentials = service_account.Credentials.from_service_account_info(credentials_dict)
        client = BetaAnalyticsDataClient(credentials=credentials)

        request = RunReportRequest(
            property=f"properties/{property_id}",
            dimensions=[
                Dimension(name="sessionSource"), 
                Dimension(name="sessionMedium"),
                Dimension(name="sessionCampaignName")
            ],
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="screenPageViews"),
                Metric(name="bounceRate"),
                Metric(name="averageSessionDuration")
            ],
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        )

        response = client.run_report(request)
        t_users, t_views, t_bounce, t_dur = 0, 0, 0, 0
        post_level = []

        if response.rows:
            for row in response.rows:
                u, v = int(row.metric_values[0].value), int(row.metric_values[1].value)
                b, d = float(row.metric_values[2].value), float(row.metric_values[3].value)
                
                post_level.append({
                    "source": row.dimension_values[0].value,
                    "campaign": row.dimension_values[2].value,
                    "users": u, 
                    "views": v
                })
                t_users += u
                t_views += v
                t_bounce += (b * u)
                t_dur += (d * u)

            avg_b = f"{(t_bounce / t_users) * 100:.1f}%" if t_users > 0 else "0%"
            avg_d = f"{int((t_dur / t_users) / 60)}m {int((t_dur / t_users) % 60)}s" if t_users > 0 else "0s"
            
            return {
                "summary": {
                    "active_users": t_users,
                    "page_views": f"{t_views/1000:.1f}k" if t_views > 1000 else str(t_views),
                    "bounce_rate": avg_b, 
                    "avg_duration": avg_d
                },
                "post_level": post_level
            }
        return {"summary": {"active_users": 0, "page_views": "0", "bounce_rate": "0%", "avg_duration": "0s"}, "post_level": []}
    except Exception as e:
        raise ValueError(f"GA4 API Error: {str(e)}")

def predict_future_views(post_level_data: list) -> list:
    """Predict next 7 days using Linear Regression."""
    if len(post_level_data) < 3: return []
    y = np.array([item['views'] for item in post_level_data])
    x = np.arange(len(y))
    m, c = np.polyfit(x, y, 1)
    return [{"source": f"Day +{i}", "views": max(0, int(m * (len(y) + i) + c)), "is_prediction": True} for i in range(1, 8)]

def generate_roi_insights(post_level_data: list) -> dict:
    """ROI calculation based on engagement efficiency."""
    if not post_level_data: return {"primary_focus": "N/A", "reason": "No data", "action_item": "Sync GA4"}
    for item in post_level_data:
        item['roi_score'] = item['views'] / item['users'] if item['users'] > 0 else 0
    best = max(post_level_data, key=lambda x: x['roi_score'])
    return {
        "primary_focus": f"{best['source'].capitalize()} Focus",
        "reason": f"High engagement efficiency detected at {best['roi_score']:.2f} views/user.",
        "action_item": f"Increase content frequency on {best['source']} for better results."
    }