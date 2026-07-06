from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from app.db.database import get_db
from app.db.models import User
from app.core.config import SECRET_KEY, ALGORITHM, SESSION_COOKIE_NAME

# Look for the token in the Authorization header — but don't 401 on its own
# (auto_error=False), because the session may live in the httpOnly cookie
# instead. Browsers use the cookie; API clients / the legacy frontend use Bearer.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def get_current_user(
    request: Request,
    bearer: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Bearer header first (backward compatible), else the session cookie.
    token = bearer or request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise credentials_exception

    try:
        # 2. Decode the token using our secret key
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except HTTPException:
        raise
    except Exception:
        raise credentials_exception

    # 3. Find the user in the database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    # 4. Hand the user object to whatever API route requested it
    return user
