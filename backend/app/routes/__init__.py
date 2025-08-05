# app/routes/__init__.py
from flask import Flask
from .admin import admin_bp
from .messages import msg_bp
from .templates import template_bp
from .login import login_bp 
from .subscription import sub_bp
from .dashboard import usage_bp
from .conversations import conv_bp
from .profile import prof_bp

def register_blueprints(app: Flask):
    app.register_blueprint(admin_bp)
    app.register_blueprint(msg_bp)
    app.register_blueprint(template_bp)
    app.register_blueprint(login_bp)
    app.register_blueprint(sub_bp)
    app.register_blueprint(usage_bp)
    app.register_blueprint(conv_bp)
    app.register_blueprint(prof_bp)

