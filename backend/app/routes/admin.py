from flask import Blueprint, request, jsonify, current_app
from ..extensions import db
from ..models import Client, Plan, SubscriptionRequest, BillingRecord
from ..config import Config
import datetime as dt
import requests
from app.auth import require_admin_token

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


# ----------- ONBOARD CLIENT -----------
@admin_bp.post("/onboard")
@require_admin_token
def onboard_client():
    data = request.get_json() or {}
    name, username, password = data.get("name"), data.get("username"), data.get("password")
    plan_name = data.get("plan", "Starter")
    days = int(data.get("valid_days", 30))

    if not all([name, username, password]):
        return jsonify({"error": "Fields 'name', 'username', and 'password' are required."}), 400

    if Client.query.filter((Client.name == name) | (Client.username == username)).first():
        return jsonify({"error": "Client with that name or username already exists."}), 400

    plan = Plan.query.filter_by(name=plan_name).first()
    if not plan:
        return jsonify({"error": f"Plan '{plan_name}' not found."}), 404

    client = Client(
        name=name,
        username=username,
        password=password,
        plan=plan,
        plan_expiry=dt.datetime.utcnow() + dt.timedelta(days=days)
    )
    db.session.add(client)
    db.session.commit()

    return jsonify({
        "client_id": client.id,
        "plan": plan.name,
        "plan_expiry": client.plan_expiry.isoformat()
    }), 201


# ----------- CREATE PLAN -----------
@admin_bp.post("/plans")
@require_admin_token
def create_plan():
    data = request.get_json() or {}
    name, price_cents = data.get("name"), data.get("price_cents")
    monthly_cap = data.get("monthly_cap")
    description = data.get("description", "")

    if not name or price_cents is None:
        return jsonify({"error": "Missing 'name' and 'price_cents'."}), 400

    if Plan.query.filter_by(name=name).first():
        return jsonify({"error": "Plan with this name already exists."}), 400

    plan = Plan(name=name, monthly_cap=monthly_cap, price_cents=price_cents, description=description)
    db.session.add(plan)
    db.session.commit()
    return jsonify({"message": "Plan created", "plan_id": plan.id}), 201


# ----------- LIST CLIENTS -----------
@admin_bp.get("/clients")
@require_admin_token
def list_clients():
    clients = Client.query.all()
    return jsonify([{
        "id": c.id,
        "username": c.username,
        "plan": c.plan.name if c.plan else None,
        "auto_renew": c.auto_renew,
        "is_active": c.is_active,
        "created_at": c.created_at.isoformat(),
        "expiry": c.plan_expiry.isoformat() if c.plan_expiry else None
    } for c in clients]), 200


# ----------- UPDATE CLIENT PLAN/STATUS -----------
@admin_bp.put("/client/<int:client_id>")
@require_admin_token
def update_client(client_id):
    data = request.get_json() or {}
    client = Client.query.get_or_404(client_id)

    if "is_active" in data:
        client.is_active = bool(data["is_active"])
    if "auto_renew" in data:
        client.auto_renew = bool(data["auto_renew"])
    if "plan" in data:
        plan = Plan.query.filter_by(name=data["plan"]).first()
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        client.plan = plan

    db.session.commit()
    return jsonify({"message": "Client updated"}), 200


# ----------- DELETE CLIENT -----------
@admin_bp.delete("/client/<int:client_id>")
@require_admin_token
def delete_client(client_id):
    client = Client.query.get_or_404(client_id)
    db.session.delete(client)
    db.session.commit()
    return jsonify({"message": f"Client {client_id} deleted"}), 200


# ----------- ANALYTICS -----------
@admin_bp.get("/analytics")
@require_admin_token
def system_analytics():
    total_clients = Client.query.count()
    active = Client.query.filter_by(is_active=True).count()
    expired = Client.query.filter(Client.plan_expiry < dt.datetime.utcnow()).count()
    return jsonify({
        "total_clients": total_clients,
        "active_clients": active,
        "expired_clients": expired
    }), 200


# ----------- WHATSAPP ACCOUNT STATUS INFO -----------
@admin_bp.get("/whatsapp_status")
@require_admin_token
def whatsapp_status():
    phone_id = current_app.config['WHATSAPP_PHONE_ID']
    token = current_app.config["WHATSAPP_TOKEN"]
    url = f"{current_app.config['WHATSAPP_API_URL']}/{phone_id}"
    fields = "display_phone_number,quality_rating,messaging_limit_tier"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        res = requests.get(url, headers=headers, params={"fields": fields})
        res.raise_for_status()
        return jsonify(res.json()), 200
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500


# ----------- SUBSCRIPTION REQUESTS (Admin Processing) -----------
@admin_bp.get("/subscription_requests")
@require_admin_token
def get_requests():
    requests = SubscriptionRequest.query.order_by(SubscriptionRequest.created_at.desc()).all()
    return jsonify([{
        "id": r.id,
        "client_id": r.client_id,
        "client_username": r.client.username,
        "type": r.request_type,
        "status": r.status,
        "details": r.details,
        "created_at": r.created_at.isoformat(),
        "completed_at": r.completed_at.isoformat() if r.completed_at else None
    } for r in requests]), 200


@admin_bp.post("/process_request/<int:request_id>")
@require_admin_token
def process_subscription_request(request_id):
    req = SubscriptionRequest.query.get_or_404(request_id)
    if req.status != "pending":
        return jsonify({"error": "Request already processed"}), 400

    client = req.client
    now = dt.datetime.utcnow()

    if req.request_type == "renew":
        client.plan_expiry = max(client.plan_expiry or now, now) + dt.timedelta(days=30)
        billing_record = BillingRecord(
            client_id=client.id,
            amount_cents=client.plan.price_cents,
            message_count=client.usage_count,
            billing_period=now.strftime("%Y-%m"),
            generated_at=now
        )
        db.session.add(billing_record)
        client.usage_count = 0

    elif req.request_type == "cancel":
        client.is_active = False

    elif req.request_type == "change_plan":
        plan_name = ' '.join(req.details.split()[2:]).rstrip(':')
        new_plan = Plan.query.filter_by(name=plan_name).first()
        if not new_plan:
            return jsonify({"error": "Plan not found"}), 404

        client.plan = new_plan
        client.plan_expiry = max(client.plan_expiry or now, now) + dt.timedelta(days=30)
        billing_record = BillingRecord(
            client_id=client.id,
            amount_cents=new_plan.price_cents,
            message_count=client.usage_count,
            billing_period=now.strftime("%Y-%m"),
            generated_at=now
        )
        db.session.add(billing_record)
        client.usage_count = 0

    req.status = "completed"
    req.completed_at = now
    db.session.commit()

    return jsonify({"message": "Request processed successfully"}), 200
