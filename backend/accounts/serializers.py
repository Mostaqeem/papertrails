# accounts/serializers.py
from rest_framework import serializers
from .models import DepartmentPermission, User, Department, Role, Organization, Signatory, Designation

class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    short__designation = serializers.CharField(source='designation.short_designation', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {
            'password': {'required': False} # Make password optional
        }

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'executive']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class DepartmentPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentPermission
        fields = '__all__'

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name']

class SignatorySerializer(serializers.ModelSerializer):
    email = UserSerializer(read_only=True)
    email_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='email')
    designation = serializers.CharField(source='email.designation.designation', read_only=True, allow_null=True)
    short_designation = serializers.CharField(source='email.designation.short_designation', read_only=True, allow_null=True)
    full_name = serializers.CharField(source='email.full_name', read_only=True)
    digital_signature_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Signatory
        fields = ['id', 'email', 'email_id', 'digital_signature', 'digital_signature_url', 'designation', 'short_designation', 'full_name', 'created_at', 'updated_at']
    
    def get_digital_signature_url(self, obj):
        """Return the full URL for the digital signature"""
        if obj.digital_signature:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.digital_signature.url)
            return obj.digital_signature.url
        return None


class MyCompanyCCSerializer(serializers.ModelSerializer):
    short_designation = serializers.CharField(source='designation.short_designation', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['short_designation','full_name', 'department_name'] 

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'