from django.urls import path
from .views import SolveList, SolveDetail, CubeScanView

urlpatterns = [
    path('solves/', SolveList.as_view(), name='solve-list'),
    path('solves/<int:pk>/', SolveDetail.as_view(), name='solve-detail'),
    path('scan-cube/', CubeScanView.as_view(), name='scan-cube'),
]
