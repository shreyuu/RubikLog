import unittest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from tracker.ml_service import CubeSolvePredictor, CubeScanner
from tracker.models import Solve
from django.test import TestCase
from django.utils import timezone
import os


class CubeSolvePredictorTests(TestCase):
    def setUp(self):
        self.predictor = CubeSolvePredictor()

    def test_preprocess_data(self):
        # Create test solves with valid scrambles
        solves = []
        for i in range(5):
            solve = Solve.objects.create(
                time_taken=10.0 + i, scramble="R U R' U'", created_at=timezone.now()
            )
            solves.append(solve)

        features = self.predictor.preprocess_data(solves)
        self.assertEqual(features.shape[0], 5)
        self.assertEqual(features.shape[1], 5)  # 5 features per solve

    def test_predict_insufficient_data(self):
        # Test with fewer than 5 solves
        solves = []
        for i in range(3):
            solve = Solve.objects.create(time_taken=10.0, scramble="R U R' U'")
            solves.append(solve)

        result = self.predictor.predict_next_solve(solves)
        self.assertIsNone(result)

    def test_predict_with_sufficient_data(self):
        # Create test solves
        solves = []
        for i in range(5):
            solve = Solve.objects.create(
                time_taken=10.0 + i, scramble="R U R' U'", created_at=timezone.now()
            )
            solves.append(solve)

        # Mock the model and scaler directly on the instance
        self.predictor.model = MagicMock()
        self.predictor.scaler = MagicMock()

        # Set up mock returns
        self.predictor.scaler.transform.return_value = np.random.rand(1, 5)
        self.predictor.model.predict.return_value = np.array([[12.5]])

        result = self.predictor.predict_next_solve(solves)
        self.assertEqual(result, 12.5)


class CubeScannerAdvancedTests(TestCase):
    def setUp(self):
        self.scanner = CubeScanner()

    def test_color_ranges_initialization(self):
        expected_colors = ["white", "yellow", "red", "orange", "blue", "green"]
        for color in expected_colors:
            self.assertIn(color, self.scanner.color_ranges)

    def test_validate_colors_invalid_count(self):
        # Test with wrong number of colors
        colors = ["red"] * 8  # Should be 9
        is_valid = self.scanner._validate_colors(colors)
        self.assertFalse(is_valid)

    def test_validate_colors_unknown_color(self):
        colors = ["red"] * 8 + ["unknown"]
        is_valid = self.scanner._validate_colors(colors)
        self.assertFalse(is_valid)

    def test_validate_colors_valid_face(self):
        # A valid face should have one dominant color
        colors = ["red"] * 9  # All red face
        is_valid = self.scanner._validate_colors(colors)
        self.assertTrue(is_valid)

    def test_get_dominant_color_empty_section(self):
        color, confidence = self.scanner._get_dominant_color_with_confidence(None)
        self.assertEqual(color, "unknown")
        self.assertEqual(confidence, 0.0)

    @patch("cv2.imdecode")
    def test_process_frame_invalid_image(self, mock_imdecode):
        mock_imdecode.return_value = None

        result = self.scanner.process_frame(b"invalid_data")
        self.assertIsNone(result)

    def test_frame_skip_functionality(self):
        # Test frame skipping logic
        self.assertEqual(self.scanner.frame_skip, 2)
        self.assertEqual(self.scanner.frame_count, 0)
