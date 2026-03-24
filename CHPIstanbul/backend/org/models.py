from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify
from safedelete.models import SafeDeleteModel
from simple_history.models import HistoricalRecords

# Hat kodu (slug) üretimi: önce Türkçe harfler ASCII eşdeğerine, sonra slugify (allow_unicode=False).
_TURKISH_TO_ASCII = str.maketrans(
    {
        "ç": "c",
        "Ç": "C",
        "ğ": "g",
        "Ğ": "G",
        "ı": "i",
        "İ": "I",
        "ö": "o",
        "Ö": "O",
        "ş": "s",
        "Ş": "S",
        "ü": "u",
        "Ü": "U",
    }
)


def turkish_to_ascii(text: str) -> str:
    return text.translate(_TURKISH_TO_ASCII)


class Hat(SafeDeleteModel):
    """Örgüt hattı (Ana Kademe, gençlik, kadın, komisyon vb.)."""

    history = HistoricalRecords()

    class CoordinationBucket(models.TextChoices):
        ANA_KADEME = "ana_kademe", "Ana Kademe"
        GENCLIK = "genclik", "Gençlik Kolları"
        KADIN = "kadin", "Kadın Kolları"

    class CoordinationLine(models.TextChoices):
        IL_BASKANLIGI = "il_baskanligi", "İl Başkanlığı"
        ILCE_BASKANLIGI = "ilce_baskanligi", "İlçe Başkanlığı"
        KOMISYON = "komisyon", "Komisyon"

    code = models.SlugField(
        "kod",
        unique=True,
        max_length=64,
        allow_unicode=True,
        blank=True,
        help_text=(
            "Boş bırakılırsa ad alanından otomatik üretilir: önce Türkçe harfler İngilizce "
            "karşılıklarına çevrilir, sonra koddaki gibi kısa bir slug üretilir."
        ),
    )
    name = models.CharField("ad", max_length=120)
    is_coordination_hat = models.BooleanField(
        "koordinasyon hattı (Ana Kademe)",
        default=False,
        help_text=(
            "İlçe kullanıcısı: yalnızca kendi ilçesindeki tüm hatların etkinliklerini görür. "
            "İl yetkilisi: il genelinde tüm hatların etkinliklerini görür; isteğe bağlı ilçe "
            "filtresi kullanılabilir."
        ),
    )
    coordination_bucket = models.CharField(
        "koordinasyon kolu",
        max_length=32,
        choices=CoordinationBucket.choices,
        blank=True,
        null=True,
        help_text=(
            "Koordinasyon kullanıcıları kol süzgecinde (Ana Kademe / Gençlik / Kadın) bu hattı gruplar. "
            "Boş bırakılırsa kol süzgeci bu hatı listelemez."
        ),
    )
    coordination_line = models.CharField(
        "kol içi hat türü",
        max_length=32,
        choices=CoordinationLine.choices,
        blank=True,
        null=True,
        help_text=(
            "Kol seçildiğinde hat süzgecinde: İl Başkanlığı, İlçe Başkanlıkları veya Komisyonlar "
            "grubunda gösterilir. Kol ile birlikte doldurulmalıdır."
        ),
    )
    election_zone = models.PositiveSmallIntegerField(
        "seçim bölgesi",
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(3)],
        help_text=(
            "İstanbul milletvekili seçim bölgesi (1, 2 veya 3). "
            "Ana Kademe İlçe Başkanlığı hatları için İl Başkanlığı sidebar sekmelerinde kullanılır."
        ),
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Hat"
        verbose_name_plural = "Hatlar"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        raw = (self.code or "").strip()
        if not raw:
            self.code = self._unique_code_from_name()
        super().save(*args, **kwargs)

    def _unique_code_from_name(self) -> str:
        ascii_name = turkish_to_ascii(self.name)
        base = slugify(ascii_name, allow_unicode=False) or "hat"
        base = base[:50]
        qs = Hat.all_objects.exclude(pk=self.pk) if self.pk else Hat.all_objects.all()
        n = 0
        while True:
            suffix = f"-{n}" if n else ""
            candidate = f"{base}{suffix}"[:64]
            if not qs.filter(code=candidate).exists():
                return candidate
            n += 1
            if n > 10_000:
                raise ValueError("Hat kodu uretilemedi (cok fazla carpisma).")


class District(SafeDeleteModel):
    """İlçe (İstanbul)."""

    history = HistoricalRecords()

    name = models.CharField("ad", max_length=120)
    election_zone = models.PositiveSmallIntegerField(
        "seçim bölgesi",
        null=True,
        blank=True,
        help_text=(
            "İstanbul milletvekili seçim bölgesi (1, 2 veya 3). "
            "İl Başkanlığı görünümünde ilçeler bu alana göre gruplanır."
        ),
    )

    class Meta:
        ordering = ["election_zone", "name", "id"]
        verbose_name = "İlçe"
        verbose_name_plural = "İlçeler"

    def __str__(self) -> str:
        return self.name
