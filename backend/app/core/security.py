from cryptography.fernet import Fernet

# CRITICAL SECURITY NOTE: 
# For this MVP, we are hardcoding this encryption key. 
# When you deploy, this MUST be moved to a .env file so it never touches GitHub!
# This is a valid Fernet (AES) 32-byte url-safe base64-encoded key.
ENCRYPTION_KEY = b'r-O-P9Kz4Ew9p38hG3c2zH_9Gv7m9E-qL_d3M2k1AF8='

cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_data(data: str) -> str:
    """Encrypts a string (like a JSON key) into an unreadable token."""
    return cipher_suite.encrypt(data.encode('utf-8')).decode('utf-8')

def decrypt_data(encrypted_data: str) -> str:
    """Decrypts a token back into the original string."""
    return cipher_suite.decrypt(encrypted_data.encode('utf-8')).decode('utf-8')