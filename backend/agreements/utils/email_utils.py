import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags


logger = logging.getLogger(__name__)

def send_agreement_reminder(agreement, reminder_type, months_since_expiration=None, time_remaining=None):
    """
    Send event-based reminder email for an agreement to all associated users.
    reminder_type: 'before', 'on', or 'after'
    """
    try:
        # Get all users associated with the agreement
        recipients = agreement.get_users_to_notify()
        if not recipients:
            logger.warning(f"No recipients found for agreement {agreement.id}")
            return False

        # Get all valid email addresses
        recipient_emails = [user.email for user in recipients if user.email]
        if not recipient_emails:
            logger.warning(f"No valid email addresses found for agreement {agreement.id}")
            return False

        # Base context without recipient-specific info
        base_context = {
            'agreement_name': agreement.title,
            'partner_name': agreement.party_name.name if agreement.party_name else '',
            'expiration_date': agreement.expiry_date,
            'agreement_id': agreement.agreement_id,
            'company_name': getattr(settings, 'COMPANY_NAME', 'Your Company Name'),
            'support_contact': getattr(settings, 'SUPPORT_CONTACT', 'Support Email/Phone'),
            'reminder_type': reminder_type,
            'months_since_expiration': months_since_expiration,
            'time_remaining': time_remaining,
            'department': agreement.department.name if agreement.department else 'N/A',
            'agreement_type': agreement.agreement_type.name if agreement.agreement_type else 'N/A',
            'application_link': f"{settings.FRONTEND_URL}/agreements/{agreement.id}",
        }

        if reminder_type == 'before':
            subject = f"Reminder: Agreement '{agreement.title}' expires on {agreement.expiry_date}"
        elif reminder_type == 'on':
            subject = f"Agreement '{agreement.title}' has expired today ({agreement.expiry_date})"
        elif reminder_type == 'after':
            subject = f"Follow-up: Agreement '{agreement.title}' expired on {agreement.expiry_date}"
        else:
            subject = f"Agreement Notification: {agreement.title}"

        # Send personalized email to each recipient
        for user in recipients:
            try:
                # Add recipient-specific context
                context = base_context.copy()
                context['recipient_name'] = getattr(user, 'full_name', getattr(user, 'username', 'User'))
                
                message = render_to_string('emails/agreement_reminder.txt', context)
                html_message = render_to_string('emails/agreement_reminder.html', context)

                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                    html_message=html_message
                )
                logger.info(f"Sent {reminder_type} reminder for agreement {agreement.id} to {user.email}")
            except Exception as e:
                logger.error(f"Failed to send reminder to {user.email}: {str(e)}")
                continue

        return True
    except Exception as e:
        logger.error(f"Failed to send {reminder_type} reminder for agreement {agreement.id}: {str(e)}")
        return False

def send_agreement_notification(agreement, action, recipients):
    """
    Send notification about agreement creation/update
    """
    try:
        subject = f"Agreement {action}: {agreement.title}"
        
        # Get the current user (assuming you have access to request or can get the creator)
        # You might need to adjust this based on how you track who created/updated the agreement
        created_by = getattr(agreement, 'created_by', None)
        if created_by:
            created_by_name = f"{created_by.first_name} {created_by.last_name}".strip()
            if not created_by_name:
                created_by_name = created_by.username
        else:
            created_by_name = "System"
        
        # Format dates properly
        from django.utils import timezone
        created_date = agreement.created_at if hasattr(agreement, 'created_at') else timezone.now()
        
        context = {
            'agreement': agreement,
            'action': action,
            'recipient_name': 'User',  # This should be personalized for each recipient
            'agreement_reference': agreement.agreement_reference,
            'start_date': agreement.start_date.strftime('%Y-%m-%d') if agreement.start_date else 'N/A',
            'expiry_date': agreement.expiry_date.strftime('%Y-%m-%d') if agreement.expiry_date else 'N/A',
            'reminder_date': agreement.reminder_time.strftime('%Y-%m-%d') if agreement.reminder_time else None,
            'vendor_name': agreement.party_name.name if agreement.party_name else 'N/A',
            'department_name': agreement.department.name if hasattr(agreement, 'department') and agreement.department else 'N/A',
            'agreement_type': agreement.agreement_type.name if agreement.agreement_type else 'N/A',
            'created_by': created_by_name,
            'created_date': created_date.strftime('%Y-%m-%d'),
            'application_link': f"{settings.FRONTEND_URL}/agreements/{agreement.id}",  # Adjust this URL as needed
            'organization_name': getattr(settings, 'ORGANIZATION_NAME', 'Your Organization'),
        }
        
        message = render_to_string('emails/agreement_created.txt', context)
        html_message = render_to_string('emails/agreement_created.html', context)
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipients,
            fail_silently=False,
            html_message=html_message
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send {action} notification for agreement {agreement.id}: {str(e)}")
        return False



