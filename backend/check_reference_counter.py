import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from letters.models import ReferenceCounter

print('=== ReferenceCounter Data ===')
counters = ReferenceCounter.objects.all()
print(f'Total records: {counters.count()}')
for counter in counters:
    print(f'Organization: {counter.organization.name}, Year: {counter.year}, Last Number: {counter.last_number}')

print('\n=== Deleting all ReferenceCounter records ===')
ReferenceCounter.objects.all().delete()
print('All ReferenceCounter records deleted!')

print('\nVerifying deletion...')
counters = ReferenceCounter.objects.all()
print(f'Total records after deletion: {counters.count()}')
