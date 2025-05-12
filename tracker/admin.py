from django.contrib import admin
from .models import Solve

class SolveAdmin(admin.ModelAdmin):
    list_display = ('time_taken', 'created_at', 'scramble')
    list_filter = ('created_at',)

admin.site.register(Solve, SolveAdmin)  