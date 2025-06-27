from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


def health_check(request):
    """Basic health check endpoint"""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        # Test cache
        cache.set("health_check", "ok", 30)
        cache_status = cache.get("health_check")

        checks = {"database": "ok", "cache": "ok" if cache_status == "ok" else "error"}

        return JsonResponse({"status": "healthy", "checks": checks})

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({"status": "unhealthy", "error": str(e)}, status=503)


def readiness_check(request):
    """Readiness check endpoint"""
    return JsonResponse({"status": "ready"})


def liveness_check(request):
    """Liveness check endpoint"""
    return JsonResponse({"status": "alive"})
