from django.shortcuts import render, get_object_or_404
from django.db.models import Min, Avg, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Solve
from .serializers import SolveSerializer


class SolvePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


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
        # Add filtering and sorting options
        filters = {}
        if 'min_time' in request.query_params:
            filters['time_taken__gte'] = float(request.query_params['min_time'])
        if 'max_time' in request.query_params:
            filters['time_taken__lte'] = float(request.query_params['max_time'])
            
        sort_by = request.query_params.get('sort_by', '-created_at')
        solves = Solve.objects.filter(**filters).order_by(sort_by)
        
        # Add proper pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(solves, request)
        serializer = SolveSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        print("Received data:", request.data)  # Debug log
        serializer = SolveSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("Validation errors:", serializer.errors)  # Debug log
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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