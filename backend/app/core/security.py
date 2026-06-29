import json

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import ENCRYPTION_KEY

# The key is loaded (and validated) from the environment in app.core.config.
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_data(data: str) -> str:
    """Encrypts a string (like a JSON key) into an unreadable token."""
    return cipher_suite.encrypt(data.encode('utf-8')).decode('utf-8')

def decrypt_data(encrypted_data: str) -> str:
    """Decrypts a token back into the original string."""
    return cipher_suite.decrypt(encrypted_data.encode('utf-8')).decode('utf-8')


def encrypt_credentials(credentials: dict) -> str:
    """Serialize an OAuth credentials dict and encrypt it for DB storage."""
    return encrypt_data(json.dumps(credentials))


def decrypt_credentials(stored_value: str) -> dict:
    """Decrypt a stored credentials blob back into a dict.

    Tolerates legacy rows that were written as plaintext JSON before
    encryption was enabled (see scripts/migrate_encrypt_credentials.py).
    Once the migration has run, every row is real ciphertext and the
    fallback branch is never taken.
    """
    if not stored_value:
        return {}
    try:
        raw = decrypt_data(stored_value)
    except InvalidToken:
        # Legacy plaintext credentials — read them as-is so we don't lock
        # users out, but they should be re-encrypted by the migration.
        raw = stored_value
    return json.loads(raw)