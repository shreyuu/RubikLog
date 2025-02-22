from django.db import models

# Create your models here.
class Solve(models.Model):
    time_taken = models.FloatField()
    scramble = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.time_taken}s - {self.created_at.strftime('%d %b %Y %H:%M:%S')}"