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
from accounts.models import User, Department, Vendor

def create_test_agreements():
    try:
        # Get or create test data
        test_user = User.objects.first()
        test_department = Department.objects.first()
        test_type = AgreementType.objects.first()
        test_vendor = Vendor.objects.first()

        if not all([test_user, test_department, test_type, test_vendor]):
            print("Missing required test data. Please ensure you have at least one user, department, agreement type, and vendor.")
            return

        # Create agreements with different expiry dates
        today = timezone.now().date()
        
        # Agreement expiring in 7 days
        seven_day_agreement = Agreement.objects.create(
            title="Test Agreement - 7 Days",
            agreement_reference="TEST-7D",
            department=test_department,
            agreement_type=test_type,
            party_name=test_vendor,
            start_date=today,
            expiry_date=today + timedelta(days=7),
            creator=test_user
        )
        seven_day_agreement.assigned_users.add(test_user)

        # Agreement expiring in 1 month
        one_month_agreement = Agreement.objects.create(
            title="Test Agreement - 1 Month",
            agreement_reference="TEST-1M",
            department=test_department,
            agreement_type=test_type,
            party_name=test_vendor,
            start_date=today,
            expiry_date=today + timedelta(days=30),
            creator=test_user
        )
        one_month_agreement.assigned_users.add(test_user)

        # Agreement expiring today
        expiring_today = Agreement.objects.create(
            title="Test Agreement - Expiring Today",
            agreement_reference="TEST-TODAY",
            department=test_department,
            agreement_type=test_type,
            party_name=test_vendor,
            start_date=today - timedelta(days=30),
            expiry_date=today,
            creator=test_user
        )
        expiring_today.assigned_users.add(test_user)

        print("✅ Test agreements created successfully!")
        print("\nCreated Agreements:")
        print(f"1. 7-day agreement (ID: {seven_day_agreement.id})")
        print(f"2. 1-month agreement (ID: {one_month_agreement.id})")
        print(f"3. Today's expiry agreement (ID: {expiring_today.id})")

    except Exception as e:
        print(f"❌ Error creating test agreements: {str(e)}")

if __name__ == "__main__":
    print("Creating test agreements...")
    create_test_agreements()
    print("\nDone!")    DATABASES = {
        'default': {
            'PORT': 8000,  // Database port configuration
        }
    }