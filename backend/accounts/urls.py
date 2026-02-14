from django.urls import path
from .views import DepartmentListCreateAPIView,DepartmentRetrieveUpdateDestroyAPIView, DesignationListCreateAPIView, LoginView, LogoutView, DashboardView, DepartmentListAPIView, VendorListAPIView, MyDepartmentsAPIView, SignatoryListAPIView, MyOrgCCListAPIView
from .views import ChangePasswordView
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

router.register(r'users-config', views.UserCRUDAPIView, basename='all-users')
router.register(r'signatory-crud', views.SignatoryCRUDAPIView, basename='signatories')
urlpatterns = [
    path('login/', LoginView.as_view(), name='api-login'),
    path('logout/', LogoutView.as_view(), name='api-logout'),
    path('dashboard/', DashboardView.as_view(), name='api-dashboard'),
    path('departments/', DepartmentListAPIView.as_view(), name='department-list-api'),
    path('vendors/', VendorListAPIView.as_view(), name='vendor-list-api'),
    path('signatories/', SignatoryListAPIView.as_view(), name='signatory-list-api'),
    path('my_departments/', MyDepartmentsAPIView.as_view(), name='my-departments-api'),
    path('change-password/', ChangePasswordView.as_view(), name='api-change-password'),
    path('my_org_cc/', MyOrgCCListAPIView.as_view(), name='my-org-cc-api'),
    path('department-createlist/', DepartmentListCreateAPIView.as_view(), name='department-create-list-api'),
    path('department-update-delete/<int:pk>/', DepartmentRetrieveUpdateDestroyAPIView.as_view(), name='department-detail-api'),
    path('designations-createlist/', DesignationListCreateAPIView.as_view(), name='designation-list-create-api'),
    path('designation-update-delete/<int:pk>/', views.DesignationRetrieveUpdateDestroyAPIView.as_view(), name='designation-detail-api'),
] + router.urls
