from django.db import models

# Create your models here.
class Solve(models.Model):
    time_taken = models.FloatField()
    date_solved = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'solved on {self.date_solved} in {self.time_taken} seconds'