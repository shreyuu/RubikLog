from rest_framework import serializers
from .models import solve

class SolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = solve
        fields = '__all__'