"""Etkinlik listesi kapsamı: il / ilçe / Ana Kademe (koordinasyon) kuralları."""

from __future__ import annotations

from django.db.models import QuerySet

from accounts.il_baskanligi import is_istanbul_il_baskanligi_hat
from org.models import Hat


def apply_event_list_scope(
    qs: QuerySet,
    user,
    *,
    district_query_param,
) -> QuerySet:
    """
    - İl yetkilisi, koordinasyon hattı değilse: yalnızca kendi hattı, tüm ilçeler.
    - İl yetkilisi + koordinasyon hattı (Ana Kademe): tüm hatlar; ?district= ile ilçe süzülür.
    - İlçe kullanıcısı + koordinasyon: kendi ilçesinde tüm hatlar.
    - İlçe kullanıcısı + diğer hatlar: kendi ilçesi ve kendi hattı.
    """
    profile = getattr(user, "profile", None)
    if profile is None or profile.hat_id is None:
        return qs.none()

    hat = profile.hat
    coord = bool(hat and hat.is_coordination_hat)

    if profile.is_provincial_official:
        if not coord:
            qs = qs.filter(hat_id=profile.hat_id)
        raw = district_query_param
        if raw is not None and str(raw).strip().isdigit():
            qs = qs.filter(district_id=int(raw))
    else:
        if not profile.district_id:
            return qs.none()
        qs = qs.filter(district_id=profile.district_id)
        if not coord:
            qs = qs.filter(hat_id=profile.hat_id)

    return qs


def apply_coordination_list_filters(qs: QuerySet, user, query_params) -> QuerySet:
    """
    Koordinasyon hattı kullanıcıları: ?coordination_bucket= & ?hat= ile süzülür.
    İstanbul İl Başkanlığı (sidebar): koordinasyon hattı olmasa da ?hat= / ?coordination_bucket= uygulanır.
    Diğer kullanıcılar için sorgu parametreleri yok sayılır.
    """
    profile = getattr(user, "profile", None)
    if not profile or not profile.hat_id:
        return qs
    if not profile.hat.is_coordination_hat and not is_istanbul_il_baskanligi_hat(
        profile,
    ):
        return qs

    bucket = query_params.get("coordination_bucket")
    if bucket:
        valid = {c[0] for c in Hat.CoordinationBucket.choices}
        if bucket in valid:
            qs = qs.filter(hat__coordination_bucket=bucket)

    hat_raw = query_params.get("hat")
    if hat_raw is not None and str(hat_raw).strip().isdigit():
        qs = qs.filter(hat_id=int(hat_raw))

    return qs


def filter_events_for_list(qs: QuerySet, user, query_params) -> QuerySet:
    qs = apply_event_list_scope(
        qs,
        user,
        district_query_param=query_params.get("district"),
    )
    qs = apply_coordination_list_filters(qs, user, query_params)
    return qs
