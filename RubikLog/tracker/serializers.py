from rest_framework import serializers
from .models import Solve

class SolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solve
        fields = '__all__'