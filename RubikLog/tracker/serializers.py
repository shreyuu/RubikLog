from rest_framework import serializers
from .models import Solve

class SolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solve
        fields = ['id', 'time_taken', 'scramble', 'created_at']