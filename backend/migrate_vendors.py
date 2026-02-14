# migrate_vendors.py
from accounts.models import OldVendor, Organization, OrganizationType, Recipient

def migrate_vendors_to_organizations():
    # Get or create a default organization type for vendors
    vendor_type, created = OrganizationType.objects.get_or_create(
        type_name='Vendor',
        defaults={'description': 'Vendor organizations migrated from old system'}
    )
    
    migrated_count = 0
    skipped_count = 0
    
    for old_vendor in OldVendor.objects.all():
        try:
            # Check if organization with same email already exists
            if Organization.objects.filter(email=old_vendor.email).exists():
                print(f"Skipping {old_vendor.name} - email {old_vendor.email} already exists")
                skipped_count += 1
                continue
            
            # Create Organization
            org = Organization.objects.create(
                name=old_vendor.name,
                short_form=old_vendor.name[:50].replace(' ', '_').upper(),  # Generate short form
                address=old_vendor.address,
                email=old_vendor.email,
                organization_type=vendor_type
            )
            
            # Create Recipient if contact person exists
            if old_vendor.contact_person_name:
                recipient_email = f"{old_vendor.contact_person_name.lower().replace(' ', '.')}@{old_vendor.email.split('@')[-1]}"
                
                # Ensure unique email for recipient
                counter = 1
                original_email = recipient_email
                while Recipient.objects.filter(email=recipient_email).exists():
                    recipient_email = f"{original_email.split('@')[0]}{counter}@{original_email.split('@')[1]}"
                    counter += 1
                
                Recipient.objects.create(
                    name=old_vendor.contact_person_name,
                    email=recipient_email,
                    organization=org,
                    designation=old_vendor.contact_person_designation or 'Contact Person',
                    phone_number=old_vendor.phone_number
                )
            
            migrated_count += 1
            print(f"Migrated: {old_vendor.name}")
            
        except Exception as e:
            print(f"Error migrating {old_vendor.name}: {str(e)}")
            skipped_count += 1
    
    print(f"\nMigration Summary:")
    print(f"Total old vendors: {OldVendor.objects.count()}")
    print(f"Successfully migrated: {migrated_count}")
    print(f"Skipped: {skipped_count}")
    print(f"New organizations created: {Organization.objects.count()}")
    print(f"New recipients created: {Recipient.objects.count()}")
    
    return migrated_count