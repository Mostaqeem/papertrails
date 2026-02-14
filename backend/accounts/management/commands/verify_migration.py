# verify_migration.py
import json
from django.core.management.base import BaseCommand
from accounts.models import Organization, Recipient, OrganizationType
from agreements.models import Agreement

class Command(BaseCommand):
    help = 'Verify vendor to organization migration'
    
    def handle(self, *args, **options):
        # Load original backup
        with open('vendor_backup_20260112_163001.json', 'r') as f:
            original_data = json.load(f)
        
        print("=" * 70)
        print("MIGRATION VERIFICATION")
        print("=" * 70)
        
        # Check OrganizationType
        vendor_type = OrganizationType.objects.filter(type_name='Vendor').first()
        if vendor_type:
            print(f"✅ OrganizationType 'Vendor' exists")
        else:
            print(f"❌ OrganizationType 'Vendor' not found")
        
        # Check Organizations
        print(f"\nORGANIZATIONS:")
        print(f"Expected (from backup): {len(original_data)}")
        print(f"Actual (in database): {Organization.objects.count()}")
        
        # Compare each vendor with organization
        for vendor in original_data:
            vendor_email = vendor.get('email')
            org = Organization.objects.filter(email=vendor_email).first()
            
            if org:
                print(f"\n✅ {vendor['name']}")
                print(f"   Email: {org.email}")
                print(f"   Type: {org.organization_type.type_name if org.organization_type else 'None'}")
                
                # Check recipient
                recipient = Recipient.objects.filter(organization=org).first()
                if recipient:
                    print(f"   Contact: {recipient.name} ({recipient.designation})")
                else:
                    print(f"   Contact: No recipient created")
            else:
                print(f"\n❌ {vendor['name']} - NOT MIGRATED")
        
        # Check agreements
        print(f"\nAGREEMENTS:")
        total_agreements = Agreement.objects.count()
        agreements_with_org = Agreement.objects.filter(party_name__isnull=False).count()
        print(f"Total agreements: {total_agreements}")
        print(f"Agreements with organization: {agreements_with_org}")
        print(f"Agreements without organization: {total_agreements - agreements_with_org}")
        
        # Display sample agreements
        print(f"\nSAMPLE AGREEMENTS:")
        for agreement in Agreement.objects.all()[:5]:
            org_name = agreement.party_name.name if agreement.party_name else "NO ORGANIZATION"
            print(f"  {agreement.agreement_id}: {org_name}")
        
        print("\n" + "=" * 70)