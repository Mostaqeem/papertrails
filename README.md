# ATS PaperTrail - Agreement Tracking System

A comprehensive web-based application for managing, tracking, and automating agreement workflows. Built with Django REST Framework on the backend and React on the frontend, with Docker containerization for easy deployment.

## 📋 Project Overview

**ATS PaperTrail** is an Agreement Tracking System designed to digitize and streamline the lifecycle management of agreements, contracts, and official correspondence. It provides organizations with tools to:

- **Create and manage agreements** with multiple agreement types
- **Track agreement lifecycle** from creation through expiration
- **Automate notifications** for upcoming expiration dates
- **Generate official correspondence** and letters with proper reference numbering
- **Manage stakeholders** including vendors, organizations, signatories, and recipients
- **Role-based access control** with department-level permissions
- **Scheduled tasks** using Ofelia scheduler for automated agreement updates
- **Integration with AI capabilities** via FastAPI LLM service for document analysis

## 🏗️ Architecture

### Tech Stack

**Backend:**
- **Framework:** Django 5.2.4 with Django REST Framework
- **Database:** MySQL
- **Task Scheduler:** Ofelia (Docker-based job scheduler)
- **AI Integration:** FastAPI with Ollama for LLM capabilities
- **Authentication:** JWT (Django Simple JWT)
- **Deployment:** Gunicorn + Docker

**Frontend:**
- **Library:** React 18.2.0
- **Build Tool:** Vite
- **UI Framework:** Material-UI (MUI)
- **Form Management:** React Hook Form + Zod validation
- **Charts:** Chart.js & Recharts
- **Document Generation:** React-PDF
- **HTTP Client:** Axios
- **Routing:** React Router v7

**Infrastructure:**
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx
- **Task Scheduling:** Ofelia

## 📁 Project Structure

```
ats_papertrail/
├── backend/                    # Django REST API
│   ├── accounts/              # User & authentication management
│   │   ├── models.py          # User, Department, Organization models
│   │   ├── serializers.py     # API serialization
│   │   ├── views.py           # Authentication endpoints
│   │   └── permissions.py     # Role-based access control
│   ├── agreements/            # Core agreement management
│   │   ├── models.py          # Agreement, AgreementType models
│   │   ├── views.py           # Agreement CRUD operations
│   │   ├── utils/             # Agreement utilities
│   │   └── middleware.py      # Custom middleware
│   ├── letters/               # Correspondence management
│   │   ├── models.py          # Letter, Category, ReferenceCounter models
│   │   ├── signals.py         # Letter creation signals
│   │   └── views.py           # Letter operations
│   ├── LLM-fastapi/           # AI integration service
│   │   └── main.py            # FastAPI LLM service
│   ├── backend/               # Django core settings
│   │   ├── settings.py        # Configuration
│   │   ├── urls.py            # URL routing
│   │   ├── wsgi.py            # WSGI application
│   │   └── middleware.py      # Custom middleware
│   ├── templates/             # HTML templates
│   ├── media/                 # User uploads (agreements, signatures)
│   ├── static/                # Static files
│   ├── logs/                  # Application logs
│   ├── manage.py              # Django CLI
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Backend container config
│
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── Pages/             # Page components
│   │   ├── context/           # React context for state management
│   │   ├── utils/             # Utility functions
│   │   ├── assets/            # Images, icons, etc.
│   │   ├── axiosConfig.js     # Axios configuration for backend
│   │   ├── axiosLLMConfig.js  # Axios configuration for LLM
│   │   ├── App.jsx            # Root app component
│   │   └── main.jsx           # Entry point
│   ├── public/                # Public static assets
│   ├── package.json           # Node dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── nginx.conf             # Nginx configuration
│   └── Dockerfile             # Frontend container config
│
├── docker-compose.yml         # Multi-container orchestration
└── README.md                  # This file
```

## 🔑 Key Features

### User & Access Management
- **Custom User Model** with email-based authentication
- **Department-based Organization** structure
- **Role-based Access Control** (RBAC) with permissions system
- **Signatory Management** for document signing
- **Recipient Management** for correspondence routing

### Agreement Management
- **Multiple Agreement Types** (customizable)
- **Status Tracking** (Ongoing, Expired)
- **Date-based Tracking** with automatic status updates
- **Attachment Support** for agreement documents
- **Vendor/Organization Linking** for better context
- **Automated Reminders** for expiring agreements

### Letter/Correspondence System
- **Reference Number Generation** with year-based counters
- **Category-based Organization**
- **Recipient Distribution** tracking
- **Attachment Management** for outgoing correspondence
- **Document Generation** with PDF export
- **Signature Integration** for authorized correspondence

### Automated Workflows
- **Scheduled Tasks** using Ofelia (runs agreement updates daily at 9:30 AM)
- **Email Notifications** for user creation and agreement updates
- **Signal Handlers** for automatic document operations
- **Batch Processing** for large-scale operations

### API Features
- **RESTful API** with JWT authentication
- **CORS Support** for cross-origin requests
- **Filtering & Pagination** for large datasets
- **Email Integration** for notifications
- **Admin Dashboard** for data management

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Git
- (Optional) Python 3.9+ and Node.js 18+ for local development

### Installation & Setup

#### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ats_papertrail
   ```

2. **Configure environment variables**
   - Create a `.env` file in the backend directory with necessary configurations:
     ```
     DB_HOST=db
     DB_NAME=atm
     DB_USER=root
     DB_PASSWORD=root
     DJANGO_SUPERUSER_EMAIL=admin@sonali.com
     DJANGO_SUPERUSER_PASSWORD=admin12345@
     ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8003
   - Django Admin: http://localhost:8003/admin

### Local Development Setup

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver 0.0.0.0:8003
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 📚 API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token
- `POST /api/users/` - Create new user

### Agreements
- `GET/POST /api/agreements/` - List/Create agreements
- `GET/PUT/DELETE /api/agreements/{id}/` - Retrieve/Update/Delete agreement
- `GET /api/agreements/by-organization/{org_id}/` - Get agreements by organization
- `GET /api/agreement-types/` - List agreement types

### Letters
- `GET/POST /api/letters/` - List/Create letters
- `GET/PUT/DELETE /api/letters/{id}/` - Retrieve/Update/Delete letter
- `GET /api/categories/` - List letter categories

### Users & Organizations
- `GET/POST /api/users/` - List/Create users
- `GET/PUT /api/users/{id}/` - Retrieve/Update user
- `GET/POST /api/organizations/` - List/Create organizations
- `GET /api/departments/` - List departments

## 🔄 Automated Processes

### Agreement Update Task
- **Schedule:** Daily at 9:30 AM (configurable in docker-compose.yml)
- **Command:** `python manage.py update_agreements`
- **Function:** Automatically updates agreement statuses based on expiry dates
- **Scheduler:** Ofelia (runs in Docker container)

### Email Notifications
- User creation notifications sent to new users with temporary passwords
- Admin notifications for new user accounts
- Agreement expiration reminders (configurable)

## 🔐 Security Features

- **JWT Token Authentication** with sliding token refresh
- **CORS Security** configured for allowed origins
- **CSRF Protection** enabled
- **Role-based Permissions** preventing unauthorized access
- **Password Management** with secure hashing
- **Email Validation** for user accounts

## 📊 Database Models

### Core Models

**User** - Custom user model with department affiliation
- email, full_name, department, is_active, is_staff, is_superuser

**Organization** - Vendor/Partner organizations
- name, short_form, organization_type, contact_person

**Department** - Internal organizational departments
- name, description, executive status, timestamps

**Agreement** - Main agreement entities
- title, agreement_type, party_name, status, dates, attachments

**Letter** - Official correspondence
- organization, created_by, category, reference_number, recipients

**ReferenceCounter** - Automatic reference number tracking
- organization, year, last_number

## 🛠️ Management Commands

```bash
# Update agreement statuses
python manage.py update_agreements

# Create test data
python manage.py create_test_user
python manage.py create_test_agreements

# Database operations
python manage.py migrate
python manage.py makemigrations
python manage.py export_db
python manage.py backup_vendors
```

## 📝 Configuration

### Django Settings
- Located in: `backend/backend/settings.py`
- Installed apps, middleware, database, email settings, JWT configuration

### Docker Compose Configuration
- Services: Backend, Frontend, Database, Ofelia Scheduler
- Networks: app-network for inter-service communication
- Volumes: data persistence for database, media, and static files

### Environment Variables
- Database credentials (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
- Superuser credentials (DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD)
- API keys and secrets (in .env file - not committed)

## 🐛 Troubleshooting

### Common Issues

**Database connection errors:**
- Ensure MySQL is running in Docker
- Check DB_HOST, DB_NAME, DB_USER, DB_PASSWORD in environment variables

**Frontend can't connect to API:**
- Verify backend is running (check port 8003)
- Check CORS configuration in Django settings
- Verify axios configuration in frontend

**Task scheduling not working:**
- Ensure Ofelia container is running: `docker-compose ps`
- Check logs: `docker logs ofelia_scheduler`
- Verify command format in docker-compose.yml labels

**Media/Static files not loading:**
- Run `python manage.py collectstatic` for production
- Check media/static volume mounts in docker-compose.yml

## 📦 Dependencies Management

### Backend Python Packages
- Django & DRF (REST framework)
- MySQLclient (database driver)
- Celery compatible dependencies
- FastAPI for LLM service
- Ollama for AI/ML capabilities

### Frontend npm Packages
- React, React Router
- Material-UI components
- Form handling (React Hook Form)
- Data visualization (Chart.js, Recharts)
- PDF generation (React-PDF)

## 🚢 Deployment

### Docker Deployment
All services are containerized and can be deployed using docker-compose:
- Backend: Runs on gunicorn
- Frontend: Served via Nginx
- Database: MySQL in container
- Task Scheduler: Ofelia for automated tasks

### Production Considerations
- Change DEBUG to False in settings.py
- Update ALLOWED_HOSTS with actual domain
- Use secure SECRET_KEY
- Configure proper email settings for notifications
- Set up SSL/TLS certificates
- Configure database backups
- Set up proper logging and monitoring

## Helpful Documentations for React and Django

- Django Documentation: https://docs.djangoproject.com/
- React Documentation: https://react.dev/
- Django REST Framework: https://www.django-rest-framework.org/
- Material-UI: https://mui.com/

## 📄 License

This was an internship project devloped and deployed by Md. Mostaqeem Billah


## 📅 Version History

  - Initial development version
  - Core agreement management system
  - User authentication and role-based access
  - Letter/correspondence tracking
  - Automated task scheduling
  - LLM integration for AI capabilities

---

**Last Updated:** February 14, 2026
