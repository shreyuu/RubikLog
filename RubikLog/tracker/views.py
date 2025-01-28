from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Solve
from .serializers import SolveSerializer


# Create your views here.
class SolveList(APIView):
    def get(self, request):
        solves = Solve.objects.all()
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