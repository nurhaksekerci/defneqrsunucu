from django.conf import settings
from django.db import models

from org.models import District, Hat


class UserProfile(models.Model):
    """
    Kullanıcı örgüt kapsamı.
    Etkinlik oluştururken hat ve ilçe buradan otomatik atanır (frontend’de sorulmaz).
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    hat = models.ForeignKey(
        Hat,
        verbose_name="hat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    district = models.ForeignKey(
        District,
        verbose_name="ilçe",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
    )
    is_provincial_official = models.BooleanField(
        "il yetkilisi",
        default=False,
        help_text=(
            "İşaretlenirse ilçe profilde boş olabilir; etkinlik oluştururken ilçe "
            "istemci tarafından seçilir. Hat atanması yine zorunludur."
        ),
    )

    class Meta:
        verbose_name = "Kullanıcı profili"
        verbose_name_plural = "Kullanıcı profilleri"

    def __str__(self) -> str:
        return f"Profil: {self.user.get_username()}"
