import numpy as np
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM
import cv2
import logging
from tensorflow.keras import models

logger = logging.getLogger(__name__)


class CubeSolvePredictor:
    def __init__(self):
        self.model = Sequential(
            [
                LSTM(64, input_shape=(None, 5), return_sequences=True),
                LSTM(32),
                Dense(16, activation="relu"),
                Dense(1),
            ]
        )
        self.model.compile(optimizer="adam", loss="mse")
        self.scaler = StandardScaler()

    def preprocess_data(self, solves):
        """Preprocess solve data for prediction"""
        features = []
        for solve in solves:
            features.append(
                [
                    solve.time_taken,
                    len(solve.scramble) if solve.scramble else 0,
                    solve.created_at.hour,
                    solve.created_at.minute,
                    solve.created_at.weekday(),
                ]
            )
        return np.array(features)

    def predict_next_solve(self, recent_solves):
        """Predict next solve time based on recent solves"""
        if len(recent_solves) < 5:
            return None

        features = self.preprocess_data(recent_solves)
        features = self.scaler.transform(features)
        features = np.array(features).reshape(1, -1, 5)

        prediction = self.model.predict(features)
        return float(prediction[0][0])


class CubeScanner:
    def __init__(self):
        self.model = None
        self.scaler = None
        self._is_initialized = False
        self._initialize_color_ranges()
        self.preview_size = (300, 300)
        self.grid_size = 3
        self.sample_size = 20
        self.frame_skip = 2  # Process every nth frame
        self.frame_count = 0

    def _initialize(self):
        """Lazy initialization of TensorFlow and model"""
        if not self._is_initialized:
            try:
                import tensorflow as tf

                # Configure TensorFlow to use minimal memory
                tf.config.threading.set_inter_op_parallelism_threads(1)
                tf.config.threading.set_intra_op_parallelism_threads(1)
                tf.config.set_logical_device_configuration(
                    tf.config.list_physical_devices("CPU")[0],
                    [tf.config.LogicalDeviceConfiguration(memory_limit=256)],
                )
                # Load model and scaler
                self.model = tf.saved_model.load("path_to_model")
                self.scaler = StandardScaler()
                self._is_initialized = True
                logger.info("TensorFlow initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize TensorFlow: {str(e)}")
                raise

    def _initialize_color_ranges(self):
        # Adjusted HSV ranges for better color detection
        self.color_ranges = {
            "white": ([0, 0, 180], [180, 30, 255]),
            "yellow": ([25, 100, 100], [35, 255, 255]),
            "red": ([0, 150, 150], [10, 255, 255]),
            "orange": ([10, 150, 150], [20, 255, 255]),
            "blue": ([100, 150, 150], [130, 255, 255]),
            "green": ([45, 150, 150], [75, 255, 255]),
        }

    def process_frame(self, image_bytes):
        """Process a frame and return cube colors"""
        try:
            # Convert image bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                logger.error("Failed to decode image")
                return None

            # Process image
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

            # Get image dimensions
            h, w = image.shape[:2]
            cell_height = h // self.grid_size
            cell_width = w // self.grid_size

            # Detect colors in grid
            colors = []
            confidences = []

            for i in range(self.grid_size):
                for j in range(self.grid_size):
                    color, confidence = self._process_cell(
                        hsv, i, j, cell_height, cell_width
                    )
                    colors.append(color)
                    confidences.append(confidence)

            # Validate the detected colors
            is_valid = self._validate_colors(colors)

            return {"colors": colors, "confidences": confidences, "is_valid": is_valid}

        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            return None

    def _process_cell(self, hsv, i, j, cell_height, cell_width):
        """Process individual cell with confidence score"""
        center_y = (i * cell_height + (i + 1) * cell_height) // 2
        center_x = (j * cell_width + (j + 1) * cell_width) // 2

        section = hsv[
            center_y - self.sample_size : center_y + self.sample_size,
            center_x - self.sample_size : center_x + self.sample_size,
        ]

        return self._get_dominant_color_with_confidence(section)

    def _get_dominant_color_with_confidence(self, section):
        """
        Determine the dominant color in a section with confidence score
        Returns: (color_name, confidence_score)
        """
        if section is None or section.size == 0:
            return ("unknown", 0.0)

        max_confidence = 0.0
        dominant_color = "unknown"

        for color_name, (lower, upper) in self.color_ranges.items():
            # Convert bounds to numpy arrays
            lower = np.array(lower)
            upper = np.array(upper)

            # Create mask for this color range
            mask = cv2.inRange(section, lower, upper)

            # Calculate percentage of pixels that match this color
            confidence = np.count_nonzero(mask) / mask.size

            if confidence > max_confidence and confidence > 0.4:  # 40% threshold
                max_confidence = confidence
                dominant_color = color_name

        return (dominant_color, max_confidence)

    def _draw_alignment_guides(self, image):
        """Draw alignment guides for better cube positioning"""
        h, w = image.shape[:2]
        color = (0, 255, 0)  # Green guides

        # Draw center crosshair
        center_x, center_y = w // 2, h // 2
        cv2.line(image, (center_x - 20, center_y), (center_x + 20, center_y), color, 1)
        cv2.line(image, (center_x, center_y - 20), (center_x, center_y + 20), color, 1)

    def _draw_cell_visualization(
        self, preview, i, j, cell_height, cell_width, color, confidence
    ):
        """Draw cell visualization with color and confidence indicator"""
        x1 = j * cell_width
        y1 = i * cell_height
        x2 = (j + 1) * cell_width
        y2 = (i + 1) * cell_height

        # Draw cell border
        border_color = (0, 255, 0) if confidence > 0.6 else (0, 165, 255)
        cv2.rectangle(preview, (x1, y1), (x2, y2), border_color, 2)

        # Draw color label
        label = f"{color[:1].upper()}{int(confidence*100)}%"
        cv2.putText(
            preview,
            label,
            (x1 + 5, y1 + 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 0, 0),
            2,
        )
        cv2.putText(
            preview,
            label,
            (x1 + 5, y1 + 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1,
        )

    def _validate_colors(self, colors):
        """
        Validate detected colors for a cube face
        Returns: bool indicating if the detected colors form a valid cube face
        """
        if len(colors) != 9:
            return False

        # Count occurrences of each color
        color_counts = {}
        for color in colors:
            if color == "unknown":
                return False
            color_counts[color] = color_counts.get(color, 0) + 1

        # Center piece should have at least 4 matching colors
        center_color = colors[4]  # Center piece
        if color_counts.get(center_color, 0) < 4:
            return False

        # Maximum 9 squares of the same color allowed
        for count in color_counts.values():
            if count > 9:
                return False

        return True


import unittest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from tracker.ml_service import CubeSolvePredictor, CubeScanner
from tracker.models import Solve
from django.test import TestCase
from django.utils import timezone


class CubeSolvePredictorTests(TestCase):
    def setUp(self):
        self.predictor = CubeSolvePredictor()

    def test_preprocess_data(self):
        # Create test solves
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
        solves = [
            Solve.objects.create(time_taken=10.0, scramble="R U R' U'")
            for _ in range(3)
        ]

        result = self.predictor.predict_next_solve(solves)
        self.assertIsNone(result)

    def test_predict_with_sufficient_data(self):
        # Create test solves
        solves = [
            Solve.objects.create(
                time_taken=10.0 + i, scramble="R U R' U'", created_at=timezone.now()
            )
            for i in range(5)
        ]

        # Mock the model and scaler directly on the instance
        self.predictor.model = MagicMock()
        self.predictor.scaler = MagicMock()

        # Set up mock returns
        self.predictor.scaler.transform.return_value = np.random.rand(1, 5)
        self.predictor.model.predict.return_value = np.array([[12.5]])

        result = self.predictor.predict_next_solve(solves)
        self.assertEqual(result, 12.5)
