from rest_framework import serializers
from .models import Agreement, AgreementType  # Add AgreementType to imports
from accounts.models import User, Organization, Department

class AgreementTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgreementType
        fields = ['id', 'name', 'description', 'is_active']

class ParentAgreementSerializer(serializers.ModelSerializer):
    parent_agreement = serializers.SerializerMethodField()

    class Meta:
        model = Agreement
        fields = ['id', 'agreement_id', 'title', 'parent_agreement']
        
    def get_parent_agreement(self, obj):
        if obj.parent_agreement:
            return {
                'id': obj.parent_agreement.id,
                'agreement_id': obj.parent_agreement.agreement_id,
                'title': obj.parent_agreement.title
            }
        return None

class AgreementSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    agreement_type_name = serializers.CharField(source='agreement_type.name', read_only=True)
    agreement_type_detail = AgreementTypeSerializer(source='agreement_type', read_only=True)
    party_name_display = serializers.CharField(source='party_name.name', read_only=True)
    assigned_users = serializers.SerializerMethodField()
    original_filename = serializers.CharField(read_only=True)
    creator_name = serializers.CharField(source='creator.full_name', read_only=True)
    executive_users = serializers.SerializerMethodField()
    parent_agreement_title = serializers.CharField(source='parent_agreement.title', read_only=True)
    parent_agreement = ParentAgreementSerializer(read_only=True)
    child_agreements = serializers.SerializerMethodField()

    def get_assigned_users(self, obj):
        return [user.full_name for user in obj.assigned_users.all()]
        
    def get_child_agreements(self, obj):
        children = obj.child_agreements.all()
        return [{
            'id': child.id,
            'title': child.title,
            'agreement_id': child.agreement_id
        } for child in children]
    
    def get_executive_users(self, obj):
        executives = User.objects.filter(department__executive=True)
        return [
            {
                'id': user.id,
                'full_name': user.full_name,
                'department__name': user.department.name if user.department else ''
            }
            for user in executives
        ]

    class Meta:
        model = Agreement
        fields = [
            'id', 'title', 'agreement_reference', 'agreement_type', 'agreement_type_name', 'agreement_type_detail',
            'status', 'start_date', 'expiry_date', 'reminder_time', 'remarks',
            'party_name', 'party_name_display', 'attachment', 'original_filename','created_at', 'updated_at',
            'agreement_id', 'assigned_users', 'department', 'department_name', 'creator', 'creator_name', 'executive_users',
            'parent_agreement', 'parent_agreement_title', 'child_agreements'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'agreement_id', 'assigned_users', 'department', 'creator', 'creator_name']

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        # Department must be set explicitly; do not assign agreement_type to department
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Department must be set explicitly; do not assign agreement_type to department
        return super().update(instance, validated_data)

class AgreementListSerializer(serializers.ModelSerializer):
    child_agreements = serializers.SerializerMethodField()
    
    class Meta:
        model = Agreement
        fields = ['id', 'title', 'agreement_id', 'parent_agreement', 'child_agreements']
        
    def get_child_agreements(self, obj):
        return obj.child_agreements.values('id', 'title', 'agreement_id')


#-------------------------------------
#Serializers for Super Admin Configurations
#-------------------------------------

# Serializer for Vendor model
class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'address', 'email', 'phone_number', 'contact_person_name', 'contact_person_designation']