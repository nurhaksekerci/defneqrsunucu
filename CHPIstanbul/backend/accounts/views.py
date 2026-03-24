from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from org.models import Hat


def _is_istanbul_il_baskanligi_hat(profile) -> bool:
    """İl yetkilisi + İl Başkanlığı hattı (İstanbul)."""
    if not profile or not profile.hat_id or not profile.is_provincial_official:
        return False
    h = profile.hat
    if h.coordination_line != Hat.CoordinationLine.IL_BASKANLIGI:
        return False
    name = (h.name or "").strip()
    return "İstanbul" in name and "İl Başkanlığı" in name


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "profile", None)
        hat = profile.hat if profile and profile.hat_id else None
        return Response(
            {
                "username": user.get_username(),
                "email": user.email or "",
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "hat_name": hat.name if hat else None,
                "hat_code": hat.code if hat else None,
                "hat_coordination_line": hat.coordination_line if hat else None,
                "district_name": (
                    profile.district.name if profile and profile.district_id else None
                ),
                "is_provincial_official": bool(
                    profile and profile.is_provincial_official,
                ),
                "hat_is_coordination": bool(
                    profile and profile.hat_id and profile.hat.is_coordination_hat,
                ),
                "show_sidebar_districts_by_election_zone": _is_istanbul_il_baskanligi_hat(
                    profile,
                ),
            },
        )
