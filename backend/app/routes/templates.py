# Updated template routes with proper access control
from flask import Blueprint, jsonify, request, current_app
import requests
from app.models import db
from datetime import datetime
from app.auth import require_admin_token, require_admin_or_api_key  # Import decorators

template_bp = Blueprint("templates", __name__, url_prefix="/templates")

def get_auth_header():
    return {
        "Authorization": f"Bearer {current_app.config['WHATSAPP_TOKEN']}",
        "Content-Type": "application/json"
    }

@template_bp.get("/status")
@require_admin_or_api_key
def get_template_status_live():
    WABA_ID = current_app.config['WHATSAPP_BUSINESS_ACCOUNT_ID']
    GRAPH_URL = current_app.config['WHATSAPP_API_URL']

    try:
        url = f"{GRAPH_URL}/{WABA_ID}/message_templates"
        res = requests.get(url, headers=get_auth_header())
        if res.status_code != 200:
            current_app.logger.error(f"Meta API error: {res.status_code} - {res.text}")
            res.raise_for_status()

        templates = res.json().get("data", [])
        return jsonify({"templates": templates})
    except Exception as e:
        current_app.logger.error(f"Failed to fetch live templates: {e}")
        return jsonify({"error": str(e)}), 500


@template_bp.post("/submit")
@require_admin_or_api_key
def submit_template():
    GRAPH_URL = current_app.config['WHATSAPP_API_URL']

    try:
        data = request.json
        required_fields = {"name", "language", "category", "components"}
        print("THIS IS DATA : \n", data)

        if not required_fields.issubset(data):
            return jsonify({"error": "Missing required fields"}), 400

        waba_id = current_app.config["WHATSAPP_BUSINESS_ACCOUNT_ID"]
        url = f"{GRAPH_URL}/{waba_id}/message_templates"
        res = requests.post(url, headers=get_auth_header(), json=data)
        res_data = res.json()
    
        if res.status_code >= 400:
            current_app.logger.error(f"Meta template creation error: {res_data}")
            print(res_data)

            return jsonify({"error": res_data}), res.status_code

        return jsonify({
            "message": "Template submitted successfully",
            "template_name": data["name"]
        }), 201

    except Exception as e:
        current_app.logger.error(f"Template submission error: {e}")
        return jsonify({"error": str(e)}), 500


@template_bp.delete("")
@require_admin_token  # Admin only
def delete_template():
    GRAPH_URL = current_app.config['WHATSAPP_API_URL']

    template_name = request.args.get("name")
    if not template_name:
        return jsonify({"error": "Missing 'name' query parameter"}), 400

    waba_id = current_app.config["WHATSAPP_BUSINESS_ACCOUNT_ID"]
    url = f"{GRAPH_URL}/{waba_id}/message_templates"
    params = {"name": template_name}

    res = requests.delete(url, headers=get_auth_header(), params=params)
    if res.status_code >= 400:
        current_app.logger.error(f"Meta delete template error: {res.text}")
        return jsonify({"error": res.json()}), res.status_code

    return jsonify({"success": True, "deleted": template_name}), 200


@template_bp.post("/edit")
@require_admin_or_api_key
def edit_template():
    GRAPH_URL = current_app.config['WHATSAPP_API_URL']

    try:
        data = request.json
        current_app.logger.info(f"Received edit request: {data}")

        if "template_id" not in data:
            return jsonify({"error": "Missing required field: 'template_id'"}), 400
        if "category" not in data and "components" not in data:
            return jsonify({"error": "At least 'category' or 'components' must be provided."}), 400

        template_id = data["template_id"]
        info_url = f"{GRAPH_URL}/{template_id}?fields=name,status"
        info_res = requests.get(info_url, headers=get_auth_header())

        if info_res.status_code != 200:
            current_app.logger.error(f"Failed to fetch template info: {info_res.text}")
            return jsonify({"error": "Failed to fetch template info from Meta."}), info_res.status_code

        info = info_res.json()
        status = info.get("status")
        template_name = info.get("name")

        if status not in ["APPROVED", "REJECTED", "PAUSED"]:
            return jsonify({
                "error": f"Cannot edit template with status '{status}'. "
                         "Only APPROVED, REJECTED, or PAUSED templates can be edited."
            }), 400

        if status == "APPROVED" and "category" in data:
            return jsonify({"error": "Cannot edit 'category' of an APPROVED template."}), 400

        payload = {}
        if "category" in data:
            payload["category"] = data["category"]
        if "components" in data:
            payload["components"] = data["components"]

        edit_url = f"{GRAPH_URL}/{template_id}"
        edit_res = requests.post(edit_url, headers=get_auth_header(), json=payload)
        edit_data = edit_res.json()

        if edit_res.status_code >= 400:
            current_app.logger.error(f"Meta edit error: {edit_data}")
            return jsonify({"error": edit_data}), edit_res.status_code

        return jsonify({
            "success": True,
            "message": "Template edit submitted successfully.",
            "template_id": template_id,
            "template_name": template_name,
            "edited_fields": list(payload.keys())
        }), 200

    except Exception as e:
        current_app.logger.error(f"Edit exception: {e}")
        return jsonify({"error": str(e)}), 500


@template_bp.get("/<string:template_name>")
@require_admin_or_api_key
def get_template_by_name(template_name):
    """
    Fetches a single WhatsApp message template by name, including its status,
    category, and components.
    """
    WABA_ID   = current_app.config["WHATSAPP_BUSINESS_ACCOUNT_ID"]
    GRAPH_URL = current_app.config["WHATSAPP_API_URL"]

    url = f"{GRAPH_URL}/{WABA_ID}/message_templates"
    params = {
        "name": template_name,
        "fields": "name,language,category,status,components"
    }

    try:
        resp = requests.get(url, headers=get_auth_header(), params=params)
        resp.raise_for_status()
        data = resp.json().get("data", [])
        if not data:
            return jsonify({"error": f"Template '{template_name}' not found"}), 404

        # usually data is a list; pick the first match
        tpl = data[0]
        return jsonify({"template": tpl}), 200

    except requests.RequestException as e:
        current_app.logger.error(f"[Template lookup] error fetching '{template_name}': {e}")
        return jsonify({"error": str(e)}), getattr(e.response, "status_code", 500)
