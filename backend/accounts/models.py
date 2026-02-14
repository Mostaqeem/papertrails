from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.dispatch import receiver
from django.db.models.signals import post_save

from agreements.utils.email_utils import send_admin_user_creation_notification, send_user_creation_notification

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        
        return user
    


    def create_superuser(self, email, password=None, **extra_fields):
        from django.apps import apps

        Department = apps.get_model('accounts', 'Department')  # Replace your_app_name

        # Get or create a default department for superusers
        superuser_dept, _ = Department.objects.get_or_create(name='SuperUser')

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        # Provide defaults for fields normally required
        extra_fields.setdefault('full_name', 'Superuser')
        extra_fields.setdefault('department', superuser_dept)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)
    
@receiver(post_save, sender='accounts.User')
def send_user_creation_emails(sender, instance, created, **kwargs):
    if created and not instance.is_superuser:
        try:
            # Get the temporary password (you might need to store it temporarily)
            # For now, we'll generate a new one for the email
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            temporary_password = ''.join(secrets.choice(alphabet) for i in range(12))
            
            # Set the actual password
            instance.set_password(temporary_password)
            instance.save()
            
            # Send notifications
            send_user_creation_notification(instance, temporary_password)
            send_admin_user_creation_notification(instance)
            
        except Exception as e:
            # Log the error but don't break user creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send user creation emails: {str(e)}")

class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    executive = models.BooleanField(default=False, help_text="If checked, users in this department can view all agreements but cannot create or edit them")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.id:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

class Role(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    username = None
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(_('full name'), max_length=150, blank=True)  # allow blank here
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')  # allow blank
    designation = models.ForeignKey('Designation', on_delete=models.SET_NULL, null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    is_admin = models.BooleanField(default=False)
    

    # Remove first_name and last_name fields
    first_name = None
    last_name = None

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # empty to only ask email and password

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # Only require full_name and department if not superuser
        if not self.pk and not self.is_superuser:
            if not self.full_name:
                raise ValidationError({'full_name': 'Full name is required for new users.'})
            if not self.department:
                raise ValidationError({'department': 'Department is required for new users.'})
        super().save(*args, **kwargs)

    def is_executive(self):
        """Check if the user belongs to an executive department"""
        return self.department and self.department.executive
    

# The rest of your models stay unchanged

class DepartmentPermission(models.Model):
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('edit', 'Create/Edit'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='department_permissions')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='permitted_users')
    permission_type = models.CharField(max_length=4, choices=PERMISSION_CHOICES)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_permissions')
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'department', 'permission_type')
        verbose_name = 'Department Permission'
        verbose_name_plural = 'Department Permissions'

    def __str__(self):
        return f"{self.user.email} - {self.department.name} ({self.permission_type})"

    def clean(self):
        if self.approved_by and not self.approved_by.is_executive():
            raise ValidationError({'approved_by': 'Only executives can approve permissions.'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    phone_number = models.CharField(
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ],
        blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.user.email

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)



class Signatory(models.Model):
    email = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='signatory_mail'
    )
    digital_signature = models.FileField(upload_to='signatures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.email} - Signatory"
    

class Designation(models.Model):
    designation = models.CharField(max_length=100)
    short_designation = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.designation



    #----------------------- Organization Model -----------------------#
class OrganizationType(models.Model):
    type_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.type_name

    class Meta:
        verbose_name = 'Organization Type'
        verbose_name_plural = 'Organization Types'


class Organization(models.Model):
    name = models.CharField(max_length=255)
    short_form = models.CharField(max_length=50, unique=True)
    address = models.TextField()
    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    organization_type = models.ForeignKey(
        OrganizationType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='organizations'  # Changed from 'organization_types'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'
    

#----------------------- Recipient Model -----------------------#
class Recipient(models.Model):
    fullName = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='recipients'
    )
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100)
    short_designation = models.CharField(max_length=50, null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.fullName

    class Meta:
        ordering = ['fullName']
        verbose_name = 'Recipient'
        verbose_name_plural = 'Recipients'