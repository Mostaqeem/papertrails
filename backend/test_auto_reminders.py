import os
import django
import sys
from datetime import datetime, timedelta
from django.utils import timezone

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from agreements.models import Agreement, AgreementType
from accounts.models import Department, User, Vendor

def test_agreement_reminders():
    try:
        # Get test data
        test_type = AgreementType.objects.first()
        test_department = Department.objects.first()
        test_vendor = Vendor.objects.first()
        test_user = User.objects.first()

        if not all([test_type, test_department, test_vendor, test_user]):
            print("Error: Missing required test data")
            return

        today = timezone.now().date()
        
        # Test cases with different expiry dates
        test_cases = [
            {
                'title': "30-Day Reminder Test",
                'expiry_date': today + timedelta(days=30),
                'expected_reminder': "1-month reminder"
            },
            {
                'title': "7-Day Reminder Test",
                'expiry_date': today + timedelta(days=7),
                'expected_reminder': "7-day reminder"
            },
            {
                'title': "Today Expiry Test",
                'expiry_date': today,
                'expected_reminder': "expiry day reminder"
            },
            {
                'title': "After Expiry Test",
                'expiry_date': today - timedelta(days=32),
                'expected_reminder': "after-expiry reminder"
            }
        ]

        for case in test_cases:
            print(f"\nCreating test agreement: {case['title']}")
            agreement = Agreement.objects.create(
                title=case['title'],
                agreement_type=test_type,
                department=test_department,
                party_name=test_vendor,
                start_date=today - timedelta(days=30),
                expiry_date=case['expiry_date'],
                creator=test_user,
                reminder_time=today
            )
            agreement.assigned_users.add(test_user)
            print(f"Created agreement ID: {agreement.id}")
            print(f"Expiry date: {agreement.expiry_date}")
            print(f"Expected reminder: {case['expected_reminder']}")

            # Update expiry date to trigger reminder check
            print("Testing reminder by updating expiry date...")
            agreement.expiry_date = case['expiry_date']
            agreement.save()

    except Exception as e:
        print(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    print("Starting agreement reminder tests...")
    test_agreement_reminders()
    print("\nTests completed!")