from django.db.models import Count
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import District, Hat
from .serializers import DistrictSerializer, HatSerializer


class HatViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Hat.objects.annotate(
            event_count=Count("events", distinct=True),
            profile_count=Count("userprofile", distinct=True),
        )
        params = self.request.query_params
        cl = params.get("coordination_line")
        cb = params.get("coordination_bucket")
        ez = params.get("election_zone")
        if cl:
            qs = qs.filter(coordination_line=cl)
        if cb:
            qs = qs.filter(coordination_bucket=cb)
        if ez is not None and ez != "":
            try:
                z = int(ez)
                if z in (1, 2, 3):
                    qs = qs.filter(election_zone=z)
            except (TypeError, ValueError):
                pass
        return qs.order_by("name")


class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.all().order_by("election_zone", "name", "id")
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated]
