from rest_framework import serializers
from .models import Solve

class SolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solve
        fields = ['id', 'time_taken', 'scramble', 'created_at']
        
    def validate_time_taken(self, value):
        if value <= 0:
            raise serializers.ValidationError("Time taken must be positive")
        if value > 3600:  
            raise serializers.ValidationError("Time taken cannot exceed 1 hour")
        return value