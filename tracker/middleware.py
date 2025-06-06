from django.http import JsonResponse
from django.core.exceptions import ValidationError, ObjectDoesNotExist

class ErrorHandlingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        if isinstance(exception, ValidationError):
            return JsonResponse({
                'error': 'Validation Error',
                'details': str(exception)
            }, status=400)
        elif isinstance(exception, ObjectDoesNotExist):
            return JsonResponse({
                'error': 'Not Found',
                'details': str(exception)
            }, status=404)
        return JsonResponse({
            'error': 'Internal Server Error',
            'details': str(exception)
        }, status=500)