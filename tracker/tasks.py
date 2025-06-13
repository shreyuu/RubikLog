import logging
import base64
from .ml_service import CubeScanner

logger = logging.getLogger(__name__)

def process_cube_image_async(image_data):
    """
    Process cube image asynchronously
    """
    try:
        # Convert image data to processable format
        if hasattr(image_data, 'read'):
            # Handle file object
            image_bytes = image_data.read()
        elif isinstance(image_data, str) and ',' in image_data:
            # Handle base64 string
            image_bytes = base64.b64decode(image_data.split(',')[1])
        else:
            # Handle raw bytes
            image_bytes = image_data
            
        # Process the image
        scanner = CubeScanner()
        result = scanner.process_frame(image_bytes)
        
        return result
    except Exception as e:
        logger.error(f"Error processing cube image: {str(e)}")
        return {"error": str(e)}