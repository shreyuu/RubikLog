# Use Python 3.11 bullseye-slim image with pinned digest for security
FROM python:3.11-bullseye-slim@sha256:a9e0659c8e66ecf18ea9a3bc932990da535958559cd9d8447be104dc7a35532e

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    postgresql-client \
    build-essential \
    libpq-dev \
    pkg-config \
    libhdf5-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Create directories for static files and logs
RUN mkdir -p /app/staticfiles /app/logs

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN addgroup --system django \
    && adduser --system --group django

# Change ownership of the app directory to django user
RUN chown -R django:django /app

# Switch to django user
USER django

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Command to run the application
CMD ["gunicorn", "--config", "gunicorn_config.py", "RubikLog.wsgi:application"]
