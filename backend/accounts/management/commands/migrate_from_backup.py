# migrate_from_backup.py
import json
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import Organization, OrganizationType, Recipient
from agreements.models import Agreement
import re

class Command(BaseCommand):
    help = 'Migrate vendors from JSON backup to Organization/Recipient schema'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='vendor_backup_20260112_163001.json',
            help='Path to JSON backup file'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )
    
    def handle(self, *args, **options):
        json_file = options['file']
        dry_run = options['dry_run']
        
        self.stdout.write("=" * 70)
        self.stdout.write("VENDOR BACKUP MIGRATION TO ORGANIZATION SCHEMA")
        self.stdout.write("=" * 70)
        
        # Step 1: Load and validate JSON
        vendors_data = self.load_vendor_data(json_file)
        if vendors_data is None:
            return
        
        self.stdout.write(f"✅ Loaded {len(vendors_data)} vendors from backup")
        
        # Step 2: Get or create OrganizationType
        org_type = self.get_or_create_organization_type(dry_run)
        if not org_type and not dry_run:
            self.stderr.write("❌ Failed to create organization type")
            return
        
        # Step 3: Process each vendor
        migration_results = self.process_vendors(
            vendors_data, org_type, dry_run
        )
        
        # Step 4: Update Agreements
        agreements_updated = self.update_agreements(
            vendors_data, migration_results, dry_run
        )
        
        # Step 5: Display summary
        self.display_summary(migration_results, agreements_updated, dry_run)
        
        if dry_run:
            self.stdout.write("\n" + "=" * 70)
            self.stdout.write("⚠️  DRY RUN COMPLETE - No changes were made")
            self.stdout.write("Run without --dry-run to execute migration")
            self.stdout.write("=" * 70)
    
    def load_vendor_data(self, json_file):
        """Load vendor data from JSON file"""
        if not os.path.exists(json_file):
            self.stderr.write(f"❌ JSON file not found: {json_file}")
            self.stderr.write(f"Current directory: {os.getcwd()}")
            self.stderr.write(f"Available files: {os.listdir('.')}")
            return None
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle different JSON formats
            if isinstance(data, list):
                return data
            elif isinstance(data, dict) and 'data' in data:
                return data['data']
            else:
                self.stderr.write(f"❌ Unexpected JSON format in {json_file}")
                return None
                
        except json.JSONDecodeError as e:
            self.stderr.write(f"❌ Invalid JSON in {json_file}: {str(e)}")
            return None
        except Exception as e:
            self.stderr.write(f"❌ Error reading {json_file}: {str(e)}")
            return None
    
    def get_or_create_organization_type(self, dry_run=False):
        """Get or create vendor organization type"""
        type_name = 'Vendor'
        description = 'Migrated from vendor backup system'
        
        if dry_run:
            self.stdout.write(f"Would create/get OrganizationType: '{type_name}'")
            return type_name
        
        try:
            org_type, created = OrganizationType.objects.get_or_create(
                type_name=type_name,
                defaults={'description': description}
            )
            
            if created:
                self.stdout.write(f"✅ Created OrganizationType: '{type_name}'")
            else:
                self.stdout.write(f"ℹ️ Using existing OrganizationType: '{type_name}'")
            
            return org_type
            
        except Exception as e:
            self.stderr.write(f"❌ Error creating OrganizationType: {str(e)}")
            return None
    
    def generate_short_form(self, name):
        """Generate short form from organization name"""
        if not name:
            return "UNKNOWN"
        
        # Remove special characters and extra spaces
        clean_name = re.sub(r'[^\w\s]', '', str(name))
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()
        
        words = clean_name.split()
        
        # Handle common cases
        if len(words) == 0:
            return "ORG"
        elif len(words) == 1:
            # Take first 8 characters
            return clean_name[:8].upper()
        elif len(words) >= 3:
            # Use first letter of first three words
            return ''.join(word[0] for word in words[:3]).upper()
        else:
            # Use first letters of available words
            return ''.join(word[0] for word in words).upper()
    
    def generate_recipient_email(self, contact_name, org_email, contact_email=None):
        """Generate recipient email address"""
        # If contact has email in data, use it
        if contact_email:
            return contact_email
        
        # Generate from contact name and organization domain
        if not contact_name or not org_email or '@' not in org_email:
            return None
        
        try:
            domain = org_email.split('@')[1]
            safe_name = contact_name.lower().strip()
            
            # Remove special characters from name
            safe_name = re.sub(r'[^\w\s]', '', safe_name)
            safe_name = re.sub(r'\s+', '.', safe_name)
            
            # Remove multiple dots
            safe_name = re.sub(r'\.+', '.', safe_name)
            
            return f"{safe_name}@{domain}"
        except:
            return None
    
    def get_short_designation(self, designation):
        """Generate short designation"""
        if not designation:
            return None
        
        designation_lower = designation.lower().strip()
        
        # Common abbreviations
        abbreviations = {
            'manager': 'Mgr',
            'director': 'Dir',
            'president': 'Pres',
            'chief executive officer': 'CEO',
            'chief financial officer': 'CFO',
            'chief operating officer': 'COO',
            'vice president': 'VP',
            'assistant': 'Asst',
            'executive': 'Exec',
            'officer': 'Off',
            'head': 'Hd',
            'lead': 'Ld',
            'senior': 'Sr',
            'junior': 'Jr',
        }
        
        # Check for exact matches or contains
        for key, value in abbreviations.items():
            if key == designation_lower or key in designation_lower:
                return value
        
        # Default: take first 3-5 letters
        return designation[:5].title()
    
    def parse_timestamp(self, timestamp_str):
        """Parse ISO timestamp string to timezone-aware datetime"""
        if not timestamp_str:
            return timezone.now()
        
        try:
            # Handle different timestamp formats
            timestamp_str = timestamp_str.replace('Z', '+00:00')
            return timezone.make_aware(datetime.fromisoformat(timestamp_str))
        except:
            return timezone.now()
    
    def process_vendors(self, vendors_data, org_type, dry_run=False):
        """Process each vendor and create Organization/Recipient"""
        results = {
            'organizations_created': 0,
            'organizations_existing': 0,
            'organizations_failed': 0,
            'recipients_created': 0,
            'recipients_existing': 0,
            'recipients_failed': 0,
            'mapping': {}  # old_vendor_id -> new_organization
        }
        
        for vendor in vendors_data:
            vendor_id = vendor.get('id')
            vendor_name = vendor.get('name', f'Vendor {vendor_id}')
            
            self.stdout.write(f"\n📋 Processing: {vendor_name}")
            
            # Extract vendor data
            vendor_email = vendor.get('email')
            if not vendor_email:
                self.stderr.write(f"  ❌ Skipping - No email address")
                results['organizations_failed'] += 1
                continue
            
            # Check if organization already exists
            existing_org = None
            if not dry_run:
                existing_org = Organization.objects.filter(email=vendor_email).first()
            
            if existing_org:
                self.stdout.write(f"  ℹ️ Organization already exists: {existing_org.name}")
                results['organizations_existing'] += 1
                results['mapping'][vendor_id] = existing_org
                continue
            
            # Prepare organization data
            org_data = {
                'name': vendor.get('name', 'Unknown Vendor'),
                'short_form': self.generate_short_form(vendor.get('name')),
                'address': vendor.get('address', 'Address not specified'),
                'email': vendor_email,
                'organization_type': org_type,
            }
            
            # Add timestamps if available
            created_at = self.parse_timestamp(vendor.get('created_at'))
            updated_at = self.parse_timestamp(vendor.get('updated_at'))
            
            if dry_run:
                self.stdout.write(f"  Would create Organization:")
                for key, value in org_data.items():
                    if key != 'organization_type':
                        self.stdout.write(f"    {key}: {value}")
                results['organizations_created'] += 1
                continue
            
            # Create Organization
            try:
                org = Organization.objects.create(
                    **org_data,
                    created_at=created_at,
                    updated_at=updated_at
                )
                self.stdout.write(f"  ✅ Created Organization: {org.name}")
                results['organizations_created'] += 1
                results['mapping'][vendor_id] = org
                
                # Create Recipient if contact person exists
                contact_name = vendor.get('contact_person_name')
                if contact_name:
                    recipient_data = {
                        'name': contact_name,
                        'organization': org,
                        'designation': vendor.get('contact_person_designation') or 'Contact Person',
                        'phone_number': vendor.get('phone_number'),
                        'short_designation': self.get_short_designation(
                            vendor.get('contact_person_designation')
                        ),
                    }
                    
                    # Generate recipient email
                    recipient_email = self.generate_recipient_email(
                        contact_name, vendor_email
                    )
                    if recipient_email:
                        # Ensure email is unique
                        counter = 1
                        original_email = recipient_email
                        while Recipient.objects.filter(email=recipient_email).exists():
                            base_email = recipient_email.split('@')[0]
                            domain = recipient_email.split('@')[1]
                            recipient_email = f"{base_email}{counter}@{domain}"
                            counter += 1
                        
                        recipient_data['email'] = recipient_email
                    
                    try:
                        recipient = Recipient.objects.create(**recipient_data)
                        self.stdout.write(f"    👤 Created Recipient: {recipient.name}")
                        results['recipients_created'] += 1
                    except Exception as e:
                        self.stderr.write(f"    ❌ Failed to create recipient: {str(e)}")
                        results['recipients_failed'] += 1
                
            except Exception as e:
                self.stderr.write(f"  ❌ Failed to create organization: {str(e)}")
                results['organizations_failed'] += 1
        
        return results
    
    def update_agreements(self, vendors_data, migration_results, dry_run=False):
        """Update agreements to reference new organizations"""
        if dry_run:
            self.stdout.write("\n📝 Would update agreements to use new organizations")
            return 0
        
        agreements_updated = 0
        
        try:
            # Get all agreements
            agreements = Agreement.objects.all()
            
            for agreement in agreements:
                # Check if agreement has old vendor reference
                old_vendor_id = None
                
                # Method 1: Check party_name_id field
                if hasattr(agreement, 'party_name_id') and agreement.party_name_id:
                    old_vendor_id = agreement.party_name_id
                
                # Method 2: Check if party_name is an integer (old vendor ID)
                elif hasattr(agreement, 'party_name') and isinstance(agreement.party_name, int):
                    old_vendor_id = agreement.party_name
                
                if old_vendor_id and old_vendor_id in migration_results['mapping']:
                    new_org = migration_results['mapping'][old_vendor_id]
                    agreement.party_name = new_org
                    agreement.save()
                    agreements_updated += 1
                    self.stdout.write(f"  ✅ Agreement {agreement.agreement_id}: {agreement.party_name.name}")
        
        except Exception as e:
            self.stderr.write(f"❌ Error updating agreements: {str(e)}")
        
        return agreements_updated
    
    def display_summary(self, results, agreements_updated, dry_run=False):
        """Display migration summary"""
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write("MIGRATION SUMMARY")
        self.stdout.write("=" * 70)
        
        if dry_run:
            self.stdout.write("THIS IS A DRY RUN - No changes were made")
            self.stdout.write("-" * 70)
        
        self.stdout.write("ORGANIZATIONS:")
        self.stdout.write(f"  Created: {results['organizations_created']}")
        self.stdout.write(f"  Already existed: {results['organizations_existing']}")
        self.stdout.write(f"  Failed: {results['organizations_failed']}")
        
        self.stdout.write("\nRECIPIENTS:")
        self.stdout.write(f"  Created: {results['recipients_created']}")
        self.stdout.write(f"  Failed: {results['recipients_failed']}")
        
        self.stdout.write(f"\nAGREEMENTS:")
        self.stdout.write(f"  Updated: {agreements_updated}")
        
        total_vendors = (results['organizations_created'] + 
                        results['organizations_existing'] + 
                        results['organizations_failed'])
        
        self.stdout.write("\n" + "=" * 70)
        if not dry_run:
            self.stdout.write("✅ MIGRATION COMPLETE!")
        else:
            self.stdout.write("📋 DRY RUN COMPLETE")
        self.stdout.write("=" * 70)