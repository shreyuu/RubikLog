from django.shortcuts import render, get_object_or_404
from django.db.models import Min, Max, Avg, Sum, Count
from django.db.models.functions import Extract
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
from django.db import connection
from django.db.models.query import QuerySet
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
import base64
import numpy as np
import cv2
import time
import logging
from django.utils.http import urlencode
from .tasks import process_cube_image_async
from statistics import mean, stdev
import math
from django.utils import timezone
from typing import Any
from rest_framework.request import Request

from .models import Solve
from .serializers import SolveSerializer, SolveStatsSerializer
from .ml_service import CubeScanner

logger = logging.getLogger(__name__)


class SolvePagination(PageNumberPagination):
    page_size = 10  # Changed from 50 to 10 to match test expectations
    page_size_query_param = "page_size"
    max_page_size = 200


def log_query(query):
    """Log the SQL query and its execution time"""
    start_time = time.time()
    try:
        result = list(query)
        end_time = time.time()
        logger.debug(f"Query executed in {end_time - start_time:.2f} seconds")
        logger.debug(f"SQL: {query.query}")
        return result
    except Exception as e:
        logger.error(f"Query failed: {str(e)}")
        raise


def get_cache_key(request):
    query_dict = request.query_params.copy()
    sorted_query = urlencode(sorted(query_dict.items()))
    return f"solves_list_{sorted_query}"


