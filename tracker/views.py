from django.shortcuts import render, get_object_or_404
from django.db.models import Min, Avg, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.http import JsonResponse
from rest_framework.decorators import api_view
from .models import Solve
from .serializers import SolveSerializer
from .ml_service import CubeScanner
from django.core.cache import cache
from django.conf import settings
from django.db import connection
from django.db.models.query import QuerySet
import base64
import numpy as np
import cv2
import time
import logging

logger = logging.getLogger(__name__)

class SolvePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


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


# Create your views here.
class SolveList(APIView):
    pagination_class = SolvePagination

    @swagger_auto_schema(
        operation_description="List all solves with optional filtering",
        manual_parameters=[
            openapi.Parameter('min_time', openapi.IN_QUERY, type=openapi.TYPE_NUMBER),
            openapi.Parameter('max_time', openapi.IN_QUERY, type=openapi.TYPE_NUMBER),
            openapi.Parameter('sort_by', openapi.IN_QUERY, type=openapi.TYPE_STRING),
        ],
        responses={200: SolveSerializer(many=True)}
    )
    def get(self, request):
        start_time = time.time()
        logger.info("Starting SolveList.get request")
        
        try:
            # Generate cache key based on query parameters
            cache_key = f"solves_list_{request.query_params}"
            
            # Try to get from cache first
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.info(f"Cache hit for {cache_key}")
                return Response(cached_response)
                
            # Add filtering and sorting options
            filters = {}
            if 'min_time' in request.query_params:
                filters['time_taken__gte'] = float(request.query_params['min_time'])
            if 'max_time' in request.query_params:
                filters['time_taken__lte'] = float(request.query_params['max_time'])
                
            sort_by = request.query_params.get('sort_by', '-created_at')
            
            # Optimize query by using select_related and prefetch_related for related data fetching
            solves = Solve.objects.filter(**filters).select_related('user').prefetch_related('tags').order_by(sort_by)
            
            # Log the query plan
            with connection.cursor() as cursor:
                cursor.execute(f"EXPLAIN ANALYZE {solves.query}")
                query_plan = cursor.fetchall()
                logger.debug("Query plan:")
                for row in query_plan:
                    logger.debug(row[0])
            
            # Execute query with logging
            solves_list = log_query(solves)
            
            # Add proper pagination
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(solves_list, request)
            serializer = SolveSerializer(page, many=True)
            response_data = paginator.get_paginated_response(serializer.data).data
            
            # Cache the response
            cache.set(cache_key, response_data, settings.CACHE_TTL)
            
            end_time = time.time()
            logger.info(f"Request completed in {end_time - start_time:.2f} seconds")
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in SolveList.get: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch solves. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
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
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SolveDetail(APIView):
    def get_object(self, pk):
        return get_object_or_404(Solve, pk=pk)

    def delete(self, request, pk):
        solve = self.get_object(pk)
        solve.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SolveStats(APIView):
    def get(self, request):
        solves = Solve.objects.all()
        
        stats = {
            'total_solves': solves.count(),
            'best_time': solves.aggregate(Min('time_taken'))['time_taken__min'],
            'average_time': solves.aggregate(Avg('time_taken'))['time_taken__avg'],
            'total_solving_time': solves.aggregate(Sum('time_taken'))['time_taken__sum'],
        }
        
        return Response(stats)


class CubeScanView(APIView):
    def post(self, request):
        try:
            # Get base64 image from request
            image_data = request.data.get('image')
            if not image_data:
                return Response({'error': 'No image data provided'}, 
                              status=status.HTTP_400_BAD_REQUEST)

            # Convert base64 to image
            image_bytes = base64.b64decode(image_data.split(',')[1])
            scanner = CubeScanner()
            result = scanner.process_frame(image_bytes)
            if result is None:
                return Response({'error': 'Failed to process image'}, 
                              status=status.HTTP_400_BAD_REQUEST)
                
            colors = result['colors']
            return Response({
                'colors': colors
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def scan_cube(request):
    try:
        # Get image data from request
        image_data = request.FILES.get('image')
        if not image_data:
            return JsonResponse({'error': 'No image data received'}, status=400)

        # Convert image data to numpy array
        nparr = np.frombuffer(image_data.read(), np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Process image with CubeScanner
        scanner = CubeScanner()
        result = scanner.process_frame(image)
        
        if result is None:
            return JsonResponse({'error': 'Failed to process image'}, status=400)
            
        # Convert numpy array to list for JSON serialization
        result['preview'] = cv2.imencode('.jpg', result['preview'])[1].tobytes().decode('latin1')
        
        return JsonResponse({
            'colors': result['colors'],
            'preview': result['preview'],
            'is_valid': result['is_valid']
        })
        
    except Exception as e:
        print(f"Error in scan_cube: {str(e)}")  # Debug logging
        return JsonResponse({'error': str(e)}, status=500)
