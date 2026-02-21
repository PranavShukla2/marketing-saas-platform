import json
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Metric, RunReportRequest

def fetch_ga4_metrics(property_id: str, decrypted_json_str: str) -> dict:
    """
    Takes a GA4 Property ID and a decrypted Service Account JSON string,
    authenticates with Google, and fetches the last 30 days of data.
    """
    try:
        # 1. Convert the JSON string back into a Python dictionary
        credentials_dict = json.loads(decrypted_json_str)

        # 2. Build the Google Credentials object
        credentials = service_account.Credentials.from_service_account_info(credentials_dict)

        # 3. Initialize the Google Analytics Client
        client = BetaAnalyticsDataClient(credentials=credentials)

        # 4. Formulate the exact question we want to ask Google Analytics
        request = RunReportRequest(
            property=f"properties/{property_id}",
            date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="screenPageViews"),
                Metric(name="bounceRate")
            ]
        )

        # 5. Make the API call over the internet
        response = client.run_report(request)

        # 6. Parse the response (Google returns a complex object, we just want the numbers)
        if response.rows:
            # Grab the first (and only) row of totals
            row = response.rows[0]
            
            # Format the numbers to look pretty on the dashboard
            active_users = int(row.metric_values[0].value)
            page_views = int(row.metric_values[1].value)
            
            # Bounce rate comes as a decimal (e.g., 0.42), we convert to percentage
            bounce_rate_raw = float(row.metric_values[2].value)
            bounce_rate = f"{bounce_rate_raw * 100:.1f}%"
            
            # Format large numbers (e.g., 8500 -> 8.5k)
            formatted_views = f"{page_views / 1000:.1f}k" if page_views > 1000 else str(page_views)

            return {
                "active_users": active_users,
                "page_views": formatted_views,
                "bounce_rate": bounce_rate
            }
            
        return {"active_users": 0, "page_views": "0", "bounce_rate": "0%"}

    except Exception as e:
        print(f"❌ Google API Error: {str(e)}")
        # If the key is invalid or API fails, we throw an error so the frontend knows
        raise ValueError(f"Failed to fetch data from Google Analytics: {str(e)}")