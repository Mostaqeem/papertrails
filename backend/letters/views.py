from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from accounts.models import User

from .models import (
    Organization,
    Category,
    Recipient,
    Signatory,
    Letter,
    LetterCopyRecipient,
    AdditionalLetterAttachment,
    LetterReferences,
    LetterFile
)

from .serializers import (
    OrganizationSerializer,
    CategorySerializer,
    RecipientSerializer,
    SignatorySerializer,
    LetterSerializer,
    LetterCopyRecipientSerializer,
    LetterListSerializer,
    LetterDetailSerializer,
    LetterReferenceSerializer,
    CCRecipientSerializer,
    CCMyOrgRecipientSerializer,
    LetterFileSerializer
)

# ----------------------------------
# List Views for Dropdown Data
# ----------------------------------

class OrganizationListView(generics.ListAPIView):
    """API view to list all organizations."""
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer


class CategoryListView(generics.ListAPIView):
    """API view to list all categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class RecipientListView(generics.ListAPIView):
    """API view to list all recipients."""
    queryset = Recipient.objects.all()
    serializer_class = RecipientSerializer


class CCSameOrgListView(generics.ListAPIView):
    queryset = Recipient.objects.all()
    serializer_class = CCRecipientSerializer


class CCOtherOrgListView(generics.ListAPIView):
    queryset = Recipient.objects.all()
    serializer_class = CCRecipientSerializer

class CCMyOrgListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = CCMyOrgRecipientSerializer

class InternalReferencesListView(generics.ListAPIView):
    queryset = LetterReferences.objects.all()
    serializer_class = LetterReferenceSerializer


# ----------------------------------
# Letter Create View for data entry
# ----------------------------------


class LetterCreateView(generics.CreateAPIView):
    """API view to create a new letter with copy recipients, attachments, and references."""
    queryset = Letter.objects.all()
    serializer_class = LetterSerializer

    def create(self, request, *args, **kwargs):
        """Override create to handle nested copy recipients, file attachments, and references."""
        try:
            with transaction.atomic():
                # Extract copy recipient data from the request
                copy_same_org = request.data.get('copySameOrg', '')
                copy_other_org = request.data.get('copyOtherOrg', '')
                copy_my_org = request.data.get('copyMyOrg', '')
                
                # Extract multiple attachments (from FILES)
                attachment_files = request.FILES.getlist('attachments')
                attachment_titles = request.data.getlist('attachmentTitles', [])
                
                # Extract references data
                internal_references = request.data.getlist('internalReferences', [])
                external_references = request.data.getlist('externalReferences', [])
                
                # Extract date from request (will be stored as created_at)
                date = request.data.get('date', None)
                
                # Create a mutable copy of request data for the serializer
                letter_data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
                
                # Remove fields that are handled separately
                fields_to_remove = [
                    'copySameOrg', 'copyOtherOrg', 'copyMyOrg',
                    'attachments', 'attachmentTitles',
                    'internalReferences', 'externalReferences', 'date'
                ]
                for field in fields_to_remove:
                    letter_data.pop(field, None)

                letter_data['created_by'] = request.user.id
                # Set created_at from the date field sent by frontend
                if date:
                    letter_data['created_at'] = date
                
                # Create the letter
                serializer = self.get_serializer(data=letter_data)
                serializer.is_valid(raise_exception=True)
                letter = serializer.save()
                
                # Create copy recipients
                if copy_same_org:
                    # Find recipient by name in the same organization
                    recipients = Recipient.objects.filter(
                        name__icontains=copy_same_org,
                        organization=letter.organization
                    )
                    for recipient in recipients:
                        LetterCopyRecipient.objects.create(
                            letter=letter,
                            recipient=recipient
                        )
                
                if copy_other_org:
                    # Find recipient by name in other organizations
                    recipients = Recipient.objects.filter(
                        name__icontains=copy_other_org
                    ).exclude(organization=letter.organization)
                    for recipient in recipients:
                        LetterCopyRecipient.objects.create(
                            letter=letter,
                            recipient=recipient
                        )
                
                if copy_my_org:
                    # Find user by full name in the current organization
                    users = User.objects.filter(
                        full_name__icontains=copy_my_org
                    )
                    for user in users:
                        LetterCopyRecipient.objects.create(
                            letter=letter,
                            MyOrgRecipient=user
                        )
                
                # Create multiple attachments if provided
                if attachment_files:
                    for idx, attachment_file in enumerate(attachment_files):
                        title = attachment_titles[idx] if idx < len(attachment_titles) else ''
                        AdditionalLetterAttachment.objects.create(
                            letter=letter,
                            file=attachment_file,
                            title=title or attachment_file.name
                        )
                
                # Create internal references if provided
                if internal_references:
                    for ref_number in internal_references:
                        # Check if the reference is not empty
                        if ref_number and ref_number.strip():
                            try:
                                # Try to find the letter by its reference number
                                ref_letter = Letter.objects.get(reference_number=ref_number.strip())
                                LetterReferences.objects.create(
                                    letter=letter,
                                    internal_reference_number=ref_letter
                                )
                            except Letter.DoesNotExist:
                                # If not found by reference number, log the error but don't fail
                                print(f"Letter with reference number '{ref_number}' not found")
                                pass
                
                # Create external references if provided
                if external_references:
                    for ext_ref in external_references:
                        if ext_ref:  # Only create if not empty
                            LetterReferences.objects.create(
                                letter=letter,
                                external_reference_number=ext_ref
                            )
                
                # Return the created letter with all details
                detail_serializer = LetterDetailSerializer(letter)
                return Response(
                    detail_serializer.data,
                    status=status.HTTP_201_CREATED
                )
                
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ------------------------------
# Letter List View for summaries
# ------------------------------


class LetterListView(viewsets.ReadOnlyModelViewSet):
    """ViewSet for listing letters."""
    queryset = Letter.objects.all()
    
    # Remove the single 'serializer_class = ...' line
    # serializer_class = LetterListSerializer 

    # Add this method instead to switch serializers dynamically
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LetterDetailSerializer  # Use full details for single letter
        return LetterListSerializer        # Use summary for the list

# ------------------------------
# ViewSets for CRUD Operations
# ------------------------------

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class RecipientViewSet(viewsets.ModelViewSet):
    queryset = Recipient.objects.all()
    serializer_class = RecipientSerializer


class LetterViewSet(viewsets.ModelViewSet):
    queryset = Letter.objects.all()
    serializer_class = LetterSerializer


class LetterCopyRecipientViewSet(viewsets.ModelViewSet):
    queryset = LetterCopyRecipient.objects.all()
    serializer_class = LetterCopyRecipientSerializer


# ------------------------------
# Extra APIViews for Preview / PDF
# ------------------------------

class LetterPreviewAPIView(APIView):
    """Returns a preview of the letter content before saving or printing."""

    def get(self, request, pk):
        try:
            letter = Letter.objects.get(pk=pk)
        except Letter.DoesNotExist:
            return Response({"error": "Letter not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = LetterSerializer(letter)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LetterPDFAPIView(APIView):
    """Returns a message or PDF download response (to be implemented later)."""

    def get(self, request, pk):
        try:
            letter = Letter.objects.get(pk=pk)
        except Letter.DoesNotExist:
            return Response({"error": "Letter not found"}, status=status.HTTP_404_NOT_FOUND)

        # For now just respond with JSON — PDF generation can be added later
        return Response(
            {"message": f"PDF generation for Letter {pk} will be added soon."},
            status=status.HTTP_200_OK
        )
# API View to get next tentative reference number

class NextReferenceNumberAPIView(APIView):
    """
    Returns the next available tentative reference number based on provided data, 
    without saving a Letter object or incrementing the counter.
    """
    def get(self, request):
        # Read IDs from query parameters
        organization_id = request.query_params.get('organization_id')
        recipient_id = request.query_params.get('recipient_id')
        category_id = request.query_params.get('category_id')
        date = request.query_params.get('date')  # Get the date parameter

        # If essential fields are missing, return a structure error or a placeholder
        if not all([organization_id, recipient_id, category_id]):
            return Response(
                {"tentative_reference_number": "Select all fields to see reference."},
                status=status.HTTP_200_OK
            )

        try:
            # Call the new class method
            tentative_ref_number = Letter.get_tentative_reference_number(
                organization_id=organization_id,
                recipient_id=recipient_id,
                category_id=category_id,
                date=date
            )
        except ValueError as e:
            # Catch the custom error from the model method (e.g., invalid ID)
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        return Response(
            {"tentative_reference_number": tentative_ref_number}, 
            status=status.HTTP_200_OK
        )
    

class LetterFileSaveView(generics.ListCreateAPIView):
    '''Pdf letter file save view'''
    queryset = LetterFile.objects.all()
    serializer_class = LetterFileSerializer