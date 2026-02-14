from rest_framework import serializers
from .models import Category, Letter, Organization, Recipient, Signatory, LetterCopyRecipient, AdditionalLetterAttachment, LetterReferences, LetterFile
from accounts.models import User

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'  
        read_only_fields = ('created_at', 'updated_at')
        
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class RecipientSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = Recipient
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class SignatorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Signatory
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class LetterAttachmentSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = AdditionalLetterAttachment
        fields = ['title', 'file', 'uploaded_at']
        read_only_fields = ('id', 'file_size', 'file_type', 'uploaded_at')


class LetterSaveCopyRecipientSerializer(serializers.ModelSerializer):
        class Meta:
            model = LetterCopyRecipient
            fields = ['recipient', 'MyOrgRecipient']

class LetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Letter
        fields = '__all__'
        read_only_fields = ('reference_number', 'updated_at')

class LetterCopyRecipientSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.name', read_only=True)
    recipient_designation = serializers.CharField(source='recipient.short_designation', read_only=True)
    recipient_department = serializers.CharField(source='recipient.department', read_only=True)
    recipient_organization = serializers.CharField(source='recipient.organization.short_form', read_only=True)
    org_recipient_name = serializers.CharField(source='MyOrgRecipient.full_name', read_only=True, required=False, allow_null=True)
    
    class Meta:
        model = LetterCopyRecipient
        fields = ['id', 'recipient_name', 'recipient_designation', 'recipient_department', 'recipient_organization', 'org_recipient_name', 'recipient', 'MyOrgRecipient']
        read_only_fields = ['id', 'recipient_name', 'recipient_designation', 'recipient_department', 'recipient_organization', 'org_recipient_name']

class CCRecipientSerializer(serializers.ModelSerializer):
    """Serializer for CC recipients (from Recipient model)"""
    short_organization = serializers.CharField(source='organization.short_form', read_only=True)
    
    class Meta:
        model = Recipient
        fields = ['id', 'name', 'email', 'short_designation', 'department', 'short_organization']

class CCMyOrgRecipientSerializer(serializers.ModelSerializer):
    """Serializer for My Org CC recipients (from User model)"""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email']

class LinkedLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Letter
        fields = ['id', 'reference_number', 'subject'] # Added subject for context if needed

# 2. Update the existing LetterReferenceSerializer
class LetterReferenceSerializer(serializers.ModelSerializer):
    # Use the nested serializer for the internal reference field
    internal_reference_number = LinkedLetterSerializer(read_only=True)
    
    class Meta:
        model = LetterReferences
        fields = '__all__'
class LetterFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LetterFile
        fields = ['id', 'document', 'uploaded_at']
        read_only_fields = ('id', 'uploaded_at')

class LetterListSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    recipient = RecipientSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    signatory = SignatorySerializer(read_only=True)
    attachments = LetterAttachmentSerializer(many=True, read_only=True)
    documents = LetterFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = Letter
        fields = ['id', 'reference_number', 'organization', 'recipient', 'category', 'signatory', 'created_at', 'attachments', 'documents']




class LetterDetailSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    recipient = RecipientSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    signatory = SignatorySerializer(read_only=True)
    cc_recipients = LetterCopyRecipientSerializer(many=True, read_only=True)
    attachments = LetterAttachmentSerializer(many=True, read_only=True)
    references = LetterReferenceSerializer(many=True, read_only=True)
    
    # Ensure internal references and documents are included if needed
    internal_references = LetterReferenceSerializer(many=True, read_only=True) 

    class Meta:
        model = Letter
        fields = '__all__'  # This ensures subject and body are included
        read_only_fields = ('reference_number', 'created_at', 'updated_at', 'created_by')


class LetterFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LetterFile
        fields = '__all__'
        read_only_fields = ('id', 'uploaded_at')

# 1. Update SignatoryUserSerializer
class SignatoryUserSerializer(serializers.ModelSerializer):
    # This line is crucial! It converts the relationship ID to its String name
    designation = serializers.StringRelatedField() 

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'designation']

# 2. Existing SignatorySerializer uses the above
class SignatorySerializer(serializers.ModelSerializer):
    email = SignatoryUserSerializer(read_only=True)

    class Meta:
        model = Signatory
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')