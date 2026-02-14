import os
import django
import sys
from datetime import datetime, timedelta
from django.utils import timezone

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from agreements.models import Agreement
from accounts.models import User
from agreements.utils.email_utils import send_agreement_reminder

def test_agreement_reminder():
    try:
        # Get a test agreement
        test_agreement = Agreement.objects.first()
        
        if not test_agreement:
            print("No agreements found in the database")
            return
            
        # Print agreement details
        print(f"\nTesting reminders for agreement:")
        print(f"Title: {test_agreement.title}")
        print(f"ID: {test_agreement.id}")
        print(f"Department: {test_agreement.department.name if test_agreement.department else 'N/A'}")
        print(f"Expiry Date: {test_agreement.expiry_date}")
        
        # Get associated users
        recipients = test_agreement.get_users_to_notify()
        recipient_emails = [user.email for user in recipients if user.email]
        print(f"\nWill send reminders to {len(recipient_emails)} users:")
        for email in recipient_emails:
            print(f"- {email}")
            
        # Try to send different types of reminders
        reminder_types = ['before', 'on', 'after']
        
        for reminder_type in reminder_types:
            print(f"\nTesting {reminder_type} reminder...")
            success = send_agreement_reminder(
                agreement=test_agreement,
                reminder_type=reminder_type,
                months_since_expiration=3 if reminder_type == 'after' else None,
                time_remaining="7 days" if reminder_type == 'before' else None
            )
            
            if success:
                print(f"✅ Successfully sent {reminder_type} reminder to all recipients")
            else:
                print(f"❌ Failed to send {reminder_type} reminder")
    except Exception as e:
        print(f"Error during test: {str(e)}")

if __name__ == "__main__":
    print("Starting agreement reminder email test...")
    test_agreement_reminder()
    print("\nTest completed!")