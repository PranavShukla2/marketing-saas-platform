"""Encryption, hashing, and OAuth-state primitives."""
import jwt
import pytest


def test_credential_encryption_round_trip():
    from app.core.security import encrypt_credentials, decrypt_credentials
    creds = {"access_token": "abc", "refresh_token": "xyz", "n": 1}
    blob = encrypt_credentials(creds)
    assert blob != str(creds)  # actually encrypted, not plaintext
    assert decrypt_credentials(blob) == creds


def test_password_hash_verify():
    from app.api.auth import pwd_context
    h = pwd_context.hash("goodpassword1")
    assert h != "goodpassword1"
    assert pwd_context.verify("goodpassword1", h)
    assert not pwd_context.verify("wrong", h)


def test_oauth_state_roundtrip_and_tamper():
    from app.core.oauth import create_oauth_state, verify_oauth_state
    s = create_oauth_state(purpose="signin")
    assert verify_oauth_state(s)["purpose"] == "signin"
    with pytest.raises(Exception):
        verify_oauth_state(s + "tampered")


def test_oauth_state_rejects_bad_purpose():
    from app.core.oauth import create_oauth_state
    with pytest.raises(ValueError):
        create_oauth_state(purpose="evil")


def test_auth_codes_are_hashed_and_single_use():
    from app.db.database import SessionLocal
    from app.db.models import AuthCode
    from app.core.oauth import create_auth_code, consume_auth_code, _hash_code

    db = SessionLocal()
    try:
        code = create_auth_code(db, token="the-jwt")
        # stored value is the hash, never the plaintext code
        row = db.query(AuthCode).filter(AuthCode.code == _hash_code(code)).first()
        assert row is not None
        assert db.query(AuthCode).filter(AuthCode.code == code).first() is None
        # redeems once, then never again
        assert consume_auth_code(db, code) == "the-jwt"
        assert consume_auth_code(db, code) is None
    finally:
        db.close()
