# utils.py — WhatsApp send helpers

import requests
from flask import current_app


def send_whatsapp_template(recipient_number, template_name, language="en_US", components=None):
    url = f"{current_app.config['WHATSAPP_API_URL']}/{current_app.config['WHATSAPP_PHONE_ID']}/messages"

    template_payload = {
        "name": template_name,
        "language": {
            "code": language
        }
    }

    if components:
        template_payload["components"] = components

    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_number,
        "type": "template",
        "template": template_payload
    }

    headers = {
        "Authorization": f"Bearer {current_app.config['WHATSAPP_TOKEN']}",
        "Content-Type": "application/json"
    }

    res = requests.post(url, json=payload, headers=headers)
    print(f"📡 WhatsApp API response for {recipient_number}:\nStatus Code: {res.status_code}\nResponse: {res.text}")
    return res


def send_whatsapp_text(recipient_number, message_text):
    url = f"{current_app.config['WHATSAPP_API_URL']}/{current_app.config['WHATSAPP_PHONE_ID']}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_number,
        "type": "text",
        "text": {
            "body": message_text
        }
    }
    headers = {
        "Authorization": f"Bearer {current_app.config['WHATSAPP_TOKEN']}",
        "Content-Type": "application/json"
    }
    res = requests.post(url, json=payload, headers=headers)
    print(f"📡 WhatsApp API response for {recipient_number}:\nStatus Code: {res.status_code}\nResponse: {res.text}")
    return res



def get_whatsapp_tier_and_limit():
    tier_limits = {
        "TIER_250": 250,
        "TIER_1K": 1000,
        "TIER_10K": 10000,
        "TIER_100K": 100000,
        "TIER_UNLIMITED": float('inf')
    }

    phone_number_id = current_app.config['WHATSAPP_PHONE_ID']
    access_token = current_app.config["WHATSAPP_TOKEN"]
    GRAPH_URL = current_app.config['WHATSAPP_API_URL']
    url = f"{GRAPH_URL}/{phone_number_id}"
    params = {"fields": "messaging_limit_tier"}
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        tier_name = response.json().get("messaging_limit_tier", "TIER_250")
    except requests.RequestException as e:
        print(f"Tier fetch error: {e}")
        tier_name = "TIER_250"

    return tier_name, tier_limits.get(tier_name, 250)
