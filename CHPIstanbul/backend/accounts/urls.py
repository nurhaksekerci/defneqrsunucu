from django.urls import path

from .jwt_views import ThrottledTokenObtainPairView, ThrottledTokenRefreshView
from .views import MeView

urlpatterns = [
    path("token/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", ThrottledTokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
]
