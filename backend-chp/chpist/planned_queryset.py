"""GET /api/planned/ listesi — `PlannedListCreateView` ile aynı queryset (tek kaynak).

Kapsam: `planned_events_scope_q_for_user` (akış ile aynı il/alt coğrafya, tüm kollar).
"""

from __future__ import annotations

from django.db.models import BooleanField, Case, QuerySet, When

from .models import PlannedEvent, PlannedEventStatus
from .visibility import planned_events_scope_q_for_user


def _query_get(request, key: str, default: str | None = None):
    """DRF Request.query_params veya Django GET."""
    qp = getattr(request, 'query_params', None)
    if qp is not None:
        return qp.get(key, default)
    return request.GET.get(key, default)


def planned_events_list_queryset(request) -> QuerySet[PlannedEvent]:
    qs = PlannedEvent.objects.select_related('org_unit')
    scope = planned_events_scope_q_for_user(request.user)
    if scope is not None:
        qs = qs.filter(scope)
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
