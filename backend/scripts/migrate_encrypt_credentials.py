"""One-time migration: encrypt any legacy plaintext Integration credentials.

Before encryption was wired in, `Integration.encrypted_credentials` held
plaintext JSON. This script finds those rows and rewrites them as Fernet
ciphertext. It is idempotent: rows that already decrypt cleanly are skipped,
so it is safe to run more than once.

Usage (from backend/, with .env populated):
    python -m scripts.migrate_encrypt_credentials
"""
import json

from cryptography.fernet import InvalidToken

from app.db.database import SessionLocal
from app.db.models import Integration
from app.core.security import decrypt_data, encrypt_data


def migrate() -> None:
    db = SessionLocal()
    try:
        rows = db.query(Integration).all()
        encrypted = skipped = invalid = 0

        for row in rows:
            value = row.encrypted_credentials
            if not value:
                skipped += 1
                continue

            # Already encrypted? Then it decrypts cleanly — leave it alone.
            try:
                decrypt_data(value)
                skipped += 1
                continue
            except InvalidToken:
                pass

            # Legacy plaintext: confirm it's valid JSON, then encrypt in place.
            try:
                json.loads(value)
            except (ValueError, TypeError):
                print(f"  ! Integration id={row.id}: not ciphertext and not valid JSON — leaving untouched")
                invalid += 1
                continue

            row.encrypted_credentials = encrypt_data(value)
            encrypted += 1
            print(f"  + Integration id={row.id} ({row.provider}): encrypted")

        db.commit()
        print(f"\nDone. encrypted={encrypted} skipped={skipped} invalid={invalid} total={len(rows)}")
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
