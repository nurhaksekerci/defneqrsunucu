"""Simple History + django-safedelete admin birleşimi."""

from django.contrib import messages
from django.contrib.admin import helpers
from django.core.exceptions import PermissionDenied
from django.db.models.deletion import ProtectedError
from django.template.response import TemplateResponse
from django.utils.encoding import force_str
from django.utils.translation import gettext_lazy as _

from safedelete.admin import SafeDeleteAdmin
from safedelete.config import HARD_DELETE
from safedelete.utils import related_objects
from simple_history.admin import SimpleHistoryAdmin


class SafeDeleteHistoryAdmin(SafeDeleteAdmin, SimpleHistoryAdmin):
    """
    - Liste: varsayılan yöneticiden tüm kayıtlar (silinmişler \"Deleted\" filtresiyle).
    - **Seçilenleri sil** (site aksiyonu): yumuşak sil.
    - **Seçilen yumuşak silinmişleri kalıcı sil**: yalnızca çöpteki kayıtlar.
    - **Seçilenleri geri yükle**: yumuşak silinmişleri geri alır.
    - **Seçilenleri kalıcı sil (tamamen)**: aktif veya silinmiş; veritabanından kaldırır.
    """

    actions = (*SafeDeleteAdmin.actions, "hard_delete_selected_permanent")

    # Paket şablonu action=hard_delete_soft_deleted sabitlediği için kendi şablonumuz:
    hard_delete_permanent_confirmation_template = (
        "safedelete/hard_delete_permanent_confirmation.html"
    )

    @staticmethod
    def _format_protected_error(exc: ProtectedError) -> str:
        objs = getattr(exc, "protected_objects", None) or ()
        bits = sorted({force_str(o) for o in objs})[:12]
        tail = f" … (+{len(objs) - 12})" if len(objs) > 12 else ""
        detail = f" {', '.join(bits)}{tail}" if bits else f" {exc.args[0]}"
        return (
            "Kalıcı silinemedi: bu kayıtlara hâlâ bağlı başka kayıtlar var "
            "(ör. etkinlik). Önce bağlı etkinlikleri kaldırın veya yalnızca "
            "'Seçilenleri sil' ile yumuşak silin."
            + detail
        )

    def hard_delete_soft_deleted(self, request, queryset):
        try:
            return super().hard_delete_soft_deleted(request, queryset)
        except ProtectedError as exc:
            self.message_user(
                request,
                self._format_protected_error(exc),
                messages.ERROR,
            )
            return None

    def hard_delete_selected_permanent(self, request, queryset):
        """Seçili kayıtları HARD_DELETE ile kaldır (soft silinmiş veya aktif)."""
        if not self.has_delete_permission(request):
            raise PermissionDenied

        if request.POST.get("post"):
            requested = queryset.count()
            if requested:
                try:
                    changed, _delete_breakdown = queryset.delete(
                        force_policy=HARD_DELETE
                    )
                except ProtectedError as exc:
                    self.message_user(
                        request,
                        self._format_protected_error(exc),
                        messages.ERROR,
                    )
                    return None
                self.message_user(
                    request,
                    _("Kalıcı silme tamamlandı (silinen toplam kayıt: %(n)d).")
                    % {"n": changed},
                    messages.SUCCESS,
                )
            else:
                self.message_user(
                    request,
                    _("Silinecek seçili kayıt bulunamadı (onay formu yanlış veya süre doldu)."),
                    messages.WARNING,
                )
            return None

        opts = self.model._meta
        if len(queryset) == 1:
            objects_name = force_str(opts.verbose_name)
        else:
            objects_name = force_str(opts.verbose_name_plural)
        title = _("Emin misiniz?")

        related_list = [list(related_objects(obj)) for obj in queryset]

        context = {
            "title": title,
            "objects_name": objects_name,
            "queryset": queryset,
            "opts": opts,
            "app_label": opts.app_label,
            "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
            "related_list": related_list,
        }

        return TemplateResponse(
            request,
            self.hard_delete_permanent_confirmation_template,
            context,
        )

    hard_delete_selected_permanent.short_description = _(  # type: ignore[attr-defined]
        "Seçilenleri kalıcı sil (tamamen kaldır)"
    )
