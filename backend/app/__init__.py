from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db, limiter
from .routes import register_blueprints

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=["http://localhost:3000"])  # Allow frontend to access backend

    db.init_app(app)
    limiter.init_app(app)

    # Enable CORS with restriction to localhost:3000
    CORS(app, resources={r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }})

    with app.app_context():
        db.create_all()

    register_blueprints(app)
    return app
