# seed.py

from app import create_app
from app.extensions import db
from app.models import Plan, Client, MessageLog
import datetime as dt

app = create_app()

with app.app_context():
    # Drop and recreate all tables (optional)
    # db.drop_all()
    # db.create_all()
    # print("✅ Recreated all tables.")

    # # Seed Plans
    # plans = [
    #     Plan(name="Starter", monthly_cap=100, price_cents=1000, description="Starter: 100 msgs/mo"),
    #     Plan(name="Pro", monthly_cap=1000, price_cents=5000, description="Pro: 1,000 msgs/mo"),
    #     Plan(name="Business", monthly_cap=None, price_cents=20000, description="Business: unlimited"),
    # ]
    # db.session.add_all(plans)
    # db.session.commit()
    # print("✅ Seeded plans: Starter, Pro, Business")

    # # Seed Test Client
    # starter_plan = Plan.query.filter_by(name="Starter").first()
    # test_client = Client(
    #     name="Maham Test Client",
    #     username="maham",
    #     password="maham",
    #     plan=starter_plan,
    #     plan_expiry=dt.datetime.utcnow() + dt.timedelta(days=30),
    #     auto_renew=True
    # )
   

    # Seed inbound message for testing
    inbound_message = MessageLog(
        client_id=1,
        recipient_number="923003094709",
        template_name="inbound_text",
        content="Hello! I am sending my second text",
        status="received",
        sent_at=dt.datetime.utcnow(),
        direction="inbound"
    )
    db.session.add(inbound_message)
    db.session.commit()
    print("✅ Seeded inbound message for 923003094709")
