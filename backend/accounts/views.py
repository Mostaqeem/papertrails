from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from rest_framework import generics
from .models import Department, Designation, Organization, DepartmentPermission, User, Signatory
from .serializers import DepartmentSerializer, DesignationSerializer, VendorSerializer, UserSerializer, SignatorySerializer, MyCompanyCCSerializer
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from django.shortcuts import redirect
from rest_framework_simplejwt.tokens import SlidingToken
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings


class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, email=email, password=password)
        if user:
            login(request, user)
            # csrf_token = get_token(request)
            token = SlidingToken.for_user(user)
            
            # Get user's department and permissions
            department_ids = set()
            if user.department:
                department_ids.add(user.department.id)
            
            permitted_dept_ids = DepartmentPermission.objects.filter(
                user=user,
                permission_type='edit'
            ).values_list('department_id', flat=True)
            department_ids.update(permitted_dept_ids)
            
            # Get permitted departments
            permitted_departments = Department.objects.filter(id__in=department_ids)
            
            # Prepare user data
            user_data = {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
                'department': {
                    'id': user.department.id,
                    'name': user.department.name
                } if user.department else None,
                'permitted_departments': DepartmentSerializer(permitted_departments, many=True).data,
                'is_executive': Department.objects.filter(
                    executive=True,
                    users=user
                ).exists()
            }
            
            return Response({
                'message': 'Login successful', 
                'token': str(token),
                'user': user_data
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard data for the authenticated user"""
        user = request.user
        
        # Get user's department and permissions
        department_ids = set()
        if user.department:
            department_ids.add(user.department.id)
        
        permitted_dept_ids = DepartmentPermission.objects.filter(
            user=user,
            permission_type='edit'
        ).values_list('department_id', flat=True)
        department_ids.update(permitted_dept_ids)
        
        # Get permitted departments
        permitted_departments = Department.objects.filter(id__in=department_ids)
        
        # Check if user is executive
        is_executive = Department.objects.filter(
            executive=True,
            users=user
        ).exists()
        
        # Prepare dashboard data
        dashboard_data = {
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'department': {
                    'id': user.department.id,
                    'name': user.department.name
                } if user.department else None,
                'is_executive': is_executive
            },
            'permissions': {
                'permitted_departments': DepartmentSerializer(permitted_departments, many=True).data,
                'can_create_agreements': not is_executive,
                'can_edit_agreements': not is_executive
            }
        }
        
        return Response(dashboard_data)

class DepartmentListAPIView(generics.ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class VendorListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Organization.objects.all().order_by('name')
    serializer_class = VendorSerializer

class SignatoryListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Signatory.objects.all()
    serializer_class = SignatorySerializer

class MyDepartmentsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get departments where user has access (own department + permitted departments)"""
        department_ids = set()
        
        # Add user's own department if they have one
        if request.user.department:
            department_ids.add(request.user.department.id)
        
        # Add departments where user has edit permission
        permitted_dept_ids = DepartmentPermission.objects.filter(
            user=request.user,
            permission_type='edit'
        ).values_list('department_id', flat=True)
        department_ids.update(permitted_dept_ids)
        
        # Get all departments that user has access to
        permitted_departments = Department.objects.filter(id__in=department_ids)
        serializer = DepartmentSerializer(permitted_departments, many=True)
        
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password or len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'success': 'Password changed successfully.'})

# Test email configuration
def test_email_configuration(request):
    """Test endpoint to verify email configuration"""
    try:
        # Test basic email sending
        send_mail(
            'Test Email from Django',
            'This is a test email to verify SMTP configuration.',
            settings.DEFAULT_FROM_EMAIL,
            [settings.ADMIN_EMAILS[0] if hasattr(settings, 'ADMIN_EMAILS') and settings.ADMIN_EMAILS else settings.DEFAULT_FROM_EMAIL],
            fail_silently=False,
        )
        return JsonResponse({'status': 'success', 'message': 'Test email sent successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
    



class MyOrgCCListAPIView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = MyCompanyCCSerializer

#---------------------
# API for superusers..
# --------------------- 


# department list create edit delete
class DepartmentListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class DepartmentRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class DesignationListCreateAPIView(generics.ListCreateAPIView):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer

class DesignationRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer


class UserCRUDAPIView(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer

class SignatoryCRUDAPIView(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Signatory.objects.all()
    serializer_class = SignatorySerializer