# backup_vendors.py
import json
from datetime import datetime
from django.core.serializers.json import DjangoJSONEncoder
from accounts.models import Vendor

def backup_vendors():
    vendors = Vendor.objects.all()
    
    data = []
    for vendor in vendors:
        data.append({
            'name': vendor.name,
            'address': vendor.address,
            'email': vendor.email,
            'phone_number': vendor.phone_number,
            'contact_person_name': vendor.contact_person_name,
            'contact_person_designation': vendor.contact_person_designation,
            'created_at': vendor.created_at.isoformat(),
            'updated_at': vendor.updated_at.isoformat(),
            'id': vendor.id,  # Store original ID if needed
        })
    
    # Save to JSON file
    filename = f'vendor_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(filename, 'w') as f:
        json.dump(data, f, cls=DjangoJSONEncoder, indent=2)
    
    print(f"Backup saved to {filename}")
    print(f"Total vendors backed up: {len(data)}")
    return filename