import numpy as np
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM
import cv2

class CubeSolvePredictor:
    def __init__(self):
        self.model = Sequential([
            LSTM(64, input_shape=(None, 5), return_sequences=True),
            LSTM(32),
            Dense(16, activation='relu'),
            Dense(1)
        ])
        self.model.compile(optimizer='adam', loss='mse')
        self.scaler = StandardScaler()
        
    def preprocess_data(self, solves):
        """Preprocess solve data for prediction"""
        features = []
        for solve in solves:
            features.append([
                solve.time_taken,
                len(solve.scramble) if solve.scramble else 0,
                solve.created_at.hour,
                solve.created_at.minute,
                solve.created_at.weekday()
            ])
        return np.array(features)
    
    def predict_next_solve(self, recent_solves):
        """Predict next solve time based on recent solves"""
        if len(recent_solves) < 5:
            return None
            
        features = self.preprocess_data(recent_solves)
        features = self.scaler.transform(features)
        features = features.reshape(1, -1, 5)
        
        prediction = self.model.predict(features)
        return float(prediction[0][0])

class CubeScrambleDetector:
    def __init__(self):
        self._initialize_color_ranges()
        
    def _initialize_color_ranges(self):
        """Initialize HSV color ranges for cube colors"""
        self.color_ranges = {
            'white': ([0, 0, 200], [180, 30, 255]),
            'yellow': ([20, 100, 100], [30, 255, 255]), 
            'red': ([0, 100, 100], [10, 255, 255]),
            'orange': ([10, 100, 100], [20, 255, 255]),
            'blue': ([100, 100, 100], [130, 255, 255]),
            'green': ([50, 100, 100], [70, 255, 255])
        }

    def detect_colors(self, image_data):
        """Detect cube colors from image data"""
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert BGR to HSV
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Initialize results
        detected_colors = []
        
        # Divide image into 9 sections
        height, width = hsv.shape[:2]
        cell_height = height // 3
        cell_width = width // 3
        
        # Process each section
        for i in range(3):
            for j in range(3):
                y1 = i * cell_height
                y2 = (i + 1) * cell_height
                x1 = j * cell_width
                x2 = (j + 1) * cell_width
                
                section = hsv[y1:y2, x1:x2]
                color = self._get_dominant_color(section)
                detected_colors.append(color)
                
        return detected_colors
    
    def _get_dominant_color(self, section):
        """Get dominant color in a section"""
        max_pixels = 0
        dominant_color = 'unknown'
        
        for color, (lower, upper) in self.color_ranges.items():
            mask = cv2.inRange(section, np.array(lower), np.array(upper))
            pixel_count = cv2.countNonZero(mask)
            
            if pixel_count > max_pixels:
                max_pixels = pixel_count
                dominant_color = color
                
        return dominant_color