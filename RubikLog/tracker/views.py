from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.filters import OrderingFilter
from rest_framework.pagination import PageNumberPagination
from .models import Solve
from .serializers import SolveSerializer


class SolvePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# Create your views here.
class SolveList(APIView):
    pagination_class = SolvePagination
    filter_backends = [OrderingFilter]
    ordering_fields = ['time_taken', 'created_at']
    
    def get(self, request):
        # Add sorting and pagination
        queryset = Solve.objects.all()
        sort_by = request.query_params.get('sort_by', '-created_at')
        queryset = queryset.order_by(sort_by)
        
        page = self.pagination_class().paginate_queryset(queryset, request)
        serializer = SolveSerializer(page, many=True)
        return self.pagination_class().get_paginated_response(serializer.data)

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