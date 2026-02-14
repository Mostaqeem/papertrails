# from django.contrib import admin

# from .models import Category, Letter, LetterCopyRecipient, Organization, Recipient, Signatory

# # Register your models here.
# admin.site.register(Organization)
# admin.site.register(Category)
# admin.site.register(Recipient)
# admin.site.register(Letter)
# admin.site.register(LetterCopyRecipient)




from django.contrib import admin
from .models import LetterFile ,Category, Letter, LetterCopyRecipient, Organization, Recipient, AdditionalLetterAttachment, LetterReferences
# Remove Signatory import since it's already registered in accounts

# @admin.register(Organization)
# class OrganizationAdmin(admin.ModelAdmin):
#     list_display = ['name', 'short_form', 'organization_type', 'created_at']
#     search_fields = ['name', 'short_form']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']

# @admin.register(Recipient)
# class RecipientAdmin(admin.ModelAdmin):
#     list_display = ['name', 'email', 'organization', 'designation', 'created_at']
#     list_filter = ['organization', 'department']
#     search_fields = ['name', 'email', 'designation']

@admin.register(Letter)
class LetterAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'recipient', 'category', 'organization', 'created_at','updated_at']
    list_filter = ['category', 'organization', 'created_at']
    search_fields = ['subject', 'recipient__name']
    # Temporarily exclude reference_number until migrations are run
    exclude = ['reference_number']
    
    def get_queryset(self, request):
        # Use a queryset that doesn't reference the missing field
        return super().get_queryset(request).defer('reference_number')

admin.site.register(LetterCopyRecipient)
class LetterCopyRecipientAdmin(admin.ModelAdmin):
    list_display = ['letter', 'recipient_object', 'created_at']
    list_filter = ['content_type', 'created_at']
    search_fields = ['letter__reference_number', 'letter__subject']

admin.site.register(AdditionalLetterAttachment)  # Registering AdditionalLetterAttachment model that was later created


admin.site.register(LetterReferences)  # Registering Signatory model from accounts

admin.site.register(LetterFile)  # Registering LetterFile model for admin access