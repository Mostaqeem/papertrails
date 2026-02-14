from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from agreements import views
from .views import get_csrf_token



urlpatterns = [
    path('admin/', admin.site.urls),

    # ✅ API routes
    path('api/agreements/', include('agreements.urls')),
    path('api/letters/', include('letters.urls')),
    path('api/accounts/', include('accounts.urls')),
    path("api/agreements/search-options/", views.search_options, name="search-options"),
    path('api/agreements/search/', views.search_agreements, name='search_agreements'),
   
    # ✅ CSRF token endpoint for frontend React app
    path('api/get-csrf/', get_csrf_token),
]

# ✅ Media file serving in development only
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
