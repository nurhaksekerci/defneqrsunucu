"""GET /api/planned/ listesi — `PlannedListCreateView` ile aynı queryset (tek kaynak).

Kapsam: `planned_events_scope_q_for_user` (akış ile aynı il/alt coğrafya, tüm kollar).

Süzgeçler (akış /feed/ ile aynı query parametreleri): ``branch`` (``all`` = tüm kollar),
``commission``, ``district`` / ``districts``, ``category`` / ``categories``.
"""

from __future__ import annotations

from django.db.models import BooleanField, Case, Count, QuerySet, When

from .models import PlannedEvent, PlannedEventStatus
from .visibility import apply_feed_list_filters, planned_events_scope_q_for_user


def planned_events_base_queryset(request) -> QuerySet[PlannedEvent]:
    """Durum filtresi yok; org kapsamı + kol/ilçe/kategori süzgeçleri (liste ve kırılım ile aynı)."""
    qs = PlannedEvent.objects.select_related('org_unit')
    scope = planned_events_scope_q_for_user(request.user)
    if scope is not None:
        qs = qs.filter(scope)
    return apply_feed_list_filters(qs, request.user, request)


def _bucket_event_category_id(raw: str | None, known_ids: set[str]) -> str:
    s = (raw or '').strip()
    if not s:
        return 'diger'
    if s in known_ids:
        return s
    return 'diger'


def planned_category_breakdown(request, category_defs: list[dict]) -> dict[str, list[dict]]:
    """
    Aynı kapsamda tamamlanan / planlanan etkinlik sayıları, kategori bazında.

    Dönüş: ``tamamlanan`` ve ``planlanan`` anahtarları; her biri
    ``eventCategoryId``, ``label``, ``count`` içeren liste.
    """
    base = planned_events_base_queryset(request)
    known_ids = {c['id'] for c in category_defs}

    def counts_for_status(status_val: str) -> dict[str, int]:
        rows = (
            base.filter(status=status_val)
            .values('event_category_id')
            .annotate(c=Count('id'))
        )
        out = {kid: 0 for kid in known_ids}
        for row in rows:
            bid = _bucket_event_category_id(row['event_category_id'], known_ids)
            out[bid] = out.get(bid, 0) + row['c']
        return out

    tc = counts_for_status(PlannedEventStatus.COMPLETED)
    tp = counts_for_status(PlannedEventStatus.PLANNED)

    def rows(counts: dict[str, int]) -> list[dict]:
        return [
            {
                'eventCategoryId': c['id'],
                'label': c['label'],
                'count': counts.get(c['id'], 0),
            }
            for c in category_defs
        ]

    return {'tamamlanan': rows(tc), 'planlanan': rows(tp)}


def _query_get(request, key: str, default: str | None = None):
    """DRF Request.query_params veya Django GET."""
    qp = getattr(request, 'query_params', None)
    if qp is not None:
        return qp.get(key, default)
    return request.GET.get(key, default)


def planned_events_list_queryset(request) -> QuerySet[PlannedEvent]:
    qs = planned_events_base_queryset(request)
    user = request.user
    if user.is_authenticated:
        qs = qs.annotate(
            user_is_mine=Case(
                When(created_by_id=user.id, then=True),
                default=False,
                output_field=BooleanField(),
            )
        )
    st = _query_get(request, 'status', 'planned') or 'planned'
    if st == 'completed':
        return qs.filter(status=PlannedEventStatus.COMPLETED).order_by('-start_at')
    if st == 'all':
        return qs.order_by('-start_at')
    return qs.filter(status=PlannedEventStatus.PLANNED).order_by('start_at')