# User Creation Notification HTML location in: backend/agreements/templates/emails/user_creation_notification.html

def send_user_creation_notification(user, temporary_password):
    """
    Send new user creation notification with login credentials
    """
    try:
        # Check if email settings are configured
        if not hasattr(settings, 'EMAIL_HOST') or not settings.EMAIL_HOST:
            logger.error("Email settings not configured")
            return False
            
        # Prepare context for template
        context = {
            'user_full_name': user.full_name or user.email.split('@')[0],
            'user_email': user.email,
            'temporary_password': temporary_password,
            'department': user.department.name if user.department else 'Not assigned',
            'role': user.role.name if user.role else 'User',
            'login_url': getattr(settings, 'LOGIN_URL', 'http://172.17.231.72:3000'),
            'company_name': getattr(settings, 'COMPANY_NAME', 'Sonali Intellect'),
            'support_phone': getattr(settings, 'SUPPORT_PHONE', ''),
            'created_at': timezone.now(),
        }
        
        # Render HTML content - FIXED TEMPLATE PATH
        html_content = render_to_string('emails/user_creation_notification.html', context)
        
        # Create plain text version
        text_content = strip_tags(html_content)
        
        # Prepare subject
        subject = f"Welcome to {context['company_name']}'s Document Management System - PaperTrails - Your Account Has Been Created"
        
        # Send email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
            reply_to=[getattr(settings, 'SUPPORT_EMAIL', settings.DEFAULT_FROM_EMAIL)],
        )
        email.attach_alternative(html_content, "text/html")
        
        # Actually send the email
        email_sent = email.send(fail_silently=False)
        
        if email_sent:
            logger.info(f"User creation notification sent to {user.email}")
            return True
        else:
            logger.error(f"Failed to send email to {user.email} - send() returned 0")
            return False
        
    except Exception as e:
        logger.error(f"Failed to send user creation notification to {user.email}: {str(e)}", exc_info=True)
        return False

def send_admin_user_creation_notification(user):
    """
    Send notification to admin about new user creation
    """
    try:
        admin_emails = getattr(settings, 'ADMIN_EMAILS', [])
        if not admin_emails:
            admin_emails = [getattr(settings, 'SUPPORT_EMAIL', settings.DEFAULT_FROM_EMAIL)]
        
        context = {
            'new_user_name': user.full_name or user.email,
            'new_user_email': user.email,
            'department': user.department.name if user.department else 'Not assigned',
            'role': user.role.name if user.role else 'User',
            'created_at': timezone.now(),
            'company_name': getattr(settings, 'COMPANY_NAME', 'Sonali Intellect'),
        }
        
        # FIXED: Use correct template path for admin notification
        html_content = render_to_string('emails/user_creation_notification.html', context)
        text_content = strip_tags(html_content)
        
        subject = f"New User Created: {user.email}"
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=admin_emails,
        )
        email.attach_alternative(html_content, "text/html")
        
        email_sent = email.send(fail_silently=False)
        
        if email_sent:
            logger.info(f"Admin notification sent for new user {user.email}")
            return True
        else:
            logger.error(f"Failed to send admin notification for {user.email} - send() returned 0")
            return False
        
    except Exception as e:
        logger.error(f"Failed to send admin notification for new user {user.email}: {str(e)}", exc_info=True)
        return False