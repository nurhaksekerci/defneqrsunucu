"""SafeDeleteHistoryAdmin yardımcıları."""

from unittest.mock import MagicMock, patch

import pytest
from django.contrib import messages
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.contrib.messages.storage.fallback import FallbackStorage
from django.db.models.deletion import ProtectedError
from django.test import RequestFactory

from config.admin_mixins import SafeDeleteHistoryAdmin
from org.models import Hat

User = get_user_model()


class _HatAdmin(SafeDeleteHistoryAdmin):
    """Test için somut admin sınıfı."""

    pass


@pytest.mark.django_db
class TestSafeDeleteHistoryAdmin:
    def test_format_protected_error_lists_objects(self):
        class Obj:
            def __str__(self):
                return "ProtectedThing"

        exc = ProtectedError("msg", {Obj()})
        text = SafeDeleteHistoryAdmin._format_protected_error(exc)
        assert "Kalıcı silinemedi" in text
        assert "ProtectedThing" in text

    def test_hard_delete_permanent_catches_protected_error(self):
        site = AdminSite()
        ma = _HatAdmin(Hat, site)
        rf = RequestFactory()
        request = rf.post("/", {"post": "yes"})
        request.user = User.objects.create_superuser("adm", "a@a.com", "pw")
        setattr(request, "session", "session")
        setattr(request, "_messages", FallbackStorage(request))

        qs = MagicMock()
        qs.count.return_value = 1
        qs.delete.side_effect = ProtectedError("x", set())

        with patch.object(ma, "message_user") as mu:
            ma.hard_delete_selected_permanent(request, qs)
        mu.assert_called_once()
        assert mu.call_args[0][2] == messages.ERROR
