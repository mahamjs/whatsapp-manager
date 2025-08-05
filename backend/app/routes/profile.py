import re
from flask import Blueprint, request, jsonify, g
from ..extensions import db
from ..auth import require_api_key

prof_bp = Blueprint("profile", __name__, url_prefix="/profile")

def is_strong_password(password: str) -> bool:
    """
    Checks whether the password meets strength requirements:
    - At least 8 characters
    - Contains uppercase, lowercase, digit, special character
    """
    return bool(re.match(
        r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$',
        password
    ))

@prof_bp.post("/change_password")
@require_api_key
def change_password():
    data = request.get_json()
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    # Basic validation
    if not old_password or not new_password:
        return jsonify({"error": "Both old and new passwords are required."}), 400

    if old_password == new_password:
        return jsonify({"error": "New password must be different from old password."}), 400

    # Strong password validation
    if not is_strong_password(new_password):
        return jsonify({
            "error": "Password must be at least 8 characters long and include an uppercase letter, "
                     "a lowercase letter, a digit, and a special character."
        }), 400

    user = g.client

    if not user.check_password(old_password):
        return jsonify({"error": "Old password is incorrect."}), 401

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password updated successfully."}), 200
