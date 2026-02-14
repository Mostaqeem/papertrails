from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'organizations_crud', views.OrganizationViewSet, basename='organization')
router.register(r'recipients_crud', views.RecipientViewSet, basename='recipient')
router.register(r'categories_crud', views.CategoryViewSet, basename='category')
router.register(r'', views.LetterListView, basename='letter')

urlpatterns = [
    path('organizations/', views.OrganizationListView.as_view(), name='organization-list'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('recipients/', views.RecipientListView.as_view(), name='recipient-list'),
    path('<int:pk>/preview/', views.LetterPreviewAPIView.as_view(), name='letter-preview'),
    path('<int:pk>/pdf/', views.LetterPDFAPIView.as_view(), name='letter-pdf'),
    path('create/', views.LetterCreateView.as_view(), name='letter-create'),
    path('cc/same-organization/', views.CCSameOrgListView.as_view(), name='cc-same-organization-list'),
    path('cc/other-organization/', views.CCOtherOrgListView.as_view(), name='cc-other-organization-list'),
    path('internal-references/', views.InternalReferencesListView.as_view(), name='internal-references-list'),
    path('next-reference/', views.NextReferenceNumberAPIView.as_view(), name='next-reference'),
    path('letter_file/', views.LetterFileSaveView.as_view(), name='letter-file-upload-list'),
] + router.urls
