"""Basit operasyon uçları (yük dengeleyici sağlık kontrolü)."""

from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok"})
