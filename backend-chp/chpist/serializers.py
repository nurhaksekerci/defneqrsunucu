from django.utils import timezone, translation
from django.utils.timesince import timesince
from rest_framework import serializers

from .models import (
    BranchKind,
    Notification,
    OrgMembership,
    OrgUnit,
    PlannedEvent,
    PlannedEventStatus,
    Post,
    PostLike,
)
from .visibility import user_can_manage_post


class PostListSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    orgPath = serializers.SerializerMethodField()
    orgUnitId = serializers.SerializerMethodField()
    branch = serializers.SerializerMethodField()
    authorLabel = serializers.CharField(source='author_label')
    branchLabel = serializers.SerializerMethodField()
    imageUrls = serializers.SerializerMethodField()
    likes = serializers.IntegerField(source='like_count')
    liked = serializers.SerializerMethodField()
    timeLabel = serializers.SerializerMethodField()
    eventCategoryId = serializers.CharField(source='event_category_id')
    districtId = serializers.CharField(source='org_unit.ilce_code')

    eventTitle = serializers.CharField(source='event_title', allow_blank=True)
    eventDescription = serializers.CharField(source='event_description', allow_blank=True)
    isMine = serializers.SerializerMethodField()
    canManage = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'orgPath',
            'orgUnitId',
            'branch',
            'branchLabel',
            'authorLabel',
            'eventTitle',
            'eventDescription',
            'caption',
            'imageUrls',
            'likes',
            'liked',
            'isMine',
            'canManage',
            'timeLabel',
            'districtId',
            'eventCategoryId',
        ]

    def get_id(self, obj: Post) -> str:
        return str(obj.pk)

    def get_orgPath(self, obj: Post) -> str:
        return obj.org_unit.label_path()

    def get_orgUnitId(self, obj: Post) -> str:
        return str(obj.org_unit_id)

    def get_branch(self, obj: Post) -> str:
        return obj.org_unit.branch

    def get_branchLabel(self, obj: Post) -> str:
        return obj.org_unit.get_branch_display()

    def get_imageUrls(self, obj: Post) -> list[str]:
        request = self.context.get('request')
        urls: list[str] = []
        for im in obj.images.all():
            url = im.image.url
            if request:
                url = request.build_absolute_uri(url)
            urls.append(url)
        return urls

    def get_isMine(self, obj: Post) -> bool:
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated:
            return False
        return obj.author_id == user.id

    def get_canManage(self, obj: Post) -> bool:
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated:
            return False
        return user_can_manage_post(user, obj)

    def get_liked(self, obj: Post) -> bool:
        annotated = getattr(obj, 'user_liked', None)
        if annotated is not None:
            return bool(annotated)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated:
            return False
        return PostLike.objects.filter(post=obj, user=user).exists()

    def get_timeLabel(self, obj: Post) -> str:
        with translation.override('tr'):
            return timesince(obj.created_at)


class PostDetailSerializer(PostListSerializer):
    class Meta(PostListSerializer.Meta):
        pass


class PostUpdateSerializer(serializers.ModelSerializer):
    """Gönderi sahibinin alan güncellemesi (metin + etkinlik alanları + org birimi)."""

    eventTitle = serializers.CharField(
        source='event_title', required=False, allow_blank=True, max_length=300
    )
    eventDescription = serializers.CharField(
        source='event_description', required=False, allow_blank=True
    )
    eventCategoryId = serializers.CharField(
        source='event_category_id', required=False, allow_blank=True, max_length=64
    )
    orgUnitId = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.select_related('geographic_node', 'commission'),
        source='org_unit',
        required=False,
    )

    class Meta:
        model = Post
        fields = ['caption', 'eventTitle', 'eventDescription', 'eventCategoryId', 'orgUnitId']

    def validate_org_unit(self, value: OrgUnit) -> OrgUnit:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Oturum gerekli.')
        if request.user.is_staff:
            return value
        if not OrgMembership.objects.filter(user=request.user, org_unit=value).exists():
            raise serializers.ValidationError(
                'Bu organizasyon birimi için üyelik / yetki tanımlı değil.'
            )
        return value


class PlannedEventSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    orgPath = serializers.SerializerMethodField()
    branch = serializers.SerializerMethodField()
    branchLabel = serializers.SerializerMethodField()
    startLabel = serializers.SerializerMethodField()
    orgUnitId = serializers.SerializerMethodField()
    commissionId = serializers.SerializerMethodField()
    # Mobil / rapor: snake_case ile aynÄ± deÄŸer (tip: int | null); commissionId ile Ã§ift anahtar.
    commission_id = serializers.SerializerMethodField()
    startAt = serializers.DateTimeField(source='start_at', read_only=True)
    eventCategoryId = serializers.CharField(source='event_category_id', read_only=True)
    isMine = serializers.SerializerMethodField()

    class Meta:
        model = PlannedEvent
        fields = [
            'id',
            'title',
            'description',
            'status',
            'orgPath',
            'orgUnitId',
            'branch',
            'branchLabel',
            'startLabel',
            'startAt',
            'location',
            'eventCategoryId',
            'commissionId',
            'commission_id',
            'isMine',
        ]

    def _planned_commission_pk(self, obj: PlannedEvent) -> int | None:
        """Komisyon kolu deÄŸilse null; aksi halde her zaman JSON sayÄ±sÄ± (int), string Ã¼retilmez."""
        ou = obj.org_unit
        if ou.branch != BranchKind.KOMISYON:
            return None
        cid = ou.commission_id
        if cid is None:
            return None
        return int(cid)

    def get_id(self, obj: PlannedEvent) -> str:
        return str(obj.pk)

    def get_orgPath(self, obj: PlannedEvent) -> str:
        return obj.org_unit.label_path()

    def get_orgUnitId(self, obj: PlannedEvent) -> str:
        return str(obj.org_unit_id)

    def get_commissionId(self, obj: PlannedEvent) -> int | None:
        return self._planned_commission_pk(obj)

    def get_commission_id(self, obj: PlannedEvent) -> int | None:
        return self._planned_commission_pk(obj)

    def get_branch(self, obj: PlannedEvent) -> str:
        return obj.org_unit.branch

    def get_branchLabel(self, obj: PlannedEvent) -> str:
        return obj.org_unit.get_branch_display()

    def get_isMine(self, obj: PlannedEvent) -> bool:
        annotated = getattr(obj, 'user_is_mine', None)
        if annotated is not None:
            return bool(annotated)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated:
            return False
        return obj.created_by_id == user.id

    def get_startLabel(self, obj: PlannedEvent) -> str:
        dt = timezone.localtime(obj.start_at)
        aylar = (
            'Ocak',
            'Åubat',
            'Mart',
            'Nisan',
            'MayÄ±s',
            'Haziran',
            'Temmuz',
            'AÄŸustos',
            'EylÃ¼l',
            'Ekim',
            'KasÄ±m',
            'AralÄ±k',
        )
        return f'{dt.day} {aylar[dt.month - 1]} {dt.year}, {dt.strftime("%H:%M")}'


