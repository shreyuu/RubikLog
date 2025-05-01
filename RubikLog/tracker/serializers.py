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

    def validate_scramble(self, value):
        valid_moves = set(["R", "L", "U", "D", "F", "B", "R'", "L'", "U'", "D'", "F'", "B'", "R2", "L2", "U2", "D2", "F2", "B2"])
        if value:
            moves = value.split()
            if not all(move in valid_moves for move in moves):
                raise serializers.ValidationError("Invalid scramble notation")
        return value