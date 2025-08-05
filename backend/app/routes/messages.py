from flask import Blueprint, request, jsonify, g, current_app
from ..extensions import db
from ..auth import require_api_key
from ..models import MessageLog
from ..utils import send_whatsapp_template, send_whatsapp_text, get_whatsapp_tier_and_limit
import datetime as dt
from sqlalchemy import func, distinct
import requests

msg_bp = Blueprint("messages", __name__, url_prefix="/messages")

@msg_bp.post("/send_message")
@require_api_key
def send_message():
    data = request.get_json() or {}
    recipients = data.get("to")
    msg_type = data.get("type")  # 'text' or 'template'
    client = g.client

    if not recipients or not msg_type:
        return jsonify({"error": "Missing 'to' or 'type' field"}), 400
    if msg_type not in ("text", "template"):
        return jsonify({"error": "Invalid 'type', must be 'text' or 'template'"}), 400
    if isinstance(recipients, str):
        recipients = [recipients]
    if msg_type == "text" and not data.get("text"):
        return jsonify({"error": "Missing 'text' field"}), 400
    if msg_type == "template" and not data.get("name"):
        return jsonify({"error": "Missing 'name' field for template"}), 400

    now = dt.datetime.utcnow()

    if client.plan_expiry and client.plan_expiry < now:
        return jsonify({"error": "Subscription expired. Renew to continue messaging."}), 403

    monthly_cap = client.plan.monthly_cap
    if msg_type == "template" and monthly_cap and client.usage_count + len(recipients) > monthly_cap:
        return jsonify({"error": "Monthly usage cap exceeded."}), 403

    tier_name, limit_24h = get_whatsapp_tier_and_limit()

    sent_in_24h = {
        r[0] for r in db.session.query(distinct(MessageLog.recipient_number))
        .filter(
            MessageLog.client_id == client.id,
            MessageLog.status == "sent",
            MessageLog.sent_at >= now - dt.timedelta(hours=24),
            MessageLog.template_name != "text"
        ).all()
    }

    new_uniques = [r for r in recipients if r not in sent_in_24h]
    if msg_type == "template" and len(sent_in_24h | set(new_uniques)) > limit_24h:
        return jsonify({
            "error": (
                f"24-hour unique recipient limit exceeded. "
                f"Tier: {tier_name}, Limit: {limit_24h}, Used: {len(sent_in_24h)}"
            )
        }), 403

    # Check inbound messages within 24h
    recent_inbound = {
        r[0] for r in db.session.query(distinct(MessageLog.recipient_number))
        .filter(
            MessageLog.client_id == client.id,
            MessageLog.direction == "inbound",
            MessageLog.sent_at >= now - dt.timedelta(hours=24)
        ).all()
    }

    successes = []
    errors = []

    for recipient in recipients:
        try:
            if msg_type == "text":
                if recipient not in recent_inbound:
                    errors.append({
                        "recipient": recipient,
                        "status": 403,
                        "response": "Cannot send freeform text. No inbound message from recipient in the last 24 hours."
                    })
                    continue

                res = send_whatsapp_text(recipient, data["text"])
                template_name = "text"
                content = data["text"]
            else:
                res = send_whatsapp_template(
                    recipient,
                    data["name"],
                    data.get("language", "en_US"),
                    data.get("components", [])
                )
                template_name = data["name"]
                content = None

            res.raise_for_status()
            body = res.json()

            if "error" in body:
                raise RuntimeError(body["error"].get("message", "Unknown error"))

            db.session.add(MessageLog(
                client_id=client.id,
                recipient_number=recipient,
                template_name=template_name,
                sent_at=now,
                status="sent",
                error_message=None,
                direction="outbound",
                content=content
            ))

            if msg_type == "template":
                client.usage_count = (client.usage_count or 0) + 1

            successes.append({
                "recipient": recipient,
                "status": 200,
                "response": body
            })

        except requests.exceptions.HTTPError as he:
            errors.append({
                "recipient": recipient,
                "status": he.response.status_code if he.response else 502,
                "response": he.response.text if he.response else str(he)
            })

        except RuntimeError as re:
            errors.append({
                "recipient": recipient,
                "status": 400,
                "response": str(re)
            })

        except Exception as e:
            errors.append({
                "recipient": recipient,
                "status": 500,
                "response": "Internal server error"
            })
            current_app.logger.exception(f"Error sending to {recipient}")

    if successes:
        db.session.add(client)
        db.session.commit()
    else:
        db.session.rollback()

    return jsonify({
        "results": successes,
        "errors": errors
    }), 207 if errors else 200

@msg_bp.get("/recipient_numbers")
@require_api_key
def get_registered_numbers():
    nums = (
        db.session.query(MessageLog.recipient_number)
        .filter(MessageLog.client_id == g.client.id)
        .distinct()
        .all()
    )
    return jsonify({"registered_numbers": [n[0] for n in nums]})


@msg_bp.get("/whatsapp_tier") #tells how many unique recipients can message be sent to in last 24 hour
@require_api_key
def get_tier_info():
    tier_name, limit = get_whatsapp_tier_and_limit()
    return jsonify({
        "tier": tier_name,
        "limit": limit
    })

@msg_bp.get("/log")
@require_api_key
def get_message_log():
    try:
        # Optional filters: status, direction, recipient_number
        status = request.args.get("status")
        direction = request.args.get("direction")
        recipient = request.args.get("recipient")

        query = MessageLog.query.filter_by(client_id=g.client.id)

        if status:
            query = query.filter_by(status=status)
        if direction:
            query = query.filter_by(direction=direction)
        if recipient:
            query = query.filter_by(recipient_number=recipient)

        # Get all matching messages, newest first
        messages = query.order_by(MessageLog.sent_at.desc()).all()

        message_data = [{
            "id": msg.id,
            "recipient_number": msg.recipient_number,
            "template_name": msg.template_name,
            "content": msg.content,
            "status": msg.status,
            "sent_at": msg.sent_at.isoformat(),
            "delivery_time": msg.delivery_time.isoformat() if msg.delivery_time else None,
            "error_message": msg.error_message,
            "direction": msg.direction
        } for msg in messages]

        return jsonify({"messages": message_data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
