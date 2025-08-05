# WhatsApp Template Manager

A comprehensive WhatsApp Business API template management system with user authentication, subscription management, and admin panel.

---

## Features

* **Template Management**: Create, edit, and manage WhatsApp message templates
* **Category-Specific Templates**: Authentication, Marketing, and Utility templates with Meta compliance
* **Message Sending**: Send template and text messages to contacts
* **Conversation Management**: View and manage WhatsApp conversations
* **User Authentication**: Secure login system with JWT tokens
* **Subscription Management**: Plan management with billing and usage tracking
* **Admin Panel**: Complete admin dashboard for user and system management
* **Real-time Updates**: Live template status updates and message delivery tracking

---

## Architecture

### Frontend (Next.js 14)

* Framework: Next.js 14 with App Router
* UI Library: shadcn/ui components with Tailwind CSS
* State Management: React Context API
* Authentication: JWT-based authentication
* API Communication: Fetch API with proxy configuration

### Backend (Flask)

* Framework: Flask with SQLAlchemy ORM
* Database: SQLite (development) / PostgreSQL (production)
* Authentication: JWT tokens with bcrypt password hashing
* Rate Limiting: Flask-Limiter for API protection
* CORS: Flask-CORS for cross-origin requests
* WhatsApp Integration: Meta WhatsApp Business API

---

## Prerequisites

* Node.js: 18.0 or higher
* Python: 3.8 or higher
* npm/yarn: Latest version
* WhatsApp Business Account: With API access
* Meta Developer Account: For WhatsApp Business API credentials

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd whatsapp-template-manager
```

### 2. Backend Setup (Flask)

#### Install Python Dependencies

```bash
python -m venv venv
# Windows
env\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

#### Environment Configuration

Create `.env` file in the root directory:

```env
FLASK_APP=app
FLASK_ENV=development
SECRET_KEY=your-super-secret-key
DATABASE_URL=sqlite:///whatsapp_manager.db
WHATSAPP_TOKEN=your-whatsapp-business-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
ADMIN_TOKEN=your-admin-panel-access-token
RATE_LIMIT_STORAGE_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
```


#### Start Backend Server

```bash
flask run
```

Backend URL: `http://localhost:5000`

### 3. Frontend Setup (Next.js)

#### Install Node Dependencies

```bash
npm install

```

#### Environment Configuration

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Start Frontend Server

```bash
npm run dev
```

Frontend URL: `http://localhost:3000`

---



## WhatsApp Business API Configuration

1. **Meta Developer Account**: [Meta for Developers](https://developers.facebook.com/)
2. **API Credentials**:

   * Phone Number ID
   * Business Account ID
   * Access Token
   * Webhook Verify Token
3. **Webhook Setup**:

   * URL: `https://your-domain.com/webhook`
   * Events: `messages`, `message_deliveries`, `message_reads`

---

## API Documentation

### Authentication

* `POST /login`
* `POST /logout`
* `GET /verify-token`

### Templates

* `GET /templates/status`
* `POST /templates/submit`
* `POST /templates/edit`
* `DELETE /templates/{id}`

### Messages

* `POST /messages/send_message`
* `GET /messages/log`
* `GET /messages/recipient_numbers`

### Admin

* `GET /admin/analytics`
* `GET /admin/clients`
* `POST /admin/onboard`
* `GET /admin/subscription_requests`

### Subscription

* `GET /subscription/my_subscription`
* `POST /subscription/request`
* `GET /subscription/plans`

---

## Testing

### Backend

```bash
pip install pytest pytest-flask
pytest
pytest --cov=app tests/
```

### Frontend

```bash
npm install --save-dev jest @testing-library/react
npm test
npm test -- --coverage
```

---

## Monitoring & Logging

### Flask Logging

```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    handler = RotatingFileHandler('logs/whatsapp_manager.log', maxBytes=10240, backupCount=10)
    handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)
```

### Health Endpoints

* `GET /health`
* `GET /metrics`

---

## Security Considerations

* Do not commit `.env` files
* Use strong secrets & rotate tokens
* Enable SSL for production databases
* Rate limiting and CORS enforcement
* JWT expiration and input validation

---

## Troubleshooting

### Backend

```bash
flask db upgrade
pip install -r requirements.txt
lsof -ti:5000 | xargs kill -9
```

### Frontend

```bash
rm -rf node_modules package-lock.json
npm install
npx kill-port 3000
```

### WhatsApp API

* Ensure webhook is accessible
* Verify API token permissions
* Check phone number verification
* Meta Business verification required

---
