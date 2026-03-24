from rest_framework import serializers

from org.models import District

from .models import Event, EventReport, ReportImage


class ReportImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportImage
        fields = ("id", "image", "sort_order")
        read_only_fields = ("id",)


class EventReportReadSerializer(serializers.ModelSerializer):
    images = ReportImageSerializer(many=True, read_only=True)

    class Meta:
        model = EventReport
        fields = ("id", "body", "status", "images", "created_at", "updated_at")


class EventListSerializer(serializers.ModelSerializer):
    hat_name = serializers.CharField(source="hat.name", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)
    coordination_kolu = serializers.SerializerMethodField()
    has_report = serializers.SerializerMethodField()
    report_id = serializers.SerializerMethodField()
    report_image_urls = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "description",
            "starts_at",
            "status",
            "hat_name",
            "coordination_kolu",
            "district_name",
            "location_kind",
            "address_text",
            "latitude",
            "longitude",
            "has_report",
            "report_id",
            "report_image_urls",
            "completed_at",
            "created_at",
        )

    def get_coordination_kolu(self, obj: Event) -> str:
        hat = obj.hat
        if not hat.coordination_bucket:
            return "—"
        return hat.get_coordination_bucket_display()

    def get_has_report(self, obj: Event) -> bool:
        return EventReport.objects.filter(event=obj).exists()

    def get_report_id(self, obj: Event) -> int | None:
        return (
            EventReport.objects.filter(event=obj)
            .values_list("pk", flat=True)
            .first()
        )

    def get_report_image_urls(self, obj: Event) -> list[str]:
        if obj.status != Event.Status.COMPLETED:
            return []
        request = self.context.get("request")
        try:
            r = obj.report
        except EventReport.DoesNotExist:
            return []
        out: list[str] = []
        for img in r.images.all()[:8]:
            url = img.image.url
            if request:
                url = request.build_absolute_uri(url)
            out.append(url)
        return out


class EventCreateSerializer(serializers.ModelSerializer):
    """İl yetkilisi için isteğe bağlı district (profilde ilçe yokken zorunlu, view'da doğrulanır)."""

    district = serializers.PrimaryKeyRelatedField(
        queryset=District.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Event
        fields = (
            "title",
            "description",
            "starts_at",
            "location_kind",
            "address_text",
            "latitude",
            "longitude",
            "district",
        )

    def validate(self, attrs):
        kind = attrs.get("location_kind")
        if kind == Event.LocationKind.ADDRESS:
            if not (attrs.get("address_text") or "").strip():
                raise serializers.ValidationError(
                    {"address_text": "Adres metni gerekli."},
                )
        elif kind == Event.LocationKind.MAP:
            if attrs.get("latitude") is None or attrs.get("longitude") is None:
                raise serializers.ValidationError(
                    "Harita seçiminde enlem ve boylam gerekli.",
                )
        return attrs


class EventReportTableSerializer(serializers.ModelSerializer):
    """Raporlar listesi (Next.js /raporlar ile uyumlu alan adları)."""

    etkinlik = serializers.CharField(source="event.title", read_only=True)
    hat = serializers.CharField(source="event.hat.name", read_only=True)
    ilce = serializers.CharField(source="event.district.name", read_only=True)
    gonderen = serializers.SerializerMethodField()
    durum = serializers.SerializerMethodField()
    ozet = serializers.CharField(source="body", read_only=True)
    gorseller = serializers.SerializerMethodField()
    event_id = serializers.IntegerField(source="event.id", read_only=True)
    status_code = serializers.CharField(source="status", read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = EventReport
        fields = (
            "id",
            "etkinlik",
            "hat",
            "ilce",
            "gonderen",
            "durum",
            "ozet",
            "gorseller",
            "updated_at",
            "event_id",
            "status_code",
            "can_edit",
        )

    def get_gonderen(self, obj: EventReport) -> str:
        u = obj.event.created_by
        if not u:
            return "—"
        return u.get_full_name() or u.get_username()

    def get_durum(self, obj: EventReport) -> str:
        return obj.get_status_display()

    def get_gorseller(self, obj: EventReport):
        request = self.context.get("request")
        out = []
        for img in obj.images.all():
            url = img.image.url
            if request:
                url = request.build_absolute_uri(url)
            out.append(url)
        return out

    def get_can_edit(self, obj: EventReport) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if getattr(request.user, "is_staff", False):
            return True
        ev = obj.event
        if ev.created_by_id is None:
            return False
        return ev.created_by_id == request.user.pk


class EventReportRetrieveSerializer(EventReportTableSerializer):
    """Detay: görsel id (düzenlemede kaldırmak için)."""

    image_items = serializers.SerializerMethodField()

    class Meta(EventReportTableSerializer.Meta):
        fields = EventReportTableSerializer.Meta.fields + ("image_items",)

    def get_image_items(self, obj: EventReport):
        request = self.context.get("request")
        out = []
        for img in obj.images.all():
            url = img.image.url
            if request:
                url = request.build_absolute_uri(url)
            out.append({"id": img.id, "url": url})
        return out


class EventDetailSerializer(EventListSerializer):
    report = serializers.SerializerMethodField()

    class Meta(EventListSerializer.Meta):
        fields = EventListSerializer.Meta.fields + ("report",)

    def get_report(self, obj: Event):
        try:
            r = obj.report
        except EventReport.DoesNotExist:
            return None
        return EventReportReadSerializer(r, context=self.context).data
