from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "profile", None)
        return Response(
            {
                "username": user.get_username(),
                "email": user.email or "",
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "hat_name": profile.hat.name if profile and profile.hat_id else None,
                "district_name": (
                    profile.district.name if profile and profile.district_id else None
                ),
                "is_provincial_official": bool(
                    profile and profile.is_provincial_official,
                ),
                "hat_is_coordination": bool(
                    profile and profile.hat_id and profile.hat.is_coordination_hat,
                ),
            },
        )
