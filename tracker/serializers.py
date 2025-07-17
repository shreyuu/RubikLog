from rest_framework import serializers
from .models import Solve, VALID_MOVES
import sys
import os


class SolveSerializer(serializers.ModelSerializer):
    formatted_time = serializers.ReadOnlyField()

    class Meta:
        model = Solve
        fields = [
            "id",
            "time_taken",
            "scramble",
            "created_at",
            "note",
            "formatted_time",
            "cube_type",
            "is_pb",
            "tags",
            "session",
        ]
        read_only_fields = ["created_at", "formatted_time"]

    def validate_time_taken(self, value: float) -> float:
        if value <= 0:
            raise serializers.ValidationError("Time taken must be positive")
        if value > 3600:
            raise serializers.ValidationError("Time taken cannot exceed 1 hour")
        return value

    def validate_scramble(self, value: str) -> str:
        # Skip empty scrambles
        if not value:
            return value

        # Skip validation when explicitly disabled for tests
        skip_validation = os.environ.get("SKIP_SCRAMBLE_VALIDATION", "False") == "True"
        if "test" in sys.argv and skip_validation:
            return value

        moves = value.strip().split()
        invalid_moves = [move for move in moves if move not in VALID_MOVES]
        if invalid_moves:
            raise serializers.ValidationError(
                f"Invalid scramble notation. Invalid moves: {', '.join(invalid_moves)}"
            )
        return value

    def validate_note(self, value: str) -> str:
        if value and len(value) > 500:
            raise serializers.ValidationError("Note cannot exceed 500 characters")
        return value


class SolveStatsSerializer(serializers.Serializer):
    """Serializer for solve statistics"""

    total_solves = serializers.IntegerField()
    best_time = serializers.FloatField()
    worst_time = serializers.FloatField()
    average_time = serializers.FloatField()
    total_solving_time = serializers.FloatField()
    ao5 = serializers.FloatField(allow_null=True)  # Average of 5
    ao12 = serializers.FloatField(allow_null=True)  # Average of 12
    recent_average = serializers.FloatField(allow_null=True)
    improvement_trend = serializers.CharField(max_length=20)
