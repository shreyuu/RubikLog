from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Solve

class SolveTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.solve_data = {
            'time_taken': 10.5,
            'scramble': "R U R' U'"
        }
        
    def test_create_solve(self):
        response = self.client.post('/api/solves/', self.solve_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Solve.objects.count(), 1)
        self.assertEqual(Solve.objects.get().time_taken, 10.5)
