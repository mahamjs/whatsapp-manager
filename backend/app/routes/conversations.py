from flask import Blueprint, jsonify, g, current_app
from ..models import MessageLog
from ..auth import require_api_key
import datetime as dt


conv_bp = Blueprint("conversations", __name__, url_prefix="/")

@conv_bp.get("/conversations")
@require_api_key
def list_conversations():
    # Return distinct phone numbers you've chatted with
    nums = (
      MessageLog.query
      .filter_by(client_id=g.client.id)
      .distinct(MessageLog.recipient_number)
      .with_entities(MessageLog.recipient_number)
      .all()
    )
    # print(nums)
    return jsonify([n[0] for n in nums]), 200



@conv_bp.route("/conversation/<phone_number>/can_send_text", methods=["GET"])
@require_api_key
def check_can_send_text(phone_number):
    try:
        last_message = MessageLog.query.filter_by(
            client_id=g.client.id,
            recipient_number=phone_number,
            status="sent"
        ).order_by(MessageLog.sent_at.desc()).first()

        can_send_text = False
        last_message_text = "No messages yet"
        last_message_time = None

        if last_message:
            time_diff = dt.datetime.utcnow() - last_message.sent_at
            can_send_text = time_diff.total_seconds() < 86400
            text = last_message.template_name or ""  # Or use content if you add it
            last_message_text = (text[:50] + "...") if len(text) > 50 else text
            last_message_time = last_message.sent_at.isoformat()

        return jsonify({
            "can_send_text": can_send_text,
            "last_message": last_message_text,
            "last_message_time": last_message_time
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in can_send_text: {e}")
        return jsonify({"error": str(e)}), 500


@conv_bp.route("/conversation/<phone_number>/messages", methods=["GET"])
@require_api_key
def get_conversation_messages(phone_number):
    try:
        messages = MessageLog.query.filter_by(
            client_id=g.client.id,
            recipient_number=phone_number
        ).order_by(MessageLog.sent_at.asc()).limit(50).all()

        message_data = [{
            "id": msg.id,
            "text": msg.template_name,    # existing
            "content": msg.content,       # ← new
            "timestamp": msg.sent_at.isoformat(),
            "status": msg.status,
            "direction": msg.direction  # 🔥 Added line
        } for msg in messages]

        return jsonify({"messages": message_data}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching messages: {e}")
        return jsonify({"error": str(e)}), 500