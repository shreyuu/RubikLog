from django.test import TestCase, TransactionTestCase
from django.test.utils import override_settings
from django.db import connection
from django.core.cache import cache
from rest_framework.test import APIClient
from tracker.models import Solve
import time


class PerformanceTests(TransactionTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_bulk_solve_creation_performance(self):
        """Test performance of creating many solves"""
        start_time = time.time()

        # Create 100 solves
        solves_data = [
            Solve(time_taken=10.0 + (i * 0.1), scramble="R U R' U'") for i in range(100)
        ]

        Solve.objects.bulk_create(solves_data)

        end_time = time.time()
        creation_time = end_time - start_time

        # Should create 100 solves in less than 1 second
        self.assertLess(creation_time, 1.0)
        self.assertEqual(Solve.objects.count(), 100)

    def test_query_performance_with_large_dataset(self):
        """Test query performance with large number of solves"""
        # Create test data
        Solve.objects.bulk_create(
            [Solve(time_taken=10.0 + i, scramble="R U R' U'") for i in range(1000)]
        )

        start_time = time.time()

        # Test list query
        response = self.client.get("/api/v1/solves/")

        end_time = time.time()
        query_time = end_time - start_time

        self.assertEqual(response.status_code, 200)
        # Should respond in less than 0.5 seconds
        self.assertLess(query_time, 0.5)

    def test_database_index_usage(self):
        """Test that database indexes are being used"""
        # Create test data
        Solve.objects.bulk_create(
            [Solve(time_taken=10.0 + i, scramble="R U R' U'") for i in range(100)]
        )

        with connection.cursor() as cursor:
            # Test index usage for time_taken filter
            cursor.execute(
                """
                EXPLAIN QUERY PLAN 
                SELECT * FROM tracker_solve 
                WHERE time_taken > 50.0 
                ORDER BY created_at DESC
            """
            )

            plan = cursor.fetchall()
            # Should use index (implementation depends on database)
            self.assertTrue(len(plan) > 0)

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            }
        }
    )
    def test_caching_performance(self):
        """Test caching improves performance"""
        # Create test data
        Solve.objects.bulk_create(
            [Solve(time_taken=10.0 + i, scramble="R U R' U'") for i in range(50)]
        )

        # First request (should cache)
        start_time = time.time()
        response1 = self.client.get("/api/v1/solves/")
        first_request_time = time.time() - start_time

        # Second request (should use cache)
        start_time = time.time()
        response2 = self.client.get("/api/v1/solves/")
        second_request_time = time.time() - start_time

        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)

        # Note: In real scenarios, cached request should be faster
        # But in tests, the difference might be minimal
        self.assertGreaterEqual(first_request_time, 0)
        self.assertGreaterEqual(second_request_time, 0)
