# app/models.py

import datetime as dt
from .extensions import db

# ----------- PLAN MODEL -----------
class Plan(db.Model):
    __tablename__ = "plans"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    monthly_cap = db.Column(db.Integer, nullable=True)  # None = unlimited
    price_cents = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<Plan {self.name} (${self.price_cents / 100:.2f})>"


# ----------- CLIENT MODEL -----------
class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)

    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    is_key_revoked = db.Column(db.Boolean, default=False)
    plan_expiry = db.Column(db.DateTime, nullable=True)

    plan_id = db.Column(db.Integer, db.ForeignKey("plans.id"))
    plan = db.relationship("Plan", backref="clients")

    # NEW: toggle for auto-renewal
    auto_renew = db.Column(db.Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Client {self.id} {self.username}, Plan: {self.plan.name if self.plan else 'None'}>"


# ----------- USER SESSION MODEL -----------
class UserSession(db.Model):
    __tablename__ = "user_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_number = db.Column(db.String(20), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"))
    last_message_at = db.Column(db.DateTime, default=dt.datetime.utcnow)

    client = db.relationship("Client", backref="sessions")
    __table_args__ = (db.UniqueConstraint('client_id', 'user_number', name='uix_client_user'),)

    def __repr__(self):
        return f"<Session {self.user_number} for Client {self.client_id}>"


# ----------- MESSAGE LOG MODEL -----------
class MessageLog(db.Model):
    __tablename__ = "message_logs"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"))
    client = db.relationship("Client", backref="messages")

    recipient_number = db.Column(db.String(20), nullable=False)
    template_name = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=True)

    status = db.Column(db.String(50))  # e.g., sent, delivered, failed, read
    sent_at = db.Column(db.DateTime, default=dt.datetime.utcnow)
    delivery_time = db.Column(db.DateTime, nullable=True)
    error_message = db.Column(db.Text, nullable=True)

    direction = db.Column(db.String(10), nullable=False, default="outbound")  # NEW


    def __repr__(self):
        return f"<MessageLog to {self.recipient_number} - {self.status}>"


# ----------- BILLING RECORD MODEL -----------
class BillingRecord(db.Model):
    __tablename__ = "billing_records"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"))
    client = db.relationship("Client", backref="billing_records")

    amount_cents = db.Column(db.Integer, nullable=False)
    message_count = db.Column(db.Integer, nullable=False)
    billing_period = db.Column(db.String(20), nullable=False)  # e.g., "2025-07"
    generated_at = db.Column(db.DateTime, default=dt.datetime.utcnow)

    def __repr__(self):
        return f"<BillingRecord {self.billing_period} - ${self.amount_cents / 100:.2f}>"


# ----------- WEBHOOK EVENT MODEL -----------
class WebhookEvent(db.Model):
    __tablename__ = "webhook_events"

    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.String(100), nullable=False)
    event_type = db.Column(db.String(50))  # e.g., delivered, read, failed
    payload = db.Column(db.JSON, nullable=True)
    received_at = db.Column(db.DateTime, default=dt.datetime.utcnow)

    def __repr__(self):
        return f"<WebhookEvent {self.event_type} at {self.received_at}>"


class SubscriptionRequest(db.Model):
    __tablename__ = "subscription_requests"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=False)
    client = db.relationship("Client", backref="subscription_requests")

    request_type = db.Column(db.String(20), nullable=False)  # renew, cancel, change_plan, delete_account
    status = db.Column(db.String(20), default="pending")     # pending, completed, rejected
    details = db.Column(db.Text, nullable=True)              # Optional: plan name, reason
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<SubscriptionRequest {self.request_type} for Client {self.client_id} - {self.status}>"
