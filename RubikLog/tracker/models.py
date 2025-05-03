from django.db import models
from django.core.exceptions import ValidationError

# Create your models here.
class Solve(models.Model):
    time_taken = models.FloatField()
    scramble = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.time_taken}s - {self.created_at.strftime('%d %b %Y %H:%M:%S')}"
    
    def clean(self):
        if self.time_taken <= 0:
            raise ValidationError('Time taken must be positive')
        if self.time_taken > 3600:
            raise ValidationError('Time taken cannot exceed 1 hour')
        
        if self.scramble:
            valid_moves = {"R", "L", "U", "D", "F", "B", 
                         "R'", "L'", "U'", "D'", "F'", "B'",
                         "R2", "L2", "U2", "D2", "F2", "B2"}
            moves = self.scramble.split()
            if not all(move in valid_moves for move in moves):
                raise ValidationError('Invalid scramble notation')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)