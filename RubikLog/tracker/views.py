from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Solve
from .serializers import SolveSerializer


# Create your views here.
class SolveList(APIView):
    def get(self, request):
        sort_by = request.query_params.get('sort_by', '-created_at')
        solves = Solve.objects.all().order_by(sort_by)
        serializer = SolveSerializer(solves, many=True)
        return Response(serializer.data)

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