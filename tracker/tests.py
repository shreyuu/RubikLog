import os

os.environ["TESTING"] = "True"

from django.db import models
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from .models import Solve


class SolveTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.solve_data = {"time_taken": 10.5, "scramble": "R U R' U'"}
        self.url = reverse("solve-list")
        # Enable scramble validation skipping by default for most tests
        os.environ["SKIP_SCRAMBLE_VALIDATION"] = "True"

    def test_create_solve(self):
        response = self.client.post(self.url, self.solve_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Solve.objects.count(), 1)
        self.assertEqual(Solve.objects.get().time_taken, 10.5)

    def test_delete_solve(self):
        solve = Solve.objects.create(**self.solve_data)
        url = reverse("solve-detail", kwargs={"pk": solve.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Solve.objects.count(), 0)

    def test_invalid_time(self):
        invalid_data = {"time_taken": -1.0, "scramble": "R U R' U'"}
        response = self.client.post(self.url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_scramble(self):
        # Disable scramble validation skipping for this specific test
        os.environ["SKIP_SCRAMBLE_VALIDATION"] = "False"
        invalid_data = {"time_taken": 10.5, "scramble": "invalid notation"}
        response = self.client.post(self.url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Reset environment for other tests
        os.environ["SKIP_SCRAMBLE_VALIDATION"] = "True"

    def test_get_solves(self):
        # Create a few solves
        Solve.objects.create(**self.solve_data)
        Solve.objects.create(time_taken=15.2, scramble="L D L' D'")

        # Fetch all solves
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["results"]), 2)

    def test_get_single_solve(self):
        solve = Solve.objects.create(**self.solve_data)
        url = reverse("solve-detail", kwargs={"pk": solve.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["time_taken"], solve.time_taken)

    def test_filter_solves(self):
        Solve.objects.create(time_taken=5.0, scramble="R U R'")
        Solve.objects.create(time_taken=15.0, scramble="L D L'")

        response = self.client.get(f"{self.url}?min_time=10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["results"]), 1)
