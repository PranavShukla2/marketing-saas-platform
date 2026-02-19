def fetch_user_ga4_data(user_id: int, encrypted_key: bytes):
    """
    Decrypts the user's key and fetches their specific GA4 data.
    """
    # 1. Decrypt the key (using the logic from our previous chat)
    # decrypted_key = decrypt_key(encrypted_key)
    
    # 2. Use the decrypted key to authenticate with Google's API
    # client = BetaAnalyticsDataClient(credentials=decrypted_key)
    
    # 3. Fetch the data (Mocked here for your testing)
    print(f"Fetching Google Analytics data securely for User {user_id}...")
    
    # Return raw data. The frontend will decide how to plot it.
    return {
        "active_users": 1432,
        "page_views": 8500,
        "bounce_rate": "42%",
        "top_campaign": "Summer_Sale_2026"
    }