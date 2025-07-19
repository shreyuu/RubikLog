from django.http import JsonResponse
from django.core.exceptions import ValidationError, ObjectDoesNotExist
import logging
import traceback
from django.conf import settings

class ErrorHandlingMiddleware:
    """
    Middleware to catch unhandled exceptions and return a consistent JSON error response.
    In DEBUG mode, includes traceback for 500 errors. Logs all unhandled exceptions.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)

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
        # Log all unhandled exceptions
        self.logger.error('Unhandled exception', exc_info=exception)
        error_response = {
            'error': 'Internal Server Error',
            'details': str(exception) if settings.DEBUG else 'An unexpected error occurred.'
        }
        if settings.DEBUG:
            error_response['exception_type'] = type(exception).__name__
            error_response['traceback'] = traceback.format_exc()
        return JsonResponse(error_response, status=500)