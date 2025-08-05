#STORE IMPORTANT SETTINGS FOR APP

# .env is a file where you can put secret things like your database link, API secret, or admin token.

# This code reads the .env file and makes the values available inside Python using os.getenv().



import os
from dotenv import load_dotenv



load_dotenv()

class Config:#HOLDS SETTINGS IN ONE PLACE 
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///whatsapp_api.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME") #used to sign API tokens (JWTs) --. proves that the token is real 
    JWT_ALG = "HS256" #algorithm that is used for signing 
    API_KEY_LIFETIME_HOURS = int(os.getenv("API_KEY_LIFETIME_HOURS", 720)) #client's API can last only 30 days 
    ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "ADMIN_CHANGE_ME") #protects the 'generate_key route'--> only someone who knows this token can create new API clients 
    RATELIMIT_DEFAULT = "200/day"  #any user can call ny route upto 200 times a day
    WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v22.0")
    WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
    WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID")
    WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "my_secure_token")
    WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")

