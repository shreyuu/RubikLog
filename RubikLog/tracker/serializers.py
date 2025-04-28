from rest_framework import serializers
from .models import Solve
import logging

logger = logging.getLogger(__name__)

class SolveSerializer(serializers.ModelSerializer):
    detected_colors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Solve
        fields = ['id', 'time_taken', 'scramble', 'created_at', 'detected_colors']
        
    def validate(self, data):
        try:
            if data['time_taken'] <= 0:
                raise serializers.ValidationError({"time_taken": "Time taken must be positive"})
            if data['time_taken'] > 3600:
                raise serializers.ValidationError({"time_taken": "Time taken cannot exceed 1 hour"})
            return data
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            raise