class PlannedEventUpdateSerializer(serializers.ModelSerializer):
    """Plan sahibi: planlanan iÃ§in tÃ¼m alanlar; tamamlanan iÃ§in yalnÄ±zca baÅŸlÄ±k/aÃ§Ä±klama."""

    orgUnitId = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.select_related('geographic_node', 'commission'),
        source='org_unit',
        required=False,
    )
    eventCategoryId = serializers.CharField(
        source='event_category_id', required=False, allow_blank=True, max_length=64
    )
    startAt = serializers.DateTimeField(source='start_at', required=False)

    class Meta:
        model = PlannedEvent
        fields = [
            'title',
            'description',
            'location',
            'startAt',
            'orgUnitId',
            'eventCategoryId',
        ]

    def validate(self, attrs: dict) -> dict:
        inst = self.instance
        if inst and inst.status == PlannedEventStatus.COMPLETED:
            allowed = {'title', 'description'}
            bad = set(attrs.keys()) - allowed
            if bad:
                raise serializers.ValidationError(
                    {
                        'detail': 'Tamamlanan etkinlikte yalnÄ±zca baÅŸlÄ±k ve aÃ§Ä±klama gÃ¼ncellenebilir.'
                    }
                )
        return attrs

    def validate_org_unit(self, value: OrgUnit) -> OrgUnit:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Oturum gerekli.')
        if request.user.is_staff:
            return value
        if not OrgMembership.objects.filter(user=request.user, org_unit=value).exists():
            raise serializers.ValidationError(
                'Bu organizasyon birimi iÃ§in Ã¼yelik / yetki tanÄ±mlÄ± deÄŸil.'
            )
        return value


class PlannedEventCreateSerializer(serializers.ModelSerializer):
    org_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.select_related('geographic_node', 'commission'),
        source='org_unit',
    )

    class Meta:
        model = PlannedEvent
        fields = [
            'title',
            'description',
            'org_unit_id',
            'start_at',
            'location',
            'event_category_id',
        ]

    def validate_org_unit(self, value: OrgUnit) -> OrgUnit:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Oturum gerekli.')
        if request.user.is_staff:
            return value
        if not OrgMembership.objects.filter(user=request.user, org_unit=value).exists():
            raise serializers.ValidationError(
                'Bu organizasyon birimi iÃ§in Ã¼yelik / yetki tanÄ±mlÄ± deÄŸil.'
            )
        return value


class OrgUnitSelectSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()
    branchLabel = serializers.SerializerMethodField()
    geographicLevel = serializers.CharField(source='geographic_node.level', read_only=True)

    class Meta:
        model = OrgUnit
        fields = [
            'id',
            'label',
            'branch',
            'branchLabel',
            'geographicLevel',
            'ilce_code',
        ]

    def get_id(self, obj: OrgUnit) -> str:
        return str(obj.pk)

    def get_label(self, obj: OrgUnit) -> str:
        return obj.label_path()

    def get_branchLabel(self, obj: OrgUnit) -> str:
        return obj.get_branch_display()


class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    timeLabel = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'title', 'body', 'timeLabel', 'unread']
        read_only_fields = fields

    def get_id(self, obj: Notification) -> str:
        return str(obj.pk)

    def get_timeLabel(self, obj: Notification) -> str:
        with translation.override('tr'):
            return timesince(obj.created_at)

    def get_unread(self, obj: Notification) -> bool:
        return not obj.read


class PostLikeToggleSerializer(serializers.Serializer):
    liked = serializers.BooleanField(read_only=True)
    likes = serializers.IntegerField(read_only=True)


def apply_like_toggle(post: Post, user, liked: bool) -> tuple[bool, int]:
    from django.db.models import F

    if liked:
        _, created = PostLike.objects.get_or_create(post=post, user=user)
        if created:
            Post.objects.filter(pk=post.pk).update(like_count=F('like_count') + 1)
    else:
        deleted, _ = PostLike.objects.filter(post=post, user=user).delete()
        if deleted:
            post.refresh_from_db(fields=['like_count'])
            Post.objects.filter(pk=post.pk).update(
                like_count=max(0, post.like_count - 1)
            )
    post.refresh_from_db(fields=['like_count'])
    is_liked = PostLike.objects.filter(post=post, user=user).exists()
    return is_liked, post.like_count

