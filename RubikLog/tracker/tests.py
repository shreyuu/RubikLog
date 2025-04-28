from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Solve
from django.urls import reverse
import json

class SolveAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.solve_data = {
            'time_taken': 10.5,
            'scramble': "R U R' U'"
        }
        
    def test_pagination(self):
        # Create 15 solves
        for i in range(15):
            Solve.objects.create(time_taken=i+1)
            
        response = self.client.get(reverse('solve-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(len(data['results']), 10)  # Default page size
        self.assertTrue(data['next'])  # Should have next page
