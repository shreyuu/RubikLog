# Gunicorn configuration file
import multiprocessing

# Server socket
bind = "0.0.0.0:10000"
backlog = 2048

# Worker processes
workers = 1  # Single worker to save memory
worker_class = 'sync'
worker_connections = 100
timeout = 60  # Increased timeout
keepalive = 2

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Process naming
proc_name = 'rubiklog'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL
keyfile = None
certfile = None

# Memory optimization
max_requests = 1000
max_requests_jitter = 50
worker_tmp_dir = '/dev/shm'  # Use RAM for temporary files