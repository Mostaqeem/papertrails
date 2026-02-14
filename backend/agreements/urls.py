from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgreementViewSet, AgreementListAPIView, AgreementDetailAPIView, AgreementFormDataAPIView, SubmitAgreementAPIView, EditAgreementAPIView, VendorCRUDAPIView, AgreementTypeViewSet, users_with_access
from django.urls import path
from . import views
from .views import (
    users_with_access, 
    manage_user_access,
    available_users
) 
from .views import DashboardStatsAPIView


router = DefaultRouter()
router.register(r'agreements', AgreementViewSet, basename='agreement')
router.register(r'vendors', VendorCRUDAPIView, basename='vendor')
router.register(r'agreement-types', AgreementTypeViewSet, basename='agreement-type')

urlpatterns = [
    # Match frontend expectations - explicit paths BEFORE router patterns
    path('form-data/', AgreementFormDataAPIView.as_view(), name='api-agreement-form-data'),
    path('submit/', SubmitAgreementAPIView.as_view(), name='api-submit-agreement'),
    path('edit/<int:agreement_id>/', EditAgreementAPIView.as_view(), name='api-edit-agreement'),
    path('users/available/', available_users, name='available_users'),
    path('dashboard-stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('search-options/', views.search_options, name='search-options'),
    path('search/', views.search_agreements, name='search_agreements'),
    path('<int:agreement_id>/users-with-access/', users_with_access, name='api-users-with-access'),
    path('<int:agreement_id>/users/', users_with_access, name='users_with_access'),
    path('<int:agreement_id>/users/manage/', manage_user_access, name='manage_user_access'),
    
    # Main list and detail endpoints
    path('', AgreementListAPIView.as_view(), name='api-agreement-list'),
    path('<int:pk>/', AgreementDetailAPIView.as_view(), name='api-agreement-detail'),
    
    # Router patterns last (lowest priority)
    path('', include(router.urls)),
]
