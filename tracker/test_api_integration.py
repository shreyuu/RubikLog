from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from tracker.models import Solve
import json


class APIIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.solve_list_url = reverse("api:solve-list")

    def test_full_crud_workflow(self):
        # Create
        create_data = {
            "time_taken": 12.34,
            "scramble": "R U R' U' R' F R2 U' R' U'",
            "note": "Good solve",
        }

        create_response = self.client.post(
            self.solve_list_url, create_data, format="json"
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        solve_id = json.loads(create_response.content)["id"]

        # Read
        detail_url = reverse("api:solve-detail", kwargs={"pk": solve_id})
        read_response = self.client.get(detail_url)
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        read_data = json.loads(read_response.content)
        self.assertEqual(read_data["time_taken"], 12.34)
        # List
        list_response = self.client.get(self.solve_list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        list_data = json.loads(list_response.content)
        self.assertEqual(len(list_data["results"]), 1)

        # Delete
        delete_response = self.client.delete(detail_url)
        # Verify deletion
        final_list_response = self.client.get(self.solve_list_url)
        final_list_response = self.client.get(self.solve_list_url)
        final_list_data = json.loads(final_list_response.content)
        self.assertEqual(len(final_list_data["results"]), 0)

    def test_filtering_and_sorting(self):
        # Create test data
        test_solves = [
            {"time_taken": 10.0, "scramble": "R U R' U'"},
            {"time_taken": 15.0, "scramble": "L U L' U'"},
            {"time_taken": 8.0, "scramble": "F U F' U'"},
            {"time_taken": 20.0, "scramble": "B U B' U'"},
        ]

        # Test min_time filter
        response = self.client.get(f"{self.solve_list_url}?min_time=12")
        data = json.loads(response.content)
        results = data["results"]
        self.assertTrue(all(solve["time_taken"] >= 12 for solve in results))
        # Test max_time filter
        response = self.client.get(f"{self.solve_list_url}?max_time=12")
        data = json.loads(response.content)
        results = data["results"]
        self.assertTrue(all(solve["time_taken"] <= 12 for solve in results))
        # Test sorting
        response = self.client.get(f"{self.solve_list_url}?sort_by=time_taken")
        data = json.loads(response.content)
        results = data["results"]
        times = [solve["time_taken"] for solve in results]
        self.assertEqual(times, sorted(times))
        # Test sorting
        response = self.client.get(f"{self.solve_list_url}?sort_by=time_taken")
        data = json.loads(response.content)
        results = data["results"]
        # Test sorting
        response = self.client.get(f"{self.solve_list_url}?sort_by=time_taken")
        data = json.loads(response.content)
        results = data["results"]
        times = [solve["time_taken"] for solve in results]
        self.assertEqual(times, sorted(times))
        response = self.client.get(reverse("api:solve-detail", kwargs={"pk": 999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Test validation errors
        invalid_data = {"time_taken": -5.0}
        response = self.client.post(self.solve_list_url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cube_scan_endpoint(self):
        scan_url = reverse("api:scan-cube")

        # Test with missing image data
        response = self.client.post(scan_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test with invalid base64 data
        invalid_data = {"image": "data:image/jpeg;base64,invalid_base64"}
        response = self.client.post(scan_url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
