from django.conf import settings
from django.db import models
from safedelete import SOFT_DELETE_CASCADE
from safedelete.models import SafeDeleteModel
from simple_history.models import HistoricalRecords

from org.models import District, Hat


class Event(SafeDeleteModel):
    """Etkinlik; silindiğinde ilişkili rapor da yumuşak silinir (SOFT_DELETE_CASCADE)."""

    _safedelete_policy = SOFT_DELETE_CASCADE

    history = HistoricalRecords()

    class Status(models.TextChoices):
        PLANNED = "planned", "Planlandı"
        COMPLETED = "completed", "Tamamlandı"

    class LocationKind(models.TextChoices):
        ADDRESS = "address", "Adres"
        MAP = "map", "Harita"

    title = models.CharField("başlık", max_length=255)
    description = models.TextField("açıklama")
    starts_at = models.DateTimeField("başlangıç")

    status = models.CharField(
        "durum",
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNED,
        db_index=True,
    )

    location_kind = models.CharField(
        "konum tipi",
        max_length=20,
        choices=LocationKind.choices,
    )
    address_text = models.TextField("adres metni", blank=True)
    latitude = models.DecimalField(
        "enlem",
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        "boylam",
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    hat = models.ForeignKey(
        Hat,
        verbose_name="hat",
        on_delete=models.PROTECT,
        related_name="events",
    )
    district = models.ForeignKey(
        District,
        verbose_name="ilçe",
        on_delete=models.PROTECT,
        related_name="events",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_events",
    )
    completed_at = models.DateTimeField("tamamlanma", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-starts_at"]
        verbose_name = "Etkinlik"
        verbose_name_plural = "Etkinlikler"

    def __str__(self) -> str:
        return self.title


class EventReport(SafeDeleteModel):
    history = HistoricalRecords()

    class Status(models.TextChoices):
        DRAFT = "draft", "Taslak"
        REVIEW = "review", "İncelemede"
        PUBLISHED = "published", "Yayında"

    event = models.OneToOneField(
        Event,
        on_delete=models.CASCADE,
        related_name="report",
    )
    body = models.TextField("özet")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Etkinlik raporu"
        verbose_name_plural = "Etkinlik raporları"

    def __str__(self) -> str:
        return f"Rapor: {self.event.title}"


class ReportImage(models.Model):
    report = models.ForeignKey(
        EventReport,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="reports/%Y/%m/")
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Rapor görseli"
        verbose_name_plural = "Rapor görselleri"
