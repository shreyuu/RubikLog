from django.urls import path
from .views import SolveList, SolveDetail

urlpatterns = [
    path('solves/', SolveList.as_view(), name='solve-list'),
    path('solves/<int:pk>/', SolveDetail.as_view(), name='solve-detail'),
]
