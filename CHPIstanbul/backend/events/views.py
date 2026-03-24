"""Etkinlik CRUD, tamamlama ve multipart rapor yükleme API görünümleri."""

from __future__ import annotations

from django.db import transaction
from django.db.models import Prefetch, QuerySet
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Event, EventReport, ReportImage
from .scope import filter_events_for_list
from .serializers import (
    EventCreateSerializer,
    EventDetailSerializer,
    EventListSerializer,
    EventReportReadSerializer,
    EventReportRetrieveSerializer,
    EventReportTableSerializer,
)

_REPORT_STATUS_CODES = frozenset(c[0] for c in EventReport.Status.choices)


def _user_may_modify_report(user, event: Event) -> None:
    """Staff, created_by yoksa (kapsamda) herkes; aksi halde yalnızca oluşturan."""
    if getattr(user, "is_staff", False):
        return
    if event.created_by_id is None:
        return
    if event.created_by_id != user.pk:
        raise PermissionDenied(
            "Bu raporu yalnızca etkinliği oluşturan kullanıcı düzenleyebilir.",
        )


def _parse_remove_image_ids(request: Request) -> list[int]:
    data = request.data
    if hasattr(data, "getlist"):
        parts = []
        for k in ("remove_image_ids", "remove_image_ids[]"):
            parts.extend(data.getlist(k))
    else:
        raw = data.get("remove_image_ids")
        if raw is None:
            parts = []
        elif isinstance(raw, list):
            parts = raw
        else:
            parts = [raw]
    out: list[int] = []
    for p in parts:
        if p is None or p == "":
            continue
        for x in str(p).replace(",", " ").split():
            s = x.strip()
            if s.isdigit():
                out.append(int(s))
    return out


def _filter_events_by_date_and_status(
    qs: QuerySet[Event],
    params,
) -> QuerySet[Event]:
    st = params.get("status")
    if st in (Event.Status.PLANNED, Event.Status.COMPLETED):
        qs = qs.filter(status=st)
    df = params.get("date_from")
    dt = params.get("date_to")
    if df:
        qs = qs.filter(starts_at__date__gte=df)
    if dt:
        qs = qs.filter(starts_at__date__lte=dt)
    return qs


def _district_id_for_new_event(profile, district_submitted):
    """İlçe örgütü / il yetkilisi kurallarına göre district PK."""
    if profile.district_id is not None:
        if district_submitted is not None and district_submitted.pk != profile.district_id:
            raise ValidationError(
                {"district": "İlçe örgüt kullanıcıları farklı ilçe seçemez."},
            )
        return profile.district_id
    if profile.is_provincial_official:
        if district_submitted is None:
            raise ValidationError(
                {"district": "İl yetkilisi için etkinlik ilçesi gönderilmelidir."},
            )
        return district_submitted.pk
    raise ValidationError(
        "Etkinlik oluşturmak için yöneticinin profilinize ilçe ataması gerekir "
        "veya kullanıcı il yetkilisi olarak işaretlenmelidir.",
    )


def _lock_event_row(event: Event) -> None:
    """Aynı etkinlik için eşzamanlı rapor oluşturmayı sıraya sokar."""
    Event.objects.select_for_update().filter(pk=event.pk).values_list(
        "pk",
        flat=True,
    ).first()


def _load_or_prepare_report(event: Event, body: str) -> tuple[EventReport, bool]:
    """
    Silinmiş rapor satırı objects ile görünmez; all_objects + undelete gerekir.
    Dönüş: (rapor, created) — created=True ise henüz save edilmemiş olabilir.
    """
    existing = (
        EventReport.all_objects.select_for_update()
        .filter(event=event)
        .first()
    )
    if existing is None:
        return EventReport(event=event, body=body), True
    if existing.deleted:
        existing.undelete()
    existing.body = body
    return existing, False


def _set_report_status_from_request(report: EventReport, request: Request) -> None:
    st = request.data.get("status")
    if st in _REPORT_STATUS_CODES:
        report.status = st


def _is_uploaded_file_obj(obj: object) -> bool:
    return hasattr(obj, "read") and callable(getattr(obj, "read"))


