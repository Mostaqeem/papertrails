# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User
from .models import Signatory

@receiver(post_save, sender=User)
def create_or_delete_signatory_profile(sender, instance, created, **kwargs):
    """
    Automatically create Signatory profile when user becomes signatory,
    and delete it when user is no longer signatory.
    """
    if instance.is_signatory:
        # Create signatory profile if it doesn't exist
        Signatory.objects.get_or_create(user=instance)
    else:
        # Delete signatory profile if it exists
        Signatory.objects.filter(user=instance).delete()