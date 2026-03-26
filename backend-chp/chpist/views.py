from django.contrib.auth import authenticate, get_user_model
from django.db.models import BooleanField, Case, Exists, OuterRef, Value, When
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import (
    BranchKind,
    Commission,
    Notification,
    OrgMembership,
    OrgUnit,
    PlannedEvent,
    PlannedEventStatus,
    Post,
    PostLike,
)
from .visibility import (
    apply_feed_list_filters,
    feed_explore_scope_q_for_user,
    org_unit_scope_q_for_user,
    planned_events_scope_q_for_user,
    primary_org_unit_for_user,
)
from .planned_queryset import planned_events_list_queryset
from .serializers import (
    NotificationSerializer,
    OrgUnitSelectSerializer,
    PlannedEventCreateSerializer,
    PlannedEventSerializer,
    PlannedEventUpdateSerializer,
    PostDetailSerializer,
    PostListSerializer,
    PostUpdateSerializer,
    apply_like_toggle,
)


class PlannedListPagination(PageNumberPagination):
    """Rapor ve listeler: client page_size=100 geçerli olsun; üst sınır 500."""

    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 500


class FeedListView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Post.objects.select_related('org_unit').prefetch_related('images').all()
        scope = feed_explore_scope_q_for_user(user)
        if scope is not None:
            qs = qs.filter(scope)
        qs = apply_feed_list_filters(qs, user, self.request)
        qs = qs.annotate(
            user_liked=Exists(
                PostLike.objects.filter(post_id=OuterRef('pk'), user_id=user.id)
            )
        )
        return qs


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostDetailSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = Post.objects.select_related('org_unit').prefetch_related('images')
        scope = feed_explore_scope_q_for_user(user)
        if scope is not None:
            qs = qs.filter(scope)
        qs = qs.annotate(
            user_liked=Exists(
                PostLike.objects.filter(post_id=OuterRef('pk'), user_id=user.id)
            )
        )
        return qs

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return PostUpdateSerializer
        return PostDetailSerializer

    def partial_update(self, request: Request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Giriş gerekli.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        post = self.get_object()
        if post.author_id != request.user.id:
            return Response(
                {'detail': 'Bu gönderiyi sadece sahibi düzenleyebilir.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        post.refresh_from_db()
        return Response(
            PostDetailSerializer(post, context={'request': request}).data
        )

    def destroy(self, request: Request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Giriş gerekli.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        post = self.get_object()
        if post.author_id != request.user.id:
            return Response(
                {'detail': 'Bu gönderiyi sadece sahibi silebilir.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class PlannedDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlannedEventSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = PlannedEvent.objects.select_related('org_unit')
        scope = planned_events_scope_q_for_user(self.request.user)
        if scope is not None:
            qs = qs.filter(scope)
        user = self.request.user
        if user.is_authenticated:
            qs = qs.annotate(
                user_is_mine=Case(
                    When(created_by_id=user.id, then=True),
                    default=False,
                    output_field=BooleanField(),
                )
            )
        return qs

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return PlannedEventUpdateSerializer
        return PlannedEventSerializer

    def partial_update(self, request: Request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Giriş gerekli.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        ev = self.get_object()
        if ev.created_by_id != request.user.id:
            return Response(
                {'detail': 'Bu planı sadece oluşturan düzenleyebilir.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(ev, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        ev.refresh_from_db()
        return Response(
            PlannedEventSerializer(ev, context={'request': request}).data
        )

    def destroy(self, request: Request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Giriş gerekli.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        ev = self.get_object()
        if ev.created_by_id != request.user.id:
            return Response(
                {'detail': 'Bu planı sadece oluşturan silebilir.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class PlannedListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PlannedListPagination

    def get_queryset(self):
        if self.request.method != 'GET':
            return PlannedEvent.objects.none()
        return planned_events_list_queryset(self.request)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PlannedEventCreateSerializer
        return PlannedEventSerializer

    def create(self, request, *args, **kwargs):
        ser = PlannedEventCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        instance = ser.save(created_by=request.user)
        out = PlannedEventSerializer(instance, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_unread_count(request: Request):
    n = Notification.objects.filter(user=request.user, read=False).count()
    return Response({'count': n})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request: Request, pk: int):
    notif = get_object_or_404(Notification, pk=pk, user=request.user)
    if not notif.read:
        notif.read = True
        notif.save(update_fields=['read'])
    return Response(
        NotificationSerializer(notif, context={'request': request}).data
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notifications_mark_all_read(request: Request):
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request: Request):
    raw_id = request.data.get('username')
    password = request.data.get('password')
    if raw_id is None or password is None:
        return Response(
            {'detail': 'username ve password gerekli.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    identifier = str(raw_id).strip()
    password = str(password)
    if not identifier or not password:
        return Response(
            {'detail': 'Kullanıcı adı ve şifre boş olamaz.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=identifier, password=password)
    if not user and '@' in identifier:
        User = get_user_model()
        u = User.objects.filter(email__iexact=identifier).first()
        if u is not None:
            user = authenticate(request, username=u.username, password=password)

    if not user:
        return Response(
            {'detail': 'Geçersiz kullanıcı adı veya şifre.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def post_like(request: Request, pk: int):
    post_qs = Post.objects.filter(pk=pk)
    scope = feed_explore_scope_q_for_user(request.user)
    if scope is not None:
        post_qs = post_qs.filter(scope)
    post = get_object_or_404(post_qs)
    liked = bool(request.data.get('liked', True))
    is_liked, likes = apply_like_toggle(post, request.user, liked)
    return Response({'liked': is_liked, 'likes': likes})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def planned_complete(request: Request, pk: int):
    """Planlanan etkinliği tamamlar: görselleri kaydeder, akış gönderisi oluşturur."""

    ev = get_object_or_404(PlannedEvent.objects.filter(pk=pk))
    if ev.created_by_id != request.user.id and not (
        request.user.is_staff or request.user.is_superuser
    ):
        return Response(
            {'detail': 'Bu planı yalnızca oluşturan tamamlayabilir.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    if ev.status != PlannedEventStatus.PLANNED:
        return Response(
            {'detail': 'Bu etkinlik zaten tamamlanmış veya işlenemez durumda.'},
            status=status.HTTP_409_CONFLICT,
        )
    caption = request.data.get('caption', '')
    event_category_id = ev.event_category_id or 'diger'

    files = request.FILES.getlist('images')
    if not files:
        return Response(
            {'detail': 'En az bir görsel gerekli.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    post = Post.objects.create(
        author=request.user,
        author_label=request.user.get_full_name() or request.user.username,
        org_unit=ev.org_unit,
        event_title=ev.title,
        event_description=ev.description,
        caption=caption,
        event_category_id=event_category_id,
    )
    for i, f in enumerate(files):
        post.images.create(image=f, sort_order=i)

    ev.status = PlannedEventStatus.COMPLETED
    ev.save(update_fields=['status'])

    ser = PostDetailSerializer(post, context={'request': request})
    return Response(ser.data, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    """Oturumdaki kullanıcı (token ile)."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request):
        u = request.user
        full = (u.get_full_name() or '').strip()
        display_name = full if full else u.username
        memberships = []
        for m in OrgMembership.objects.filter(user=u).select_related(
            'org_unit__geographic_node',
            'org_unit__commission',
        ):
            memberships.append(
                {
                    'orgUnitId': str(m.org_unit_id),
                    'label': m.org_unit.label_path(),
                    'role': m.role,
                    'roleLabel': m.get_role_display(),
                    'title': m.title,
                    'isPrimary': m.is_primary,
                }
            )
        primary = primary_org_unit_for_user(u)
        return Response(
            {
                'username': u.username,
                'email': u.email or '',
                'firstName': u.first_name or '',
                'lastName': u.last_name or '',
                'displayName': display_name,
                'isStaff': bool(u.is_staff),
                'memberships': memberships,
                'primaryBranch': primary.branch if primary else None,
                'primaryCommissionId': primary.commission_id if primary else None,
            }
        )


class OrgContextView(APIView):
    """Üst çubuk: oturum varsa birincil üyelik birimi, yoksa varsayılan metin."""

    permission_classes = [AllowAny]
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def get(self, request: Request):
        if request.user.is_authenticated:
            m = (
                OrgMembership.objects.filter(user=request.user, is_primary=True)
                .select_related('org_unit__geographic_node', 'org_unit__commission')
                .first()
            )
            if not m:
                m = (
                    OrgMembership.objects.filter(user=request.user)
                    .select_related('org_unit__geographic_node', 'org_unit__commission')
                    .first()
                )
            if m:
                return Response({'label': m.org_unit.label_path()})
        return Response({'label': 'Ana Kademe › İstanbul İl Başkanlığı'})


class BranchChoicesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            [{'id': v, 'label': str(l)} for v, l in BranchKind.choices]
        )


class CommissionListView(APIView):
    """Filtre chip'leri için aktif komisyonlar."""

    permission_classes = [AllowAny]

    def get(self, request: Request):
        rows = Commission.objects.filter(active=True).order_by('name')
        return Response(
            [{'id': c.pk, 'name': c.name, 'slug': c.slug} for c in rows]
        )


# Planlama formu — mobil ile aynı kimlikler (Post/PlannedEvent.event_category_id)
EVENT_CATEGORIES = [
    {'id': 'mahalle_saha', 'label': 'Mahalle / saha çalışması'},
    {'id': 'toplanti', 'label': 'Toplantı / örgüt'},
    {'id': 'miting', 'label': 'Miting / açık alan etkinliği'},
    {'id': 'egitim', 'label': 'Eğitim / seminer'},
    {'id': 'kampanya', 'label': 'Kampanya / tanıtım'},
    {'id': 'ziyaret', 'label': 'Ziyaret'},
    {'id': 'diger', 'label': 'Diğer'},
]


class EventCategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request):
        return Response(EVENT_CATEGORIES)


class OrgUnitListView(generics.ListAPIView):
    """Planlama / seçim için org birimleri (hiyerarşi + kol)."""

    serializer_class = OrgUnitSelectSerializer
    permission_classes = [AllowAny]
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    pagination_class = None

    def get_queryset(self):
        qs = OrgUnit.objects.select_related('geographic_node', 'commission').order_by(
            'ilce_code', 'branch', 'id'
        )
        if self.request.query_params.get('scope') == 'mine':
            u = self.request.user
            if not u.is_authenticated:
                return OrgUnit.objects.none()
            if u.is_staff:
                return qs
            ids = OrgMembership.objects.filter(user=u).values_list('org_unit_id', flat=True)
            return qs.filter(pk__in=list(ids))
        return qs
