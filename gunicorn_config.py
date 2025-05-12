bind = "127.0.0.1:8000"
workers = 3
wsgi_app = "RubikLog.wsgi:application"
accesslog = "access.log"
errorlog = "error.log"
capture_output = True