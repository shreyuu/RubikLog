from django.contrib import admin
from .models import Solve

class SolveAdmin(admin.ModelAdmin):
    list_display = ('time_taken', 'date_solved', 'scramble')
    list_filter = ('date_solved',)