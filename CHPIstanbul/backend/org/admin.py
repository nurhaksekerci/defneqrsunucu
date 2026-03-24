"""
Org uygulaması — Hat ve İlçe için Django admin.

SafeDelete + simple-history: liste, silinmiş filtresi, geri yükleme ve kalıcı sil
aksiyonları `SafeDeleteHistoryAdmin` üzerinden gelir.
"""

from django.contrib import admin
from django.db.models import Count
from django.utils.translation import gettext_lazy as _
from safedelete.admin import SafeDeleteAdminFilter, highlight_deleted
from safedelete.config import FIELD_NAME

from config.admin_mixins import SafeDeleteHistoryAdmin

from .models import District, Hat


@admin.register(Hat)
class HatAdmin(SafeDeleteHistoryAdmin):
    """Örgüt hattı; API ve profil atamalarında kullanılır."""

    field_to_highlight = "name"

    list_display = (
        highlight_deleted,
        "name",
        "code",
        "election_zone",
        "is_coordination_hat",
        "coordination_bucket",
        "coordination_line",
        "event_count",
        "profile_count",
        FIELD_NAME,
    )
    list_display_links = ("name",)
    list_filter = (
        SafeDeleteAdminFilter,
        "election_zone",
        "is_coordination_hat",
        "coordination_bucket",
        "coordination_line",
    )
    search_fields = ("name", "code")
    ordering = ("name",)

    fieldsets = (
        (_("Temel"), {"fields": ("name", "code", "is_coordination_hat")}),
        (
            _("Koordinasyon"),
            {
                "fields": ("coordination_bucket", "coordination_line", "election_zone"),
                "description": _(
                    "Kol / hat türü (İl Başkanlığı, İlçe Başkanlığı, Komisyon); "
                    "koordinasyon süzgeçleri için. Kol doluysa hat türünü de seçin. "
                    "Ana Kademe İlçe Başkanlığı için seçim bölgesi (1–3) sidebar’da kullanılır."
                ),
            },
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _event_count=Count("events", distinct=True),
            _profile_count=Count("userprofile", distinct=True),
        )

    @admin.display(ordering="_event_count", description=_("Etkinlik sayısı"))
    def event_count(self, obj):
        return getattr(obj, "_event_count", 0)

    @admin.display(ordering="_profile_count", description=_("Bağlı profil"))
    def profile_count(self, obj):
        return getattr(obj, "_profile_count", 0)


@admin.register(District)
class DistrictAdmin(SafeDeleteHistoryAdmin):
    """İlçe; etkinlik ve (isteğe bağlı) kullanıcı profili ile ilişkilidir."""

    field_to_highlight = "name"

    list_display = (
        highlight_deleted,
        "name",
        "election_zone",
        "event_count",
        "user_count",
        FIELD_NAME,
    )
    list_display_links = ("name",)
    list_filter = (SafeDeleteAdminFilter, "election_zone")
    search_fields = ("name",)
    ordering = ("election_zone", "name", "id")

    fieldsets = ((None, {"fields": ("name", "election_zone")}),)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _event_count=Count("events", distinct=True),
            _user_count=Count("users", distinct=True),
        )

    @admin.display(ordering="_event_count", description=_("Etkinlik sayısı"))
    def event_count(self, obj):
        return getattr(obj, "_event_count", 0)

    @admin.display(ordering="_user_count", description=_("İlçe profili"))
    def user_count(self, obj):
        return getattr(obj, "_user_count", 0)
