# RubikLog

RubikLog is a Django-based web application for tracking Rubik’s Cube solving times. It features a ReactJS frontend styled with TailwindCSS and uses PostgreSQL as its database.

## Features

- **Frontend**: Built with ReactJS and styled using TailwindCSS.
- **Backend**: Powered by Django, featuring RESTful APIs.
- **Database**: PostgreSQL for secure and efficient data storage.
- **Tracking**: Log solving times and scrambles for practice and analysis.
- **Continuous Integration**: GitHub Actions workflow for CI/CD pipelines.

---

## Project Directory Structure

```
.
├── .gitignore
├── LICENSE
├── README.md
├── RubikLog
│   ├── .env
│   ├── RubikLog
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── frontend
│   │   ├── .gitignore
│   │   ├── README.md
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── public
│   │   │   ├── favicon.ico
│   │   │   ├── index.html
│   │   │   ├── logo192.png
│   │   │   ├── logo512.png
│   │   │   ├── manifest.json
│   │   │   └── robots.txt
│   │   ├── src
│   │   │   ├── App.css
│   │   │   ├── App.js
│   │   │   ├── App.test.js
│   │   │   ├── index.css
│   │   │   ├── index.js
│   │   │   ├── logo.svg
│   │   │   ├── reportWebVitals.js
│   │   │   └── setupTests.js
│   │   └── tailwind.config.js
│   ├── manage.py
│   └── tracker
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── migrations
│       │   ├── 0001_initial.py
│       │   ├── 0002_solve_scramble.py
│       │   └── __init__.py
│       ├── models.py
│       ├── serializers.py
│       ├── tests.py
│       ├── urls.py
│       └── views.py
└── requirements.txt
```

---

## Requirements

### System Requirements

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **npm** (Node Package Manager)

### Python Dependencies

Install Python dependencies from the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

### Node.js Dependencies

Install Node.js dependencies for the frontend:

```bash
cd RubikLog/frontend
npm install
```

---

## Environment Variables

Create a `.env` file in the `RubikLog` directory with the following content:

```
SECRET_KEY=<your_django_secret_key>
DEBUG=True
DATABASE_URL=postgres://<db_user>:<db_password>@localhost:5432/rubiklogdb
```

---

## Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/shreyuu/RubikLog.git
cd RubikLog
```

### 2. Create and Activate Virtual Environment

```bash
python -m venv rubiklogenv
source rubiklogenv/bin/activate
```

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up the Database

Ensure PostgreSQL is running, then create the database:

```bash
psql -U postgres -c "CREATE DATABASE rubiklogdb;"
```

### 5. Run Migrations

```bash
python manage.py migrate
```

### 6. Start the Backend Server

```bash
python manage.py runserver
```

### 7. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 8. Start the Frontend Development Server

```bash
npm start
```

---

## Testing

### Backend Tests

Run the Django tests using:

```bash
python manage.py test
```

### Frontend Tests

Run React tests using:

```bash
npm test -- --watchAll=false
```

---

## CI/CD Workflow

A GitHub Actions workflow is set up for the following:

1. Running backend tests using Django.
2. Running frontend tests and builds using ReactJS.

### Workflow File

The workflow file is located at `.github/workflows/ci.yml`.

---

## Deployment

To deploy the app:

1. Ensure PostgreSQL is configured and accessible.
2. Set the `DEBUG` environment variable to `False`.
3. Collect static files for production:

    ```bash
    python manage.py collectstatic
    ```

4. Use a production-grade web server like Gunicorn or deploy using platforms such as Heroku, AWS, or Docker.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please create a pull request or open an issue for any enhancements or bug fixes.

---

## Acknowledgments

- Django for the backend framework.
- ReactJS for the frontend framework.
- TailwindCSS for styling.
- PostgreSQL for the database.

---

## Contact

For any inquiries or issues, please reach out to [Shreyuu](https://github.com/shreyuu).
