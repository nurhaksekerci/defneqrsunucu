import os

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chpist.urls')),
]

_serve_media = os.environ.get("SERVE_MEDIA", "False").lower() in (
    "1",
    "true",
    "yes",
)

if settings.DEBUG or _serve_media:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
