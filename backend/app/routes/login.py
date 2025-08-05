from flask import request, jsonify, Blueprint, g
from datetime import datetime
from ..models import Client
from ..auth import _issue_api_key, require_api_key



login_bp = Blueprint("login", __name__, url_prefix="/")


@login_bp.post("/login")
def login():
    data = request.get_json() or {}
    print(data)
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    client = Client.query.filter_by(username=username).first()
    if not client:
        return jsonify({"error": "Invalid credentials"}), 401

    if password != client.password:
        return jsonify({"error": "Invalid credentials"}), 401

    if not client.is_active or client.is_key_revoked:
        return jsonify({"error": "Client inactive or revoked"}), 403

    if client.plan_expiry and client.plan_expiry < datetime.utcnow():
        return jsonify({"error": "Plan expired"}), 403

    token = _issue_api_key(client.id)

    print(client.name)
    return jsonify({
        "token": token,
        "client_id": client.id,
        "plan": client.plan.name if client.plan else None,
        "plan_expiry": client.plan_expiry.isoformat() if client.plan_expiry else None,
        "name": client.name

    })

