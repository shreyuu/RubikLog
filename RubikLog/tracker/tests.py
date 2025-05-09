from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Solve
from django.urls import reverse

class SolveTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.solve_data = {
            'time_taken': 10.5,
            'scramble': "R U R' U'"
        }
        self.url = reverse('solve-list')
        
    def test_create_solve(self):
        response = self.client.post(self.url, self.solve_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Solve.objects.count(), 1)
        self.assertEqual(Solve.objects.get().time_taken, 10.5)

    def test_delete_solve(self):
        solve = Solve.objects.create(**self.solve_data)
        response = self.client.delete(f'/api/solves/{solve.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Solve.objects.count(), 0)

    def test_invalid_time(self):
        invalid_data = {'time_taken': -1.0, 'scramble': "R U R' U'"}
        response = self.client.post(self.url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_scramble(self):
        invalid_data = {
            'time_taken': 10.5,
            'scramble': 'invalid notation'
        }
        response = self.client.post(self.url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
