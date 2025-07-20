import os

os.environ["TESTING"] = "True"

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from django.core.exceptions import ValidationError
from .models import Solve, CubeType


class SolveModelTests(TestCase):
    def setUp(self):
        os.environ["SKIP_SCRAMBLE_VALIDATION"] = "False"

    def test_solve_str_representation(self):
        solve = Solve.objects.create(time_taken=10.5, scramble="R U R' U'")
        self.assertIn("10.5s", str(solve))

    def test_formatted_time_property(self):
        # Test seconds
        solve = Solve.objects.create(time_taken=45.67, scramble="R U R' U'")
        self.assertEqual(solve.formatted_time, "45.67s")

        # Test minutes
        solve.time_taken = 125.34  # 2:05.34
        self.assertEqual(solve.formatted_time, "2:05.34")

        # Test hours
        solve.time_taken = 3665.12  # 1:01:05.12
        self.assertEqual(solve.formatted_time, "1:01:05.12")

    def test_solve_validation_positive_time(self):
        with self.assertRaises(ValidationError):
            solve = Solve(time_taken=-1.0, scramble="R U R' U'")
            solve.full_clean()

    def test_solve_validation_max_time(self):
        with self.assertRaises(ValidationError):
            solve = Solve(time_taken=3601.0, scramble="R U R' U'")  # Over 1 hour
            solve.full_clean()

    def test_solve_validation_invalid_scramble(self):
        with self.assertRaises(ValidationError):
            solve = Solve(time_taken=10.0, scramble="INVALID MOVES")
            solve.full_clean()

    def test_solve_validation_valid_scramble(self):
        # Should not raise any exception
        solve = Solve(time_taken=10.0, scramble="R U R' U' R' F R2 U' R' U'")
        solve.full_clean()
        solve.save()
        self.assertEqual(solve.scramble, "R U R' U' R' F R2 U' R' U'")

    def test_note_max_length(self):
        long_note = "x" * 501  # Exceeds 500 character limit

        # Test using serializer validation (more realistic)
        from tracker.serializers import SolveSerializer

        data = {"time_taken": 10.0, "note": long_note, "scramble": "R U R' U'"}
        serializer = SolveSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("note", serializer.errors)


class SolveTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create a default cube type for tests
        self.cube_type = CubeType.objects.create(name="3x3")
        # Use the primary key for API requests
        self.solve_data = {
            "time_taken": 10.5,
            "scramble": "R U R' U'",
            "cube_type": self.cube_type.pk,
        }
        # But store the actual instance for model-level operations
        self.solve_model_data = {
            "time_taken": 10.5,
            "scramble": "R U R' U'",
            "cube_type": self.cube_type,
        }
        self.url = reverse("api:solve-list")
        # Enable scramble validation skipping by default for most tests
        os.environ["SKIP_SCRAMBLE_VALIDATION"] = "True"

    def test_create_solve_with_note(self):
        data = {**self.solve_data, "note": "Good solve with cross"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["note"], "Good solve with cross")

    def test_solve_ordering(self):
        # Create solves with different timestamps
        solve1 = Solve.objects.create(time_taken=10.0, scramble="R U R' U'")
        solve2 = Solve.objects.create(time_taken=15.0, scramble="L U L' U'")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should be ordered by most recent first
        results = response.json()["results"]
        self.assertEqual(results[0]["id"], solve2.pk)
        self.assertEqual(results[1]["id"], solve1.pk)

    def test_create_solve(self):
        response = self.client.post(self.url, self.solve_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Solve.objects.count(), 1)
        self.assertEqual(Solve.objects.get().time_taken, 10.5)

    def test_delete_solve(self):
        solve = Solve.objects.create(**self.solve_model_data)
        url = reverse("api:solve-detail", kwargs={"pk": solve.pk})
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
        Solve.objects.create(**self.solve_model_data)
        Solve.objects.create(
            time_taken=15.2, scramble="L D L' D'", cube_type=self.cube_type
        )

        # Fetch all solves
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["results"]), 2)

    def test_get_single_solve(self):
        solve = Solve.objects.create(**self.solve_model_data)
        url = reverse("api:solve-detail", kwargs={"pk": solve.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["time_taken"], solve.time_taken)

    def test_filter_solves(self):
        Solve.objects.create(time_taken=5.0, scramble="R U R'")
        Solve.objects.create(time_taken=15.0, scramble="L D L'")

        response = self.client.get(f"{self.url}?min_time=10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["results"]), 1)


class CubeScannerTests(TestCase):
    def test_scanner_initialization(self):
        from tracker.ml_service import CubeScanner

        scanner = CubeScanner()
        self.assertIsNotNone(scanner.color_ranges)
        self.assertEqual(len(scanner.color_ranges), 6)  # 6 cube colors

    def test_process_invalid_image(self):
        from tracker.ml_service import CubeScanner

        scanner = CubeScanner()

        # Test with invalid image data
        result = scanner.process_frame(b"invalid_image_data")
        self.assertIsNone(result)


class HealthCheckTests(TestCase):
    def test_health_check_endpoint(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("checks", data)

    def test_readiness_check_endpoint(self):
        response = self.client.get("/api/v1/ready/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ready")

    def test_liveness_check_endpoint(self):
        response = self.client.get("/api/v1/alive/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "alive")


class PaginationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api:solve-list")
        # Enable scramble validation skipping for pagination tests
        os.environ["SKIP_SCRAMBLE_VALIDATION"] = "True"

        # Create multiple solves for pagination testing with valid scrambles
        valid_scrambles = [
            "R U R' U'",
            "L D L' D'",
            "F R F' R'",
            "B L B' L'",
            "U R U' R'",
            "D L D' L'",
            "R F R' F'",
            "L B L' B'",
            "U F U' F'",
            "D B D' B'",
        ]

        for i in range(25):
            scramble = valid_scrambles[i % len(valid_scrambles)]
            # Add some variation for additional scrambles
            if i >= len(valid_scrambles):
                # Add valid moves to create variation
                scramble += " R2 U2"

            Solve.objects.create(time_taken=10.0 + i, scramble=scramble)

    def test_pagination_first_page(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn("results", data)
        self.assertIn("count", data)
        self.assertIn("next", data)
        self.assertIn("previous", data)

        # Should have items based on page size in settings
        self.assertEqual(data["count"], 25)

    def test_pagination_second_page(self):
        response = self.client.get(f"{self.url}?page=2")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIsNotNone(data["previous"])

    def test_pagination_last_page(self):
        # SolvePagination uses page_size = 10, so with 25 items we have 3 pages
        # Page 1: items 1-10, Page 2: items 11-20, Page 3: items 21-25
        response = self.client.get(f"{self.url}?page=3")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Last page should have 5 items (25 total, pages 1-2 have 10 each, page 3 has 5)
        self.assertEqual(len(data["results"]), 5)
        self.assertIsNone(data["next"])