def _values_for_multipart_key(request: Request, key: str) -> list:
    """Aynı alan adı FILES ve request.data (DRF birleşik sözlük) içinde farklı görünebilir."""
    seen: set[int] = set()
    out: list = []
    for container in (request.FILES, request.data):
        if not hasattr(container, "getlist"):
            continue
        for item in container.getlist(key):
            if not _is_uploaded_file_obj(item):
                continue
            iid = id(item)
            if iid in seen:
                continue
            seen.add(iid)
            out.append(item)
    return out


def _uploaded_report_image_files(request: Request) -> list:
    """Tarayıcı / istemci `images` veya `images[]` gönderebilir."""
    for key in ("images", "images[]"):
        found = _values_for_multipart_key(request, key)
        if found:
            return found
    return []


def _sync_report_images(report: EventReport, request: Request) -> None:
    for rid in _parse_remove_image_ids(request):
        ReportImage.objects.filter(pk=rid, report=report).delete()
    files = _uploaded_report_image_files(request)
    base_order = report.images.count()
    for i, f in enumerate(files):
        ReportImage.objects.create(
            report=report,
            image=f,
            sort_order=base_order + i,
        )


class EventViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Etkinlik CRUD + tamamlama + rapor yükleme (multipart).

    Liste: ?status=planned|completed &date_from=&date_to=
    İl yetkilisi: ?district=<id>.
    Koordinasyon: ?coordination_bucket=ana_kademe|genclik|kadin & ?hat=<id>.
    """

    queryset = Event.objects.select_related(
        "hat",
        "district",
        "created_by",
    ).all()

    def get_serializer_class(self):
        if self.action == "create":
            return EventCreateSerializer
        if self.action == "retrieve":
            return EventDetailSerializer
        return EventListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        qs = filter_events_for_list(qs, self.request.user, params)
        qs = _filter_events_by_date_and_status(qs, params)
        if self.action in ("list", "retrieve"):
            qs = qs.prefetch_related(
                Prefetch(
                    "report__images",
                    queryset=ReportImage.objects.order_by("sort_order", "id"),
                ),
            )
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        profile = getattr(user, "profile", None)
        if not profile or profile.hat_id is None:
            raise ValidationError(
                "Etkinlik oluşturmak için profilinize hat atanmalıdır.",
            )

        validated = serializer.validated_data
        district_submitted = validated.pop("district", None)
        district_id = _district_id_for_new_event(profile, district_submitted)

        serializer.save(
            created_by=user,
            hat_id=profile.hat_id,
            district_id=district_id,
            status=Event.Status.PLANNED,
        )

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        event = self.get_object()
        if event.status == Event.Status.COMPLETED:
            return Response(
                {"detail": "Etkinlik zaten tamamlanmış."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        event.status = Event.Status.COMPLETED
        event.completed_at = timezone.now()
        event.save(update_fields=["status", "completed_at", "updated_at"])
        return Response(EventListSerializer(event).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="report",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def report(self, request, pk=None):
        event = self.get_object()
        if event.status != Event.Status.COMPLETED:
            return Response(
                {"detail": "Önce etkinlik tamamlanmalı."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        body = (request.data.get("body") or "").strip()
        if not body:
            return Response(
                {"body": "Rapor metni gerekli."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _user_may_modify_report(request.user, event)

        with transaction.atomic():
            _lock_event_row(event)
            report, created = _load_or_prepare_report(event, body)
            _set_report_status_from_request(report, request)
            report.save()
            _sync_report_images(report, request)

        report.refresh_from_db()
        return Response(
            EventReportReadSerializer(report, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class EventReportViewSet(viewsets.ReadOnlyModelViewSet):
    """Rapor listesi / detay; düzenleme POST /api/events/<id>/report/."""

    queryset = (
        EventReport.objects.select_related(
            "event",
            "event__hat",
            "event__district",
            "event__created_by",
        )
        .prefetch_related("images")
        .order_by("-updated_at")
    )
    serializer_class = EventReportTableSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return EventReportRetrieveSerializer
        return EventReportTableSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        scoped = filter_events_for_list(
            Event.objects.all(),
            self.request.user,
            params,
        )
        qs = qs.filter(event__in=scoped)
        st = params.get("status")
        if st in _REPORT_STATUS_CODES:
            qs = qs.filter(status=st)
        return qs
