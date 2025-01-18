from django.urls import path
from .views import SolveList

urlpatterns = [
    path('solves/', SolveList.as_view(), name='solve-list'),
]
