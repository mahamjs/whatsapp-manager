from flask import request, jsonify, g, Blueprint, current_app
import jwt
from datetime import datetime, timedelta
from functools import wraps
from .models import Client
from .config import Config


def _verify_api_key(token: str) -> Client | None:
    try:
        data = jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALG])
        client = Client.query.get(int(data["sub"]))
        print("Decoded JWT:", data)
    except Exception as e:
        print("JWT decode failed:", str(e))
        return None

    if not client:
        print("Client not found")
        return None

    if not client.is_active:
        print("Client inactive")
        return None

    if client.is_key_revoked:
        print("Client key revoked")
        return None

    if client.plan_expiry and client.plan_expiry < datetime.utcnow():
        print("Plan expired:", client.plan_expiry)
        return None

    return client


def require_api_key(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid token"}), 401

        token = auth_header.split(" ")[1]
        client = _verify_api_key(token)

        if client is None:
            return jsonify({"error": "Invalid or expired token or plan"}), 403

        g.client = client
        return view_func(*args, **kwargs)

    return wrapper


def _issue_api_key(client_id: int) -> str:
    payload = {
        "sub": str(client_id),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=Config.API_KEY_LIFETIME_HOURS)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALG)


def require_admin_token(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        admin_token = request.headers.get("X-Admin-Token")
        expected = current_app.config.get("ADMIN_TOKEN")
        if admin_token != expected:
            return jsonify({"error": "Unauthorized: Admin token missing or invalid"}), 401
        return func(*args, **kwargs)
    return wrapper

def require_admin_or_api_key(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        admin_token = request.headers.get("X-Admin-Token")
        bearer_token = request.headers.get("Authorization", "").replace("Bearer ", "")
        expected_admin = current_app.config.get("ADMIN_TOKEN")

        if admin_token == expected_admin:
            return func(*args, **kwargs)

        # Fall back to API key authentication
        from app.auth import require_api_key
        return require_api_key(func)(*args, **kwargs)
    return wrapper
