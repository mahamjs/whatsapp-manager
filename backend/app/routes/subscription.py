from flask import Blueprint, request, jsonify, g, current_app
from ..extensions import db
from ..auth import require_api_key
import datetime as dt
from ..models import BillingRecord, Plan, SubscriptionRequest

sub_bp = Blueprint("subscription", __name__, url_prefix="/subscription")

@sub_bp.get("/my_subscription")
@require_api_key
def my_subscription():
    current_app.logger.info("Accessed /my_subscription")
    client = g.client
    plan = client.plan

    return jsonify({
        "plan": plan.name if plan else None,
        "monthly_cap": plan.monthly_cap if plan else None,
        "price_usd": f"${plan.price_cents / 100:.2f}" if plan else None,
        "usage_count": client.usage_count,
        "remaining": (
            plan.monthly_cap - client.usage_count
            if plan and plan.monthly_cap else "Unlimited"
        ),
        "plan_expiry": client.plan_expiry.isoformat() if client.plan_expiry else None
    }), 200


@sub_bp.get("/billing_history")
@require_api_key
def billing_history():
    client = g.client

    records = BillingRecord.query.filter_by(client_id=client.id)\
        .order_by(BillingRecord.generated_at.desc()).all()

    return jsonify({
        "billing_records": [
            {
                "period": record.billing_period,
                "amount_usd": f"${record.amount_cents / 100:.2f}",
                "messages": record.message_count,
                "generated_at": record.generated_at.isoformat()
            }
            for record in records
        ]
    }), 200


@sub_bp.get("/plans")
def get_all_plans():
    plans = Plan.query.all()

    return jsonify({
        "plans": [
            {
                "id": plan.id,
                "name": plan.name,
                "monthly_cap": plan.monthly_cap,
                "price_usd": f"${plan.price_cents / 100:.2f}",
                "description": plan.description
            }
            for plan in plans
        ]
    }), 200
@sub_bp.post("/request")
@require_api_key
def submit_subscription_request():
    data = request.get_json() or {}
    request_type = data.get("type")
    details = data.get("details", "")

    if request_type not in ("renew", "cancel", "change_plan", "delete_account"):
        return jsonify({"error": "Invalid request type"}), 400

    # Check for existing pending request of the same type
    existing_request = SubscriptionRequest.query.filter_by(
        client_id=g.client.id,
        request_type=request_type,
        status="pending"
    ).first()

    if existing_request:
        return jsonify({"error": f"A pending '{request_type}' request already exists."}), 400

    req = SubscriptionRequest(
        client_id=g.client.id,
        request_type=request_type,
        details=details,
        status="pending",
        created_at=dt.datetime.utcnow()
    )
    db.session.add(req)
    db.session.commit()
    return jsonify({"message": "Request submitted", "request_id": req.id}), 201



@sub_bp.get("/my_requests")
@require_api_key
def my_requests():
    requests = SubscriptionRequest.query.filter_by(client_id=g.client.id).order_by(
        SubscriptionRequest.created_at.desc()).all()

    return jsonify([{
        "id": r.id,
        "type": r.request_type,
        "status": r.status,
        "details": r.details,
        "created_at": r.created_at.isoformat(),
        "completed_at": r.completed_at.isoformat() if r.completed_at else None
    } for r in requests]), 200


# @sub_bp.post("/renew_subscription")
# @require_api_key
# def renew_subscription():
#     client = g.client
#     now = dt.datetime.utcnow()

#     if not client.plan:
#         return jsonify({"error": "No active plan associated with client"}), 400

#     # Create billing record for the current cycle
#     billing_record = BillingRecord(
#         client_id=client.id,
#         amount_cents=client.plan.price_cents,
#         message_count=client.usage_count,
#         billing_period=now.strftime("%Y-%m"),
#         generated_at=now
#     )
#     db.session.add(billing_record)

#     # Extend plan expiry and reset usage
#     client.plan_expiry = max(client.plan_expiry or now, now) + dt.timedelta(days=30)
#     client.usage_count = 0

#     db.session.commit()

#     return jsonify({
#         "message": "Subscription renewed successfully",
#         "new_expiry": client.plan_expiry.isoformat()
#     }), 200

