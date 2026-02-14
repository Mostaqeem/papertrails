from django.db import models
from django.conf import settings
from datetime import datetime, timedelta
from accounts.models import Department, User, Organization
from django.core.exceptions import ValidationError
import os
import uuid
from django.db import transaction, IntegrityError
import logging
from django.utils import timezone
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

def agreement_file_path(instance, filename):
    """Generate file path for agreement attachments"""
    ext = os.path.splitext(filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('agreements', str(instance.agreement_type.id), filename)

class AgreementType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_agreement_types'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name = 'Agreement Type'
        verbose_name_plural = 'Agreement Types'


class Agreement(models.Model):
    # AGREEMENT_STATUS = (
    #     ('ongoing', 'Ongoing'),
    #     ('expired', 'Expired'),
    #     ('draft', 'Draft'),
    #     ('terminated', 'Terminated'),
    # )
    AGREEMENT_STATUS = (
        ('Ongoing', 'Ongoing'),
        ('Expired', 'Expired'),
    )
    
    title = models.CharField(max_length=200)
    agreement_type = models.ForeignKey(
        AgreementType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Type of Agreement'
    )
    remarks = models.TextField(
        blank=True,
        null=True,
        verbose_name='Additional Remarks'
    )
    status = models.CharField(
        max_length=15, 
        choices=AGREEMENT_STATUS, 
        default='Ongoing'  # Changed from lowercase to match choices
    )
    start_date = models.DateField()
    expiry_date = models.DateField()
    # party_name_id = models.IntegerField(null=True, blank=True)  # Temporary field
    party_name = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='agreements',
        verbose_name='Vendor',
        blank=True,
        null=True
    )
    reminder_time = models.DateField(
        help_text="Date when reminders should be sent"
    )
    assigned_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='assigned_agreements',
        blank=True
    )
    attachment = models.FileField(
        upload_to=agreement_file_path,
        max_length=255,
        blank=True,
        null=True
    )
    original_filename = models.CharField(max_length=255, blank=True, null=True)  # <-- Add this
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_agreements'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='department_agreements'
    )
    agreement_id = models.CharField(
        max_length=20, 
        unique=True, 
        editable=False, 
        blank=True
    )
    agreement_reference = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        #unique=True  # Remove if you need to allow duplicates
    )
    parent_agreement = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_agreements',
        verbose_name='Parent Agreement'
    )

    def clean(self):
        super().clean()
        
        # Validate date relationships
        if self.start_date and self.expiry_date:
            if self.expiry_date <= self.start_date:
                raise ValidationError(
                    {'expiry_date': 'Expiry date must be after start date.'}
                )
            
            if not self.reminder_time:
                self.reminder_time = self.expiry_date - timedelta(days=180)
            
            if self.reminder_time <= self.start_date:
                raise ValidationError(
                    {'reminder_time': 'Reminder must be after start date.'}
                )
                
            if self.reminder_time >= self.expiry_date:
                raise ValidationError(
                    {'reminder_time': 'Reminder must be before expiry date.'}
                )

    def check_and_send_reminders(self):
        """
        Check if reminders need to be sent and send them if necessary.
        Uses range-based logic to trigger reminders within their windows.
        """
        try:
            today = timezone.now().date()
            days_until_expiry = (self.expiry_date - today).days

            # (today == self.reminder_time)
            
            from .utils.email_utils import send_agreement_reminder

            # Initial reminder - send on the reminder date
            if self.reminder_time == today:
                logger.info(f"Sending initial reminder for agreement {self.id}")
                send_agreement_reminder(
                    agreement=self,
                    reminder_type='before',
                    time_remaining=f"{days_until_expiry} days"
                )

            # 30 days (1 month) reminder - send when between 30 days until expiry
            elif 29 <= days_until_expiry <= 30:
                logger.info(f"Sending 1-month reminder for agreement {self.id}")
                send_agreement_reminder(
                    agreement=self,
                    reminder_type='before',
                    time_remaining="30 days"
                )

            # 15 days reminder - send when between 15 days until expiry
            elif 14 <= days_until_expiry <= 15:
                logger.info(f"Sending 15-day reminder for agreement {self.id}")
                send_agreement_reminder(
                    agreement=self,
                    reminder_type='before',
                    time_remaining="15 days"
                )

            # 7 days reminder - send when between 7 days until expiry
            elif 6 <= days_until_expiry <= 7:
                logger.info(f"Sending 7-day reminder for agreement {self.id}")
                send_agreement_reminder(
                    agreement=self,
                    reminder_type='before',
                    time_remaining="7 days"
                )

            # Expiration day reminder - send on the day of expiration
            elif days_until_expiry == 0:
                logger.info(f"Sending expiration day reminder for agreement {self.id}")
                send_agreement_reminder(
                    agreement=self,
                    reminder_type='on'
                )
            # elif (today >= self.reminder_time - timedelta(days=2)) and (today <= self.reminder_time + timedelta(days=2)):
            #     # Around reminder date - send reminder (within 2 days before or after)
            #     logger.info(f"Sending reminder around reminder date for agreement {self.id}")
            #     send_agreement_reminder(
            #         agreement=self,
            #         reminder_type='before',
            #         time_remaining=f"{days_until_expiry} days"
            #     )   


            # After expiry - send reminder around 1 month after expiry (20-40 days)
            elif  -30 <= days_until_expiry <= -29:
                logger.info(f"Sending after-expiry reminder for agreement {self.id} ({abs(days_until_expiry)} days expired)")
                send_agreement_reminder(
                    agreement=self,
                    reminder_type='after',
                    months_since_expiration="1 month"
                )

        except Exception as e:
            logger.error(f"Error in check_and_send_reminders for agreement {self.id}: {str(e)}")

    def save(self, *args, **kwargs):
        # Store the old expiry date if this is an existing agreement
        old_expiry_date = None
        if self.pk:
            try:
                old_instance = Agreement.objects.get(pk=self.pk)
                old_expiry_date = old_instance.expiry_date
            except Agreement.DoesNotExist:
                pass

        # Auto-generate agreement_id if new record
        if not self.pk and not self.agreement_id:
            with transaction.atomic():
                year = datetime.now().year
                try:
                    # Get the maximum existing ID number for this year
                    max_id = Agreement.objects.filter(
                        agreement_id__startswith=f"A_{year}_",
                        agreement_id__regex=r'^A_\d{4}_\d{4}$'  # Ensure proper format
                    ).order_by('-agreement_id').first()
                    
                    if max_id:
                        last_num = int(max_id.agreement_id.split('_')[-1])
                        count = last_num + 1
                    else:
                        count = 1
                        
                    self.agreement_id = f"A_{year}_{count:04d}"
                    
                    # Verify this ID doesn't already exist (final safety check)
                    if Agreement.objects.filter(agreement_id=self.agreement_id).exists():
                        raise IntegrityError(f"Duplicate ID generated: {self.agreement_id}")
                        
                except (ValueError, IndexError) as e:
                    logger.error(f"Error parsing agreement ID: {e}")
                    # Fallback to UUID if ID parsing fails
                    self.agreement_id = f"A_{year}_{uuid.uuid4().hex[:4]}"
            
        # Set default reminder if not set
        if not self.reminder_time and self.expiry_date:
            self.reminder_time = self.expiry_date - timedelta(days=180)
            
        # If a new file is uploaded, set the original filename
        if self.attachment and hasattr(self.attachment, 'file'):
            # Only set if the file is new or changed
            if not self.pk or not Agreement.objects.filter(pk=self.pk, attachment=self.attachment.name).exists():
                # Use the uploaded file's original name
                self.original_filename = self.attachment.file.name
        
        # Auto-manage status based on expiry date
        if self.expiry_date:
            today = timezone.now().date()
            if self.expiry_date < today:
                self.status = 'Expired'
            elif self.status == 'Expired' and self.expiry_date >= today:
                # If status was expired but date is now in future, set back to ongoing
                self.status = 'Ongoing'
        
        # Save the model
        super().save(*args, **kwargs)

        # Check if this is a new agreement or if the expiry date has changed
        if not old_expiry_date or (old_expiry_date and old_expiry_date != self.expiry_date):
            # Check and send reminders
            self.check_and_send_reminders()

    def delete(self, *args, **kwargs):
        """Delete associated files when agreement is deleted"""
        if self.attachment:
            self.attachment.delete(save=False)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.agreement_id} - {self.title}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Agreement'
        verbose_name_plural = 'Agreements'

    # Add this method to your existing Agreement model
    def get_children(self):
        """Get all child agreements for this agreement"""
        return self.child_agreements.all()
    
    
    
    
    
    # ________________________________________________________________________________________________________

    #### From this point forward it will contain the functions for notifications.
    ##



    
    ## This function will be used filtering users to notify
    def get_users_to_notify(self):
        """
        Get all users who should receive notifications for this agreement.
        Includes:
        - All assigned users
        - The creator (if not already included)
        - All users from the same department
        - Users with department permissions for this department
        - All executive users (from executive departments)
        """
        User = get_user_model()
        logger.info(f"Getting users to notify for agreement {self.id}")
    
        # Start with assigned users and creator
        assigned_users = set(list(self.assigned_users.all()))
        logger.info(f"Found {len(assigned_users)} assigned users")
    
        users = assigned_users.copy()
    
        # Add creator if not already included
        if self.creator:
            users.add(self.creator)
            logger.info(f"Added creator: {self.creator.email}")
    
        # Add all users from the same department
        if self.department:
            logger.info(f"Looking for users in department: {self.department.name}")
            department_users = User.objects.filter(department=self.department)
            users.update(department_users)
            logger.info(f"Added {department_users.count()} department users")
    
        # Add users with department permissions for this department
        if self.department:
            from accounts.models import DepartmentPermission
            permission_users = User.objects.filter(
                department_permissions__department=self.department
            ).distinct()
            users.update(permission_users)
            logger.info(f"Added {permission_users.count()} users with department permissions")
    
        # Add all executive users (users from executive departments)
        executive_users = User.objects.filter(
            department__executive=True
        ).distinct()
        users.update(executive_users)
        logger.info(f"Added {executive_users.count()} executive users")
    
        final_users = list(users)
        logger.info(f"Total users to notify: {len(final_users)}")
        logger.info(f"User emails: {[user.email for user in final_users]}")
        
        return final_users
    
    ## for agreement creation or update notification
    # THIS FUNCTION MAY BE REDUNDENT IF VIEWS HANDLE NOTIFICATIONS DIRECTLY xx send_agreement_action_notification
    def send_agreement_action_notification(self, action, recipient=None):
        """
        Send notification about agreement creation or update
        """
        from accounts.models import User
        from django.core.mail import send_mail
        from django.conf import settings

        try:
            # Determine recipients
            if recipient:
                # Single recipient provided
                if isinstance(recipient, (str, int)):
                    try:
                        recipient = User.objects.get(pk=recipient)
                    except User.DoesNotExist:
                        logger.error(f"Recipient user not found: {recipient}")
                        return False
                recipients = [recipient]
            else:
                # Get all users to notify
                recipients = self.get_users_to_notify()
            
            if not recipients:
                logger.warning(f"No recipients found for agreement {self.id}")
                return False
            
            # Convert to email list
            recipient_emails = [user.email if hasattr(user, 'email') else user for user in recipients]
            recipient_emails = [email for email in recipient_emails if email]  # Filter out None emails
            
            if not recipient_emails:
                logger.warning(f"No valid email addresses found for agreement {self.id}")
                return False
            
            # Use email_utils for agreement notification
            try:
                from .utils.email_utils import send_agreement_notification
                return send_agreement_notification(self, action, recipient_emails)
            except ImportError:
                # Fallback to basic email sending
                subject = f"Agreement {action}: {self.title}"
                
                message = f"""
        Agreement {action.title()}:

        Title: {self.title}
        Reference: {self.agreement_reference}
        Department: {self.department.name if self.department else 'N/A'}
        Vendor: {self.party_name.name if self.party_name else 'N/A'}
        Agreement Type: {self.agreement_type.name if self.agreement_type else 'N/A'}
        Start Date: {self.start_date}
        Expiry Date: {self.expiry_date}

        Please review the agreement details in the system.
        """
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipient_emails,
                    fail_silently=False,
                )
                return True
                
        except Exception as e:
            logger.error(f"Failed to send {action} notification for agreement {self.id}: {str(e)}")
            return False
        
        
    # def send_agreement_reminder_notification(self, reminder_type='before', recipient=None):
    #     """
    #     Send reminder notification about agreement expiration
    #     """
    #     from accounts.models import User
    #     from django.core.mail import send_mail
    #     from django.conf import settings
    #     from django.utils import timezone
        
    #     try:
    #         # Determine recipients
    #         if recipient:
    #             # Single recipient provided
    #             if isinstance(recipient, (str, int)):
    #                 try:
    #                     recipient = User.objects.get(pk=recipient)
    #                 except User.DoesNotExist:
    #                     logger.error(f"Recipient user not found: {recipient}")
    #                     return False
    #             recipients = [recipient]
    #         else:
    #             # Get all users to notify
    #             recipients = self.get_users_to_notify()
            
    #         if not recipients:
    #             logger.warning(f"No recipients found for agreement {self.id}")
    #             return False
            
    #         # Convert to email list
    #         recipient_emails = [user.email if hasattr(user, 'email') else user for user in recipients]
    #         recipient_emails = [email for email in recipient_emails if email]  # Filter out None emails
            
    #         if not recipient_emails:
    #             logger.warning(f"No valid email addresses found for agreement {self.id}")
    #             return False
            
    #         # Calculate days remaining
    #         days_remaining = (self.expiry_date - timezone.now().date()).days
            
    #         # Use email_utils for reminder if available
    #         try:
    #             from .utils.email_utils import send_agreement_reminder
    #             return send_agreement_reminder(self, recipients[0] if len(recipients) == 1 else recipients, reminder_type)
    #         except ImportError:
    #             # Fallback to basic email sending
    #             # Determine subject based on reminder type
    #             if reminder_type == 'before':
    #                 subject = f"Reminder: {self.title} Expires in {days_remaining} days"
    #             elif reminder_type == 'on':
    #                 subject = f"URGENT: {self.title} Expires Today"
    #             else:  # after expiry
    #                 subject = f"EXPIRED: {self.title} has expired"
                
    #             message = f"""
    # Agreement Reminder:

    # Title: {self.title}
    # Reference: {self.agreement_reference}
    # Department: {self.department.name if self.department else 'N/A'}
    # Vendor: {self.party_name.name if self.party_name else 'N/A'}
    # Start Date: {self.start_date}
    # Expiry Date: {self.expiry_date}
    # Days Remaining: {days_remaining}

    # Please take necessary actions before expiration.
    # """
                
    #             send_mail(
    #                 subject=subject,
    #                 message=message,
    #                 from_email=settings.DEFAULT_FROM_EMAIL,
    #                 recipient_list=recipient_emails,
    #                 fail_silently=False,
    #             )
    #             return True
                
    #     except Exception as e:
    #         logger.error(f"Failed to send reminder notification for agreement {self.id}: {str(e)}")
    #         return False
