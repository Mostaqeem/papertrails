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

def test_specific_agreements():
    # Replace these with the actual IDs from the created test agreements
    agreement_ids = [74]  # Update these with the IDs from your test agreements
    test_email = "mostaqeem.billah@sonaliintellect.com"  # Replace with your email
    
    try:
        # Get the test user
        test_user = User.objects.filter(email=test_email).first()
        
        if not test_user:
            print(f"No user found with email {test_email}")
            return

        # Test each agreement
        for agreement_id in agreement_ids:
            try:
                agreement = Agreement.objects.get(id=agreement_id)
                print(f"\nTesting Agreement: {agreement.title}")
                print(f"Expiry Date: {agreement.expiry_date}")
                print(f"Days until expiry: {(agreement.expiry_date - timezone.now().date()).days}")
                
                # Send test reminder
                # success = send_agreement_reminder(
                #     agreement=agreement,
                #     user=test_user,
                #     reminder_type='before',
                #     time_remaining="Scheduled reminder test"
                # )
                success = Agreement.send_agreement_reminder_notification(
                    agreement=agreement,
                    reminder_type='before'
                )
                if success:
                    print(f"✅ Successfully sent reminder for agreement {agreement_id}")
                else:
                    print(f"❌ Failed to send reminder for agreement {agreement_id}")
                    
            except Agreement.DoesNotExist:
                print(f"Agreement with ID {agreement_id} not found")
            except Exception as e:
                print(f"Error testing agreement {agreement_id}: {str(e)}")
                
    except Exception as e:
        print(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    print("Testing specific agreements...")
    test_specific_agreements()
    print("\nTest completed!")