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

class CubeScanner:
    def __init__(self):
        self._initialize_color_ranges()
        self.preview_size = (300, 300)
        self.grid_size = 3
        self.sample_size = 20
        self.frame_skip = 2  # Process every nth frame
        self.frame_count = 0
        
    def _initialize_color_ranges(self):
        # Adjusted HSV ranges for better color detection
        self.color_ranges = {
            'white': ([0, 0, 180], [180, 30, 255]),
            'yellow': ([25, 100, 100], [35, 255, 255]), 
            'red': ([0, 150, 150], [10, 255, 255]),
            'orange': ([10, 150, 150], [20, 255, 255]),
            'blue': ([100, 150, 150], [130, 255, 255]),
            'green': ([45, 150, 150], [75, 255, 255])
        }

    def process_frame(self, frame):
        """Process a single frame with validation"""
        try:
            self.frame_count += 1
            if self.frame_count % self.frame_skip != 0:
                return None

            # Resize and process frame
            frame = cv2.resize(frame, self.preview_size)
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            preview = frame.copy()
            
            detected_colors = []
            cell_height = self.preview_size[0] // self.grid_size
            cell_width = self.preview_size[1] // self.grid_size

            # Draw alignment guides
            self._draw_alignment_guides(preview)
            
            # Process grid cells
            for i in range(self.grid_size):
                for j in range(self.grid_size):
                    color, confidence = self._process_cell(hsv, i, j, cell_height, cell_width)
                    detected_colors.append(color)
                    
                    # Draw cell visualization
                    self._draw_cell_visualization(preview, i, j, cell_height, cell_width, 
                                               color, confidence)

            result = {
                'colors': detected_colors,
                'preview': preview,
                'is_valid': self._validate_colors(detected_colors)
            }
            return result

        except Exception as e:
            print(f"Error processing frame: {str(e)}")
            return None

    def _process_cell(self, hsv, i, j, cell_height, cell_width):
        """Process individual cell with confidence score"""
        center_y = (i * cell_height + (i + 1) * cell_height) // 2
        center_x = (j * cell_width + (j + 1) * cell_width) // 2
        
        section = hsv[center_y-self.sample_size:center_y+self.sample_size, 
                     center_x-self.sample_size:center_x+self.sample_size]
        
        return self._get_dominant_color_with_confidence(section)

    def _get_dominant_color_with_confidence(self, section):
        """
        Determine the dominant color in a section with confidence score
        Returns: (color_name, confidence_score)
        """
        if section is None or section.size == 0:
            return ('unknown', 0.0)

        max_confidence = 0.0
        dominant_color = 'unknown'

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

    def _draw_cell_visualization(self, preview, i, j, cell_height, cell_width, color, confidence):
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
        cv2.putText(preview, label, (x1+5, y1+20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        cv2.putText(preview, label, (x1+5, y1+20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

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
            if color == 'unknown':
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