# Create your views here.
class SolveList(APIView):
    pagination_class = SolvePagination

    @swagger_auto_schema(
        operation_description="List all solves with optional filtering",
        manual_parameters=[
            openapi.Parameter("min_time", openapi.IN_QUERY, type=openapi.TYPE_NUMBER),
            openapi.Parameter("max_time", openapi.IN_QUERY, type=openapi.TYPE_NUMBER),
            openapi.Parameter("sort_by", openapi.IN_QUERY, type=openapi.TYPE_STRING),
        ],
        responses={200: SolveSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        start_time = time.time()
        logger.info("Starting SolveList.get request")

        try:
            # Generate cache key based on query parameters
            cache_key = get_cache_key(request)

            # Try to get from cache first
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.info(f"Cache hit for {cache_key}")
                return Response(cached_response)

            # Add filtering and sorting options
            filters = {}
            if "min_time" in request.query_params:
                filters["time_taken__gte"] = float(request.query_params["min_time"])
            if "max_time" in request.query_params:
                filters["time_taken__lte"] = float(request.query_params["max_time"])

            sort_by = request.query_params.get("sort_by", "-created_at")

            # Query optimization - removed invalid prefetch_related("tags")
            solves = Solve.objects.filter(**filters).order_by(sort_by)

            # Log the query plan - only for PostgreSQL
            if connection.vendor == "postgresql":
                with connection.cursor() as cursor:
                    cursor.execute(f"EXPLAIN ANALYZE {solves.query}")
                    query_plan = cursor.fetchall()
                    logger.debug("Query plan:")
                    for row in query_plan:
                        logger.debug(row[0])

            # Execute query with logging - but don't convert to list yet
            solves_list = log_query(solves)

            # Simplified pagination implementation
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(solves_list, request)

            serializer = SolveSerializer(page, many=True)
            response = paginator.get_paginated_response(serializer.data)

            # Cache the response
            cache.set(cache_key, response.data, timeout=60)
            return response

        except Exception as e:
            logger.error(f"Error in SolveList.get: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch solves. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request: Request) -> Response:
        logger.info("Starting SolveList.post request")
        try:
            serializer = SolveSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                # Clear the cache when new data is added
                cache.clear()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.warning(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in SolveList.post: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to create solve. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SolveDetail(APIView):
    def get_object(self, pk: int) -> Solve:
        return get_object_or_404(Solve, pk=pk)

    def get(self, request: Request, pk: int) -> Response:
        solve = self.get_object(pk)
        serializer = SolveSerializer(solve)
        return Response(serializer.data)

    def delete(self, request: Request, pk: int) -> Response:
        solve = self.get_object(pk)
        solve.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Cache the whole view for 5 minutes
@method_decorator(cache_page(60 * 5), name="dispatch")
class SolveStats(APIView):
    """Enhanced statistics with additional metrics"""

    # For more granular caching:
    def get(self, request: Request) -> Response:
        cache_key = f"solve_stats_{request.user.id}"
        cached_stats = cache.get(cache_key)

        if cached_stats:
            return Response(cached_stats)

        # Continue with calculation if no cache
        try:
            # Get all solve times in descending order of creation date
            solves = Solve.objects.order_by("-created_at")
            recent_times = list(solves.values_list("time_taken", flat=True))

            # Calculate statistics
            stats_data = {}

            # Basic stats
            stats_data["total_solves"] = len(recent_times)
            stats_data["best_time"] = min(recent_times) if recent_times else None
            stats_data["average_time"] = mean(recent_times) if recent_times else None

            # AO5 and AO12
            stats_data["ao5"] = self._calculate_average_of_n(recent_times, 5)
            stats_data["ao12"] = self._calculate_average_of_n(recent_times, 12)
            stats_data["ao50"] = self._calculate_average_of_n(recent_times, 50)
            stats_data["ao100"] = self._calculate_average_of_n(recent_times, 100)

            # Recent average (last 10 solves)
            stats_data["recent_average"] = (
                mean(recent_times[:10]) if len(recent_times) >= 10 else None
            )

            # Session stats
            last_solve = solves.last()
            stats_data["session_start"] = last_solve.created_at if last_solve else None
            stats_data["solve_count_today"] = solves.filter(
                created_at__date=timezone.now().date()
            ).count()

            # Improvement trend
            stats_data["improvement_trend"] = self._calculate_trend(recent_times)

            # Standard deviation (consistency metric)
            stats_data["std_deviation"] = (
                stdev(recent_times) if len(recent_times) >= 5 else None
            )

            cache.set(cache_key, stats_data, 60 * 5)  # Cache for 5 minutes
            serializer = SolveStatsSerializer(stats_data)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error calculating stats: {str(e)}")
            return Response(
                {"error": "Could not calculate statistics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _calculate_average_of_n(self, times, n):
        """Calculate average of N times, removing best and worst"""
        if len(times) < n:
            return None

        # Take n most recent times and sort them
        times_to_avg = sorted(times[:n])

        # Remove best and worst
        if n >= 3:
            times_to_avg = times_to_avg[1:-1]

        return mean(times_to_avg)

    def _calculate_trend(self, recent_times):
        """Calculate improvement trend based on recent solves"""
        if len(recent_times) < 6:
            return "insufficient_data"

        # Use numpy for faster calculations if you have many solves
        import numpy as np

        recent_array = np.array(recent_times)
        mid = len(recent_array) // 2

        first_half_avg = np.mean(recent_array[:mid])
        second_half_avg = np.mean(recent_array[mid:])

        improvement = (first_half_avg - second_half_avg) / first_half_avg * 100

        # Use constants for magic numbers
        SIGNIFICANT_IMPROVEMENT = 5
        if improvement > SIGNIFICANT_IMPROVEMENT:
            return "improving"
        elif improvement < -SIGNIFICANT_IMPROVEMENT:
            return "declining"
        else:
            return "stable"


class CubeScanView(APIView):
    def post(self, request: Request) -> Response:
        try:
            # Get base64 image from request
            image_data = request.data.get("image") if isinstance(request.data, dict) else None
            if not image_data:
                return Response(
                    {"error": "No image data provided"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Convert base64 to image
            image_bytes = base64.b64decode(image_data.split(",")[1])
            scanner = CubeScanner()
            result = scanner.process_frame(image_bytes)
            if result is None:
                return Response(
                    {"error": "Failed to process image"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            colors = result["colors"]
            return Response({"colors": colors}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
def scan_cube(request):
    # Initial processing
    image_data = request.FILES.get("image")
    if not image_data:
        return JsonResponse({"error": "No image data received"}, status=400)

    # Process asynchronously
    task = process_cube_image_async.delay(image_data)
    return JsonResponse({"task_id": task.id})


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


class SolveStatisticsService:
    def __init__(self, user):
        self.user = user

    def get_base_stats(self):
        """Get basic statistics for a user's solves"""
        from django.db.models import Avg, Min, Max, StdDev, Count
        from tracker.models import Solve

        return Solve.objects.filter(user=self.user).aggregate(
            avg_time=Avg("time"),
            best_time=Min("time"),
            worst_time=Max("time"),
            std_dev=StdDev("time"),
            total_solves=Count("id"),
        )

    def get_rolling_averages(self):
        """Calculate Ao5, Ao12, etc."""
        # Implementation for rolling averages

    def get_time_trends(self, days=30):
        """Get solve time trends over the specified period"""
        from django.db.models import Avg
        from django.utils import timezone
        import datetime

        solves = (
            Solve.objects.filter(
                user=self.user, date__gte=timezone.now() - datetime.timedelta(days=days)
            )
            .values("date__date")
            .annotate(daily_avg=Avg("time"))
            .order_by("date__date")
        )

        return list(solves)


class SolveListView(APIView):
    pagination_class = SolvePagination

    def get(self, request):
        solves = Solve.objects.order_by("-created_at")
        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(solves, request)
        serializer = SolveSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
