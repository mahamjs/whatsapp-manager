from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db, limiter
from .routes import register_blueprints

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configure CORS only ONCE - remove the duplicate
    CORS(app, resources={r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }})
    
    db.init_app(app)
    limiter.init_app(app)
    
    with app.app_context():
        db.create_all()
    
    register_blueprints(app)
    return app
