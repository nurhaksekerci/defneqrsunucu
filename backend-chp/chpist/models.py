from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class BranchKind(models.TextChoices):
    ANA_KADEME = 'ana_kademe', 'Ana Kademe'
    GENCLIK = 'genclik', 'Gençlik Kolları'
    KADIN = 'kadin', 'Kadın Kolları'
    KOMISYON = 'komisyon', 'Komisyon'


class GeographicLevel(models.TextChoices):
    IL = 'il', 'İl'
    SECIM_BOLGESI = 'secim_bolgesi', 'Seçim Bölgesi'
    ILCE = 'ilce', 'İlçe'
    MAHALLE = 'mahalle', 'Mahalle'


class GeographicNode(models.Model):
    """İl → Seçim Bölgesi → İlçe → Mahalle coğrafi ağacı."""

    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children',
    )
    level = models.CharField(max_length=20, choices=GeographicLevel.choices, db_index=True)
    name = models.CharField(max_length=200)
    code = models.SlugField(
        max_length=64,
        unique=True,
        help_text='Benzersiz kod (akış filtresi, API).',
    )

    class Meta:
        ordering = ['code']

    def __str__(self) -> str:
        return self.name

    def clean(self) -> None:
        if self.parent_id:
            order = [
                GeographicLevel.IL,
                GeographicLevel.SECIM_BOLGESI,
                GeographicLevel.ILCE,
                GeographicLevel.MAHALLE,
            ]
            try:
                pi = order.index(self.parent.level)  # type: ignore[arg-type]
                ci = order.index(self.level)
            except ValueError as e:
                raise ValidationError('Geçersiz seviye.') from e
            if ci != pi + 1:
                raise ValidationError('Üst düğüm seviyesi bir üst kademe olmalıdır.')
        else:
            if self.level != GeographicLevel.IL:
                raise ValidationError('Kök düğüm yalnızca İl olabilir.')

    def path_from_root(self) -> str:
        parts: list[str] = []
        n: GeographicNode | None = self
        while n:
            parts.append(n.name)
            n = n.parent
        return ' › '.join(reversed(parts))

    def get_ilce(self) -> 'GeographicNode | None':
        """Kendisi veya üstlerinden ilçe düğümünü döndürür."""
        n: GeographicNode | None = self
        while n:
            if n.level == GeographicLevel.ILCE:
                return n
            n = n.parent
        return None


class Commission(models.Model):
    """Dinamik komisyon tanımları (AR-GE, vb.)."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=64, unique=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class OrgUnit(models.Model):
    """
    Belirli bir coğrafi düğümde bir kol (Ana Kademe, Gençlik, Kadın, Komisyon).
    Etkinlikler ve gönderiler bu birime bağlanır.
    """

    geographic_node = models.ForeignKey(
        GeographicNode,
        on_delete=models.PROTECT,
        related_name='org_units',
    )
    branch = models.CharField(max_length=32, choices=BranchKind.choices, db_index=True)
    commission = models.ForeignKey(
        Commission,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='org_units',
    )
    ilce_code = models.CharField(
        max_length=64,
        blank=True,
        db_index=True,
        help_text='Denormalize: bağlı coğrafyanın ilçe kodu (filtre).',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['geographic_node', 'branch', 'commission'],
                name='uniq_org_unit_geo_branch_commission',
            ),
        ]

    def __str__(self) -> str:
        return self.label_path()

    def clean(self) -> None:
        if self.branch == BranchKind.KOMISYON:
            if not self.commission_id:
                raise ValidationError('Komisyon kolu için komisyon seçilmelidir.')
        elif self.commission_id:
            raise ValidationError('Komisyon kolu dışında komisyon atanamaz.')

    def label_path(self) -> str:
        geo = self.geographic_node.path_from_root()
        branch_label = self.get_branch_display()
        if self.branch == BranchKind.KOMISYON and self.commission_id:
            branch_label = f'{branch_label} ({self.commission.name})'
        return f'{branch_label} › {geo}'

    def save(self, *args, **kwargs) -> None:
        ilce = self.geographic_node.get_ilce()
        self.ilce_code = ilce.code if ilce else ''
        super().save(*args, **kwargs)


class MembershipRole(models.TextChoices):
    MEMBER = 'member', 'Üye'
    DELEGATE = 'delegate', 'Temsilci'
    CHAIR = 'chair', 'Başkan'
    COORDINATOR = 'coordinator', 'Koordinatör'


class OrgMembership(models.Model):
    """Kullanıcının hangi org biriminde hangi rolle temsil edildiği."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='org_memberships',
    )
    org_unit = models.ForeignKey(
        OrgUnit,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    role = models.CharField(
        max_length=32,
        choices=MembershipRole.choices,
        default=MembershipRole.MEMBER,
        db_index=True,
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        help_text='Görünen unvan (örn. İlçe Başkan Yardımcısı).',
    )
    is_primary = models.BooleanField(
        default=False,
        help_text='Üst çubukta varsayılan olarak gösterilecek birim.',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'org_unit'],
                name='uniq_org_membership_user_org_unit',
            ),
        ]
        ordering = ['-is_primary', 'org_unit_id']

    def __str__(self) -> str:
        return f'{self.user} @ {self.org_unit_id}'

    def save(self, *args, **kwargs) -> None:
        super().save(*args, **kwargs)
        if self.is_primary:
            OrgMembership.objects.filter(user_id=self.user_id).exclude(pk=self.pk).update(
                is_primary=False
            )


class Post(models.Model):
    """Akış gönderisi (tamamlanmış etkinlik paylaşımı)."""

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='posts',
    )
    author_label = models.CharField(max_length=200, help_text='Görünen yazar / birim adı')
    org_unit = models.ForeignKey(
        OrgUnit,
        on_delete=models.PROTECT,
        related_name='posts',
    )
    event_title = models.CharField(
        max_length=300,
        blank=True,
        help_text='Kaynak planlanan etkinliğin başlığı (akışta gösterilir).',
    )
    event_description = models.TextField(
        blank=True,
        help_text='Kaynak planlanan etkinliğin açıklaması.',
    )
    event_location = models.TextField(
        blank=True,
        help_text='Etkinlik yeri (planlama / tamamlama anından kopyalanır, düzenlenebilir).',
    )
    event_start_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Planlanan etkinlik başlangıcı (tamamlanan gönderilerde gösterim / düzenleme).',
    )
    caption = models.TextField(blank=True)
    event_category_id = models.CharField(max_length=64, db_index=True)
    like_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Post {self.pk} — {self.author_label[:40]}'


class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='posts/%Y/%m/')
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'pk']


class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='post_likes',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['post', 'user'], name='unique_post_like_user'),
        ]


class PlannedEventStatus(models.TextChoices):
    PLANNED = 'planned', 'Planlandı'
    COMPLETED = 'completed', 'Tamamlandı'


class PlannedEvent(models.Model):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='planned_events',
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    org_unit = models.ForeignKey(
        OrgUnit,
        on_delete=models.PROTECT,
        related_name='planned_events',
    )
    start_at = models.DateTimeField(db_index=True)
    location = models.TextField()
    event_category_id = models.CharField(max_length=64, blank=True)
    status = models.CharField(
        max_length=20,
        choices=PlannedEventStatus.choices,
        default=PlannedEventStatus.PLANNED,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_at']

    def __str__(self) -> str:
        return self.title


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.title
