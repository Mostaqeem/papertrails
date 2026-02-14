# management/commands/update_agreements.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from agreements.models import Agreement

class Command(BaseCommand):
    help = 'Updates statuses and sends reminders'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # 1. Update statuses for everything that expired before today or today
        expired_count = Agreement.objects.filter(
            expiry_date__lte=today, 
            status='Ongoing'
        ).update(status='Expired')

        # 2. Trigger reminders for all agreements (both Ongoing and Expired)
        agreements = Agreement.objects.filter(status__in=['Ongoing', 'Expired'])
        for agreement in agreements:
            agreement.check_and_send_reminders()

        self.stdout.write(f"Updated {expired_count} agreements to Expired.")