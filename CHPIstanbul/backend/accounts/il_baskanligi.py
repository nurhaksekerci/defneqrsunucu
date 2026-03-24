"""İstanbul İl Başkanlığı rolü (sidebar, API süzgeçleri)."""

from org.models import Hat


def is_istanbul_il_baskanligi_hat(profile) -> bool:
    """İl yetkilisi + İl Başkanlığı hattı (İstanbul)."""
    if not profile or not profile.hat_id or not profile.is_provincial_official:
        return False
    h = profile.hat
    if h.coordination_line != Hat.CoordinationLine.IL_BASKANLIGI:
        return False
    name = (h.name or "").strip()
    return "İstanbul" in name and "İl Başkanlığı" in name
