from django.utils import timezone
from django.db import models
from django.core.exceptions import ValidationError
from django.db import transaction
from accounts.models import User, Signatory, Organization, Recipient

class Category(models.Model):
    name = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    


class ReferenceCounter(models.Model):
    """
    Tracks incremental numbers for reference numbers per year per organization
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        related_name='reference_counters',
        null=True,
        blank=True
    )
    year = models.IntegerField(unique=True)
    last_number = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'letters_reference_counter'
        unique_together = ['organization', 'year']
    
    def __str__(self):
        return f"{self.organization.short_form}/{self.year}: {self.last_number}"

class Letter(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='outgoing_letters',
        null=True
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='authored_letters',
        null=True
    )
    recipient = models.ForeignKey(
        Recipient,
        on_delete=models.CASCADE,
        related_name='received_letters',
        null=True
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='letters',
        null=True
    )
    signatory = models.ForeignKey(
        Signatory,
        on_delete=models.CASCADE,
        related_name='signed_letters',
        null=True
    )
    subject = models.CharField(max_length=300)
    body = models.TextField()
    attachmentTitle = models.CharField(max_length=155, blank=True, null=True)
    attachment = models.FileField(upload_to='letter_attachments/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    use_recipient_name = models.BooleanField(default=False)
    use_cc_name = models.BooleanField(default=False)
    use_digital_signature = models.BooleanField(default=False)
    use_digital_letterhead = models.BooleanField(default=False)

    # Reference number field
    reference_number = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        editable=False,
        help_text="Auto-generated reference number",
        default=''  # Add default to handle existing records
    )

    def __str__(self):
        return self.reference_number or f"Letter to {self.recipient.name} - {self.subject}"
    
    def clean(self):
        """Validate required fields before generating reference"""
        if not self.category:
            raise ValidationError("Category must be set before generating reference number")
        if not self.organization:
            raise ValidationError("Organization must be set")
        if not self.recipient:
            raise ValidationError("Recipient must be set")
        if not self.recipient.organization:
            raise ValidationError("Recipient must have an organization")

    def generate_reference_number(self):
        """
        Generate reference number in format: 
        [Sender's Short Form]/[Recipient's Organization Short Form]/[Category Name]/[Current Year]/[Incremental Number]
        """
        current_year = self.created_at.year
        
        # Get sender's short form from organization (static)
        # sender_short_form = self.organization.short_form
        sender_short_form = 'SIL'
        
        # Get recipient's ORGANIZATION short form (dynamic) - CORRECTED
        recipient_org_short_form = self.recipient.organization.short_form
        
        # Get category name (using Category model's name field)
        category_name = self.category.name.upper()
        
        # Use database transaction to prevent race conditions
        with transaction.atomic():
            # Get or create counter for current year and organization
            counter, created = ReferenceCounter.objects.select_for_update().get_or_create(
                # organization=self.organization,
                year=current_year,
                defaults={'last_number': 0}
            )
            
            # Increment the counter
            counter.last_number += 1
            counter.save()
            
            # Format the incremental number with leading zeros
            incremental_number = str(counter.last_number).zfill(4)
            
            # Build the reference number
            reference_number = (
                f"{sender_short_form}/"
                f"{recipient_org_short_form}/"
                f"{category_name}/"
                f"{current_year}/"
                f"{incremental_number}"
            )
            
            return reference_number
        

    @classmethod
    def get_tentative_reference_number(cls, organization_id, recipient_id, category_id, date=None):
        """
        Calculates the tentative reference number based on inputs, 
        without incrementing the ReferenceCounter.
        """
        # Import models locally to avoid circular dependencies if necessary
        from .models import Organization, Recipient, Category, ReferenceCounter
        from datetime import datetime
        
        # Extract year from the provided date, or use current year if not provided
        if date:
            try:
                # Parse the date string to get the year
                if isinstance(date, str):
                    date_obj = datetime.fromisoformat(date.replace('Z', '+00:00'))
                else:
                    date_obj = date
                current_year = date_obj.year
            except (ValueError, AttributeError):
                current_year = timezone.now().year
        else:
            current_year = timezone.now().year
        
        # 1. Look up necessary objects (using the IDs passed from the frontend)
        try:
            sender_org = Organization.objects.get(pk=organization_id)
            recipient = Recipient.objects.get(pk=recipient_id)
            category = Category.objects.get(pk=category_id)
        except (Organization.DoesNotExist, Recipient.DoesNotExist, Category.DoesNotExist):
            # Raise an error if any required ID is missing/invalid
            raise ValueError("Missing or invalid IDs for generation.")

        # 2. Extract components
        sender_short_form = 'SIL' # Keep consistent with your existing logic
        recipient_org_short_form = recipient.organization.short_form
        category_name = category.name.upper()
        
        # 3. Find the *next* incremental number (read-only)
        try:
            counter = ReferenceCounter.objects.get(
                # organization=sender_org,
                year=current_year,
            )
            # Read the last number and add 1
            next_number = counter.last_number + 1
        except ReferenceCounter.DoesNotExist:
            # If counter doesn't exist yet, the next number is 1
            next_number = 1
            
        # Format the incremental number with leading zeros
        incremental_number = str(next_number).zfill(4)
        
        # 4. Build the reference number
        reference_number = (
            f"{sender_short_form}/"
            f"{recipient_org_short_form}/"
            f"{category_name}/"
            f"{current_year}/"
            f"{incremental_number}"
        )
        
        return reference_number
    
    def save(self, *args, **kwargs):
        """Override save to auto-generate reference number before saving"""
        # Generate reference number only for new letters (when reference_number is empty)
        if not self.reference_number:
            # Validate required fields before generating reference
            self.clean()
            self.reference_number = self.generate_reference_number()
        
        super().save(*args, **kwargs)



class LetterFile(models.Model):
    letter = models.ForeignKey(Letter, on_delete=models.CASCADE, related_name='documents')
    document = models.FileField(upload_to='letter_documents/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']

    def __str__(self):
        return f"Document for {self.letter.reference_number}"


class LetterReferences(models.Model):
    letter = models.ForeignKey(Letter, on_delete=models.CASCADE, related_name='references')
    internal_reference_number = models.ForeignKey(Letter, on_delete=models.CASCADE, related_name='internal_references', null=True, blank=True)
    external_reference_number = models.CharField(max_length=100)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"Reference for Letter ID {self.letter.id}"

class LetterCopyRecipient(models.Model):
    letter = models.ForeignKey(Letter, on_delete=models.CASCADE, related_name='cc_recipients')
    recipient = models.ForeignKey(Recipient, on_delete=models.CASCADE, null=True, blank=True)  
    MyOrgRecipient = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        recipient_name = self.recipient.name if self.recipient else (self.MyOrgRecipient.full_name if self.MyOrgRecipient else "Unknown")
        return f"CC: {recipient_name} for Letter ID {self.letter.id}"
    


class AdditionalLetterAttachment(models.Model):
    letter = models.ForeignKey(
        Letter, 
        on_delete=models.CASCADE, 
        related_name='attachments'
    )
    file = models.FileField(upload_to='letter_attachments/%Y/%m/%d/')
    title = models.CharField(max_length=155, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size = models.PositiveIntegerField(editable=False, null=True)
    file_type = models.CharField(max_length=50, editable=False, blank=True)
    class Meta:
        verbose_name = 'Letter Attachment'
        verbose_name_plural = 'Letter Attachments'
        ordering = ['uploaded_at']
    
    def __str__(self):
        return self.title or f"Attachment for {self.letter.reference_number}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate file size and type before saving
        if self.file:
            self.file_size = self.file.size
            # Extract file extension
            import os
            filename = self.file.name
            ext = os.path.splitext(filename)[1].lower()
            self.file_type = ext[1:] if ext else 'unknown'
        
        # Auto-generate title from filename if not provided
        if not self.title and self.file:
            self.title = os.path.basename(self.file.name)
            
        super().save(*args, **kwargs)
    
    @property
    def file_size_human(self):
        """Return human-readable file size"""
        if self.file_size:
            size = self.file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
        return "0 B"
