"""
Django settings for RubikLog project.
"""

from pathlib import Path
import os
import sys

# Check if we're running tests
TESTING = "test" in sys.argv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Simple environment variable handling function
def get_env_value(env_variable, default=""):
    return os.environ.get(env_variable, default)


# Security settings
SECRET_KEY = get_env_value(
    "DJANGO_SECRET_KEY", "django-insecure-key-for-development-only"
)
DEBUG = get_env_value("DEBUG", "True") == "True"
ALLOWED_HOSTS = get_env_value("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

CORS_ALLOW_ALL_ORIGINS = True

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "tracker",  # RubikLog app
    "corsheaders",  # Enable CORS for frontend-backend communication
    "rest_framework",
    "drf_yasg",
    "django_filters",
    "rest_framework.authtoken",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "tracker.middleware.ErrorHandlingMiddleware",
]

# Allow communication from React frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Or for development, you can use:
CORS_ALLOW_ALL_ORIGINS = True

# Allow larger file uploads
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

ROOT_URLCONF = "RubikLog.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "RubikLog.wsgi.application"

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

# Use SQLite for tests, PostgreSQL for development/production
if TESTING or get_env_value("USE_SQLITE_FOR_TESTING", "False") == "True":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": get_env_value("POSTGRES_DB", "rubiklogdb"),
            "USER": get_env_value("POSTGRES_USER", "postgres"),
            "PASSWORD": get_env_value("POSTGRES_PASSWORD", ""),
            "HOST": get_env_value("POSTGRES_HOST", "localhost"),
            "PORT": get_env_value("POSTGRES_PORT", "5432"),
        }
    }

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Check if frontend build directory exists before adding it to STATICFILES_DIRS
FRONTEND_BUILD_DIR = os.path.join(BASE_DIR, "frontend/build/static")
STATICFILES_DIRS = []
if os.path.exists(FRONTEND_BUILD_DIR):
    STATICFILES_DIRS.append(FRONTEND_BUILD_DIR)

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Cache settings - Use file-based cache instead of memory cache
CACHES = {
    "default": {
        "BACKEND": (
            "django.core.cache.backends.filebased.FileBasedCache"
            if not TESTING
            else "django.core.cache.backends.dummy.DummyCache"
        ),
        "LOCATION": "/tmp/django_cache",
    }
}

# Reduce cache timeout
CACHE_TTL = 60  # 1 minute

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 5,  # Reduce page size
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_ORDERING_FIELDS": ["created_at", "time_taken"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "50/day",
        "user": "1000/day",
        "cube_scan": "10/minute",  # Custom throttle class
    },
    "DEFAULT_CACHE_RESPONSE_TIMEOUT": CACHE_TTL,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
}

# Database logging - disable during testing
if not TESTING:
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
            },
        },
        "loggers": {
            "django.db.backends": {
                "handlers": ["console"],
                "level": "INFO",  # Change to INFO to reduce log noise
                "propagate": False,
            },
        },
    }
