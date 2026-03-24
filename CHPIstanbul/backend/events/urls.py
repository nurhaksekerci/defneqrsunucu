from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventReportViewSet, EventViewSet

router = DefaultRouter()
router.register("events", EventViewSet, basename="event")
router.register("reports", EventReportViewSet, basename="report")

urlpatterns = [
    path("", include(router.urls)),
]
