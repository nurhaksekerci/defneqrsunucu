from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DistrictViewSet, HatViewSet

router = DefaultRouter()
router.register("hats", HatViewSet, basename="hat")
router.register("districts", DistrictViewSet, basename="district")

urlpatterns = [
    path("", include(router.urls)),
]
