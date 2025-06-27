.PHONY: help install dev-install migrate test clean run docker-build docker-up docker-down

help:  ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install:  ## Install production dependencies
	pip install -r requirements.txt

dev-install:  ## Install all dependencies including development tools
	pip install -r requirements.txt
	pip install pre-commit black isort flake8
	pre-commit install

migrate:  ## Run database migrations
	python manage.py makemigrations
	python manage.py migrate

test:  ## Run tests with coverage
	python manage.py test --settings=RubikLog.settings --keepdb --parallel
	coverage run --source='.' manage.py test
	coverage report
	coverage html

test-fast:  ## Run tests without coverage
	python manage.py test --settings=RubikLog.settings --keepdb --parallel

lint:  ## Run code linting
	black --check .
	isort --check-only --profile black .
	flake8 .

format:  ## Format code
	black .
	isort --profile black .

clean:  ## Clean up generated files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf .coverage htmlcov/ .pytest_cache/
	rm -f rubiklog.log bandit-report.json

run:  ## Run development server
	python manage.py runserver

collectstatic:  ## Collect static files
	python manage.py collectstatic --noinput

fake-data:  ## Generate fake data for development
	python manage.py generate_fake_data --count 100

refresh:  ## Clear caches and refresh system
	python manage.py refresh_system

docker-build:  ## Build Docker image
	docker-compose build

docker-up:  ## Start services with Docker
	docker-compose up -d

docker-down:  ## Stop Docker services
	docker-compose down

docker-logs:  ## View Docker logs
	docker-compose logs -f

backup-db:  ## Backup database (PostgreSQL)
	pg_dump -h localhost -U postgres rubiklogdb > backup_$(shell date +%Y%m%d_%H%M%S).sql

shell:  ## Open Django shell
	python manage.py shell

superuser:  ## Create superuser
	python manage.py createsuperuser

requirements:  ## Update requirements.txt
	pip freeze > requirements.txt
