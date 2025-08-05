# routes/dashboard.py

from flask import Blueprint, jsonify, g
from ..extensions import db
from ..auth import require_api_key
from ..models import MessageLog
import datetime as dt
from sqlalchemy import func

usage_bp = Blueprint("usage", __name__, url_prefix="/dashboard")


@usage_bp.get("/usage")
@require_api_key
def get_dashboard_usage():
    now = dt.datetime.utcnow()
    cutoff = now - dt.timedelta(hours=24)

    # Format hour as "HH:00"
    hour_trunc = func.strftime('%H', MessageLog.sent_at)
    sent_rows = (
        db.session.query(hour_trunc.label('hour'), func.count().label('count'))
        .filter(
            MessageLog.client_id == g.client.id,
            MessageLog.status == 'sent',
            MessageLog.sent_at >= cutoff
        )
        .group_by('hour')
        .order_by('hour')
        .all()
    )

    sent_map = {r.hour.zfill(2): r.count for r in sent_rows}
    all_hours = [str(h).zfill(2) for h in range(24)]
    usage = [{"hour": h, "count": sent_map.get(h, 0)} for h in all_hours]

    # Summary data
    total_sent = db.session.query(func.count()).filter(
        MessageLog.client_id == g.client.id,
        MessageLog.status == 'sent'
    ).scalar()

    total_received = db.session.query(func.count()).filter(
        MessageLog.client_id == g.client.id,
        MessageLog.status == 'received'
    ).scalar()

    total_messages = total_sent + total_received
    percent_sent = round((total_sent / total_messages) * 100, 2) if total_messages > 0 else 0

    return jsonify({
        "usage": usage,
        "summary": {
            "sent": total_sent,
            "received": total_received,
            "total": total_messages,
            "percent_sent": percent_sent
        }
    }), 200
