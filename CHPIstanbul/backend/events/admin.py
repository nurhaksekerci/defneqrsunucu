from django.contrib import admin
from safedelete.admin import SafeDeleteAdminFilter, highlight_deleted
from safedelete.config import FIELD_NAME

from config.admin_mixins import SafeDeleteHistoryAdmin

from .models import Event, EventReport, ReportImage


class ReportImageInline(admin.TabularInline):
    model = ReportImage
    extra = 0


@admin.register(EventReport)
class EventReportAdmin(SafeDeleteHistoryAdmin):
    field_to_highlight = "status"
    list_display = (
        highlight_deleted,
        "event",
        "status",
        "updated_at",
        FIELD_NAME,
    )
    list_filter = ("status", SafeDeleteAdminFilter)
    inlines = (ReportImageInline,)
    search_fields = ("event__title", "body")


@admin.register(Event)
class EventAdmin(SafeDeleteHistoryAdmin):
    field_to_highlight = "title"
    list_display = (
        highlight_deleted,
        "title",
        "status",
        "hat",
        "district",
        "starts_at",
        "created_by",
        FIELD_NAME,
    )
    list_filter = ("status", "hat", "district", SafeDeleteAdminFilter)
    search_fields = ("title", "description")
    date_hierarchy = "starts_at"
    raw_id_fields = ("created_by",)
