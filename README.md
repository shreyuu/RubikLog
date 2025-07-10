# RubikLog

RubikLog is a Django-based web application for tracking Rubik's Cube solving times with computer vision capabilities for scanning cube states. It features a ReactJS frontend styled with TailwindCSS and uses PostgreSQL as its database.

## Features

- **Timer**: Space bar-controlled timer with hold-to-ready functionality
- **Scramble Generator**: Built-in scramble generator and manual entry
- **Computer Vision**: Cube state detection using webcam
- **Statistics**: Track best times, Ao5, Ao12, and solve history
- **Dark Mode**: Toggle between light and dark themes
- **Frontend**: Built with ReactJS and styled using TailwindCSS
- **Backend**: Django REST framework with PostgreSQL database
- **Machine Learning**: TensorFlow-based solve time prediction
- **CI/CD**: GitHub Actions workflow for automated testing

---

## Project Structure

Key components:

```
RubikLog/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── CubeScanner.jsx
│   │   │   ├── DeleteButton.js
│   │   │   └── StatCard.jsx
│   │   └── utils/         # Utility functions
│   │       ├── cubeNotation.js
│   │       └── scrambleGenerator.js
├── tracker/                # Django backend app
│   ├── models.py          # Database models
│   ├── views.py           # API views
│   ├── serializers.py     # REST serializers
│   └── ml_service.py      # Machine learning services
└── RubikLog/              # Django project settings
```

---

## Requirements

### System Requirements

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
<!-- - Webcam (for cube scanning) -->

### Key Dependencies

- Django & Django REST framework
- ReactJS 18
- TailwindCSS
- TensorFlow
- OpenCV
- scikit-learn

---

## Quick Start

1. Clone and setup environment:

```bash
git clone <repository-url>
cd RubikLog
python -m venv rubiklogenv
source rubiklogenv/bin/activate  # or `rubiklogenv\Scripts\activate` on Windows
```

2. Install dependencies:

```bash
pip install -r requirements.txt
cd frontend
npm install
```

3. Set up database:

```bash
psql -U postgres -c "CREATE DATABASE rubiklogdb;"
python manage.py migrate
```

4. Start development servers:

```bash
# Terminal 1 - Backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm start
```

---

## Features in Detail

### Timer

- Space bar control
- Visual feedback for hold state
- Automatic scramble generation
- Manual time entry option

### Cube Scanner

- Webcam-based cube state detection
- Color normalization and recognition
- Automatic scramble generation from detected state
- Real-time visual feedback

### Statistics

- Best solve time
- Average of 5 (Ao5)
- Average of 12 (Ao12)
- Total solve count
- Detailed solve history

### Machine Learning

- Solve time prediction
- Color detection algorithms
- Pattern recognition for scramble detection

---

## Docker Deployment

RubikLog can be easily deployed using Docker:

```bash
# Build and start containers
docker-compose up -d

# Access the application at http://localhost:8000
```

## Deployment

### Render Deployment

RubikLog is configured for deployment on [Render](https://render.com/) using the `render.yaml` file.

1. Fork this repository
2. Connect your fork to Render
3. Create a new Web Service pointing to your repository
4. Render will automatically detect the configuration and deploy the application

## Development Environment

### Backend Development

```bash
# Create and activate virtual environment
python -m venv rubiklogenv
source rubiklogenv/bin/activate  # or `rubiklogenv\Scripts\activate` on Windows

# Install dependencies
pip install -r [requirements.txt](http://_vscodecontentref_/1)

# Set up environment variables
cp [.env.example](http://_vscodecontentref_/2) .env
# Edit .env with your configuration

# Run development server
python [manage.py](http://_vscodecontentref_/3) runserver
```

## Testing

Backend tests:

```bash
python manage.py test
```

Frontend tests:

```bash
cd frontend
npm test
```

## API Documentation

RubikLog provides comprehensive API documentation using Swagger/OpenAPI:

- **Swagger UI**: Access interactive API documentation at `/api/swagger/`
- **ReDoc**: Alternative API documentation view available at `/api/redoc/`
- **OpenAPI Schema**: Raw schema available at `/api/schema/`

## Contributing

Contributions are welcome! Please read the [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

Shreyash Meshram - [shreyashmeshram0031@gmail.com](mailto:shreyashmeshram0031@gmail.com)
