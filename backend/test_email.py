import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from accounts.models import User
from agreements.utils.email_utils import send_user_creation_notification, send_admin_user_creation_notification
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_basic_email():
    """Test basic email functionality"""
    try:
        logger.info("Testing basic email sending...")
        send_mail(
            'Test Email',
            'This is a test email.',
            settings.DEFAULT_FROM_EMAIL,
            ['noreply@sonaliintellect.com'],  # Using the same email as DEFAULT_FROM_EMAIL
            fail_silently=False,
        )
        logger.info("Basic email test completed successfully")
    except Exception as e:
        logger.error(f"Basic email test failed: {str(e)}")

def test_template_rendering():
    """Test template rendering"""
    try:
        logger.info("Testing template rendering...")
        context = {
            'user_full_name': 'Test User',
            'user_email': 'test@example.com',
            'temporary_password': 'testpass123',
            'department': 'Test Department',
            'role': 'Test Role',
            'login_url': '/login/',
            'company_name': 'Test Company',
            'support_email': 'support@example.com',
            'support_phone': '123-456-7890',
        }
        
        # Try to render the template
        html_content = render_to_string('emails/user_creation_notification.html', context)
        logger.info("Template rendering successful")
        return True
    except Exception as e:
        logger.error(f"Template rendering failed: {str(e)}")
        return False

def verify_email_settings():
    """Verify email settings configuration"""
    required_settings = [
        'EMAIL_BACKEND',
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_HOST_USER',
        'EMAIL_HOST_PASSWORD',
        'DEFAULT_FROM_EMAIL'
    ]
    
    logger.info("Verifying email settings...")
    for setting in required_settings:
        value = getattr(settings, setting, None)
        if value:
            logger.info(f"{setting} is configured")
        else:
            logger.error(f"{setting} is missing or not configured")

def main():
    logger.info("Starting email configuration test")
    
    # Verify settings
    verify_email_settings()
    
    # Test template rendering
    template_ok = test_template_rendering()
    if not template_ok:
        logger.error("Template rendering failed. Check template path and content")
        return
    
    # Test basic email
    test_basic_email()

if __name__ == "__main__":
    main()