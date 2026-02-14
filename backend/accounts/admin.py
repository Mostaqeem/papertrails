# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from .models import User, Department, Role, DepartmentPermission, Designation, Signatory, Organization, Recipient, OrganizationType
# from .models import OldVendor
import secrets
import string

class UserCreationForm(forms.ModelForm):
    """A form for creating new users in admin panel."""
    
    class Meta:
        model = User
        fields = ('email', 'full_name', 'department', 'designation', 'role', 'is_staff', 'is_superuser', 'is_admin')

    def save(self, commit=True):
        # Generate a random password
        alphabet = string.ascii_letters + string.digits
        password = ''.join(secrets.choice(alphabet) for i in range(12))
        
        user = super().save(commit=False)
        user.set_password(password)
        
        if commit:
            user.save()
        
        return user

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('email', 'full_name', 'is_staff', 'is_admin', 'is_superuser', 'department', 'role')
    list_filter = ('is_staff', 'is_superuser', 'is_admin', 'department', 'role')
    
    # Fields for editing existing user
    fieldsets = (
        (None, {'fields': ('email',)}),
        ('Personal Info', {'fields': ('full_name',)}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_admin', 'groups', 'user_permissions'),
        }),
        ('Department Info', {'fields': ('department', 'designation', 'role')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields for creating new user - remove password fields
    add_form = UserCreationForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'department', 'designation', 'role',
                      'is_staff', 'is_superuser', 'is_admin'),
        }),
    )
    search_fields = ('email', 'full_name')
    ordering = ('email',)
    
    def get_readonly_fields(self, request, obj=None):
        # Make password field read-only when editing existing user
        if obj:  # editing an existing object
            return ('password',) + self.readonly_fields
        return self.readonly_fields

class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'executive')
    list_filter = ('executive',)
    search_fields = ('name', 'description')

class DepartmentPermissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'permission_type', 'get_approved_by', 'granted_at')
    list_filter = ('permission_type', 'department')
    search_fields = ('user__email', 'department__name')
    readonly_fields = ('granted_at',)

    def get_approved_by(self, obj):
        if obj.approved_by:
            return obj.approved_by.full_name
        return '-'
    get_approved_by.short_description = 'Approved By'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "approved_by":
            kwargs["queryset"] = User.objects.filter(department__executive=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not change:  # Only set approved_by when creating new permission
            if request.user.is_executive():
                obj.approved_by = request.user
            else:
                # Find an executive user to approve
                executive_user = User.objects.filter(department__executive=True).first()
                if executive_user:
                    obj.approved_by = executive_user
        super().save_model(request, obj, form, change)

    def has_change_permission(self, request, obj=None):
        if obj and obj.approved_by:
            return request.user.is_executive() or request.user.is_superuser
        return super().has_change_permission(request, obj)

admin.site.site_header = "Papertrail"
admin.site.site_title = "Papertrail"
admin.site.index_title = "Papertrail"

admin.site.register(User, CustomUserAdmin)
admin.site.register(Department, DepartmentAdmin)
admin.site.register(Role)
admin.site.register(DepartmentPermission, DepartmentPermissionAdmin)
# admin.site.register(OldVendor)
admin.site.register(Designation)
admin.site.register(OrganizationType)
admin.site.register(Organization)
admin.site.register(Recipient)
admin.site.register(Signatory)