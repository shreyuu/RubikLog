from django.urls import path
from .views import SolveList, SolveDetail, CubeScanView, SolveStats

urlpatterns = [
    path("solves/", SolveList.as_view(), name="solve-list"),
    path("solves/<int:pk>/", SolveDetail.as_view(), name="solve-detail"),
    path("solves/stats/", SolveStats.as_view(), name="solve-stats"),
    path("scan-cube/", CubeScanView.as_view(), name="scan-cube"),
]
