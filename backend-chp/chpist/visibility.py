"""
Org üyeliğine göre içerik görünürlüğü.

- İl veya seçim bölgesi düzeyinde üyelik (ör. Gençlik › İstanbul): Aynı kol için,
  o coğrafi düğümün alt ağacındaki tüm org birimlerinin paylaşımları (tüm ilçe
  gençlik/kadın kolları dahil).
- İlçe veya daha alt düzey üyelik: Aynı ilçe kodu + kol (+ komisyon eşleşmesi).

Komisyon kolu: aynı commission_id. Birden fazla üyelik: OR. is_staff / superuser: kısıt yok.
"""

from __future__ import annotations

from django.db.models import Q
from django.http import HttpRequest

from .models import BranchKind, GeographicLevel, GeographicNode, OrgMembership, OrgUnit


# İl veya seçim bölgesi kökünde: altındaki tüm ilçe/mahalle birimleri görünür.
_IL_WIDE_LEVELS = frozenset(
    {
        GeographicLevel.IL,
        GeographicLevel.SECIM_BOLGESI,
    }
)


def _descendant_geographic_node_ids(root_id: int) -> list[int]:
    """Kök düğüm ve tüm alt coğrafi düğüm pk'ları (BFS, seviye seviye)."""
    ids: list[int] = [root_id]
    frontier = [root_id]
    while frontier:
        children = list(
            GeographicNode.objects.filter(parent_id__in=frontier).values_list(
                'pk', flat=True
            )
        )
        if not children:
            break
        ids.extend(children)
        frontier = children
    return ids


def _scope_q_for_org_unit(ou) -> Q | None:
    """Tek bir OrgUnit için Post/PlannedEvent org_unit zinciri."""
    gn = ou.geographic_node
    if ou.branch == BranchKind.KOMISYON and not ou.commission_id:
        return None

    if gn.level in _IL_WIDE_LEVELS:
        node_ids = _descendant_geographic_node_ids(gn.pk)
        cond = Q(
            org_unit__geographic_node_id__in=node_ids,
            org_unit__branch=ou.branch,
        )
        if ou.branch == BranchKind.KOMISYON:
            cond &= Q(org_unit__commission_id=ou.commission_id)
        return cond

    # İlçe / mahalle vb.: ilçe kodu ile hizala
    cond = Q(
        org_unit__ilce_code=ou.ilce_code,
        org_unit__branch=ou.branch,
    )
    if ou.branch == BranchKind.KOMISYON:
        cond &= Q(org_unit__commission_id=ou.commission_id)
    return cond


def org_unit_scope_q_for_user(user) -> Q | None:
    """
    Post / PlannedEvent queryset'ine uygulanacak org_unit üzerinden filtre.

    Dönüş:
    - None: Filtre uygulanmaz (anonim veya staff).
    - Q: org_unit FK'sına zincirlenen koşul.
    """
    if not user.is_authenticated:
        return None
    if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return None

    memberships = OrgMembership.objects.filter(user=user).select_related(
        'org_unit',
        'org_unit__commission',
        'org_unit__geographic_node',
    )
    parts: list[Q] = []
    for m in memberships:
        sq = _scope_q_for_org_unit(m.org_unit)
        if sq is not None:
            parts.append(sq)

    if not parts:
        return Q(pk__in=[])

    q = parts[0]
    for p in parts[1:]:
        q |= p
    return q


_BRANCH_VALUES = frozenset(c[0] for c in BranchKind.choices)


def _il_root_for_node(gn: GeographicNode) -> GeographicNode | None:
    n: GeographicNode | None = gn
    while n is not None:
        if n.level == GeographicLevel.IL:
            return n
        n = n.parent
    return None


def feed_explore_scope_q_for_user(user) -> Q | None:
    """
    Akış / gönderi detayı / beğeni: il alt ağacı (ilçe üyeliğinde ilce_code kilidi yok).
    Staff: kısıt yok (None).
    Anonim: boş queryset (çağıran 401 vermeli).
    """
    if not user.is_authenticated:
        return Q(pk__in=[])
    if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return None

    memberships = OrgMembership.objects.filter(user=user).select_related(
        'org_unit__geographic_node',
    )
    il_roots: set[int] = set()
    for m in memberships:
        root = _il_root_for_node(m.org_unit.geographic_node)
        if root is not None:
            il_roots.add(root.pk)

    if not il_roots:
        return Q(pk__in=[])

    all_node_ids: set[int] = set()
    for rid in il_roots:
        all_node_ids.update(_descendant_geographic_node_ids(rid))
    return Q(org_unit__geographic_node_id__in=all_node_ids)


def primary_org_unit_for_user(user) -> OrgUnit | None:
    m = (
        OrgMembership.objects.filter(user=user, is_primary=True)
        .select_related('org_unit')
        .first()
    )
    if not m:
        m = OrgMembership.objects.filter(user=user).select_related('org_unit').first()
    return m.org_unit if m else None


def apply_feed_list_filters(qs, user, request: HttpRequest):
    """
    Akış listesi: kol/komisyon (varsayılan birincil üyelik; branch=all hepsi) +
    ilçe ve kategori (çoklu).
    """
    params = request.query_params
    branch_raw = (params.get('branch') or '').strip()

    primary = primary_org_unit_for_user(user)

    if branch_raw.lower() == 'all':
        pass
    elif not branch_raw:
        if primary is not None:
            if primary.branch == BranchKind.KOMISYON and primary.commission_id:
                qs = qs.filter(
                    org_unit__branch=BranchKind.KOMISYON,
                    org_unit__commission_id=primary.commission_id,
                )
            else:
                qs = qs.filter(org_unit__branch=primary.branch)
    else:
        if branch_raw not in _BRANCH_VALUES:
            return qs.none()
        if branch_raw == BranchKind.KOMISYON:
            cid = params.get('commission')
            if cid is not None and str(cid).strip() != '':
                try:
                    qs = qs.filter(
                        org_unit__branch=BranchKind.KOMISYON,
                        org_unit__commission_id=int(cid),
                    )
                except (TypeError, ValueError):
                    return qs.none()
            else:
                qs = qs.filter(org_unit__branch=BranchKind.KOMISYON)
        else:
            qs = qs.filter(org_unit__branch=branch_raw)

    districts = list(params.getlist('district'))
    if not districts:
        ds = (params.get('districts') or '').strip()
        if ds:
            districts = [x.strip() for x in ds.split(',') if x.strip()]
    if districts:
        qs = qs.filter(org_unit__ilce_code__in=districts)

    categories = list(params.getlist('category'))
    if not categories:
        cs = (params.get('categories') or '').strip()
        if cs:
            categories = [x.strip() for x in cs.split(',') if x.strip()]
    if categories:
        qs = qs.filter(event_category_id__in=categories)

    return qs
