from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import District, Hat
from .serializers import DistrictSerializer, HatSerializer


class HatViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hat.objects.all()
    serializer_class = HatSerializer
    permission_classes = [IsAuthenticated]


class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.all().order_by("election_zone", "name", "id")
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated]
