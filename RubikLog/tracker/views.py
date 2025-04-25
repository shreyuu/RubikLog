from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.filters import OrderingFilter
from rest_framework.pagination import PageNumberPagination
from .models import Solve
from .serializers import SolveSerializer
from .ml_service import CubeSolvePredictor, CubeScrambleDetector
import base64

class SolvePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class SolveList(APIView):
    pagination_class = SolvePagination
    filter_backends = [OrderingFilter]
    ordering_fields = ['time_taken', 'created_at']
    predictor = CubeSolvePredictor()
    detector = CubeScrambleDetector()
    
    def get(self, request):
        queryset = Solve.objects.all()
        sort_by = request.query_params.get('sort_by', '-created_at')
        queryset = queryset.order_by(sort_by)
        
        # Get ML prediction for next solve
        recent_solves = list(queryset[:10])
        predicted_time = self.predictor.predict_next_solve(recent_solves)
        
        page = self.pagination_class().paginate_queryset(queryset, request)
        serializer = SolveSerializer(page, many=True)
        
        response_data = {
            'results': serializer.data,
            'predicted_next_solve': predicted_time
        }
        return Response(response_data)

    def post(self, request):
        data = request.data.copy()
        
        # Handle image data if provided
        if 'cube_image' in request.data:
            try:
                # Process base64 image data
                cube_image = request.data['cube_image']
                if ',' not in cube_image:
                    return Response(
                        {'error': 'Invalid cube_image format. Expected a base64 string with a comma.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                image_data = base64.b64decode(cube_image.split(',')[1])
                data['detected_colors'] = detected_colors
                
                # Generate scramble from detected colors
                scramble = self._generate_scramble_from_colors(detected_colors)
                if scramble:
                    data['scramble'] = scramble
            except Exception as e:
                return Response(
                    {'error': f'Image processing failed: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        serializer = SolveSerializer(data=data)
        if serializer.is_valid():
            solve = serializer.save()
            
            # Get prediction for next solve
            recent_solves = list(Solve.objects.order_by('-created_at')[:10])
            predicted_time = self.predictor.predict_next_solve(recent_solves)
            
            response_data = {
                'solve': serializer.data,
                'predicted_next_solve': predicted_time
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def _generate_scramble_from_colors(self, colors):
        """Generate cube scramble notation from detected colors"""
        if not colors or len(colors) != 9:
            return None
            
        # Basic scramble generation logic
        # This is a simplified version - you might want to implement more sophisticated logic
        moves = []
        center = colors[4]  # Center piece color
        
        for i, color in enumerate(colors):
            if i != 4 and color != center:  # Skip center piece
                if color == 'white':
                    moves.append('U')
                elif color == 'yellow':
                    moves.append('D')
                elif color == 'red':
                    moves.append('R')
                elif color == 'orange':
                    moves.append('L')
                elif color == 'blue':
                    moves.append('F')
                elif color == 'green':
                    moves.append('B')
                    
        return ' '.join(moves) if moves else None