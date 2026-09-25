# Zero_Bite — AI Predictive Mosquito Control System

## Overview
Zero_Bite is an AI-powered early warning and response system that detects, predicts, and controls mosquito breeding sites using satellite imagery, environmental data, and machine learning.

## Architecture
```
zero_bite/
├── api/                  # FastAPI REST backend
├── ml/                   # ML prediction engine (Logistic Regression)
├── data_pipeline/        # Satellite & weather data ingestion
├── scheduler/            # Automated daily tasks & retraining
├── alerts/               # Alert generation & notification
├── database/             # Models, migrations, seed data
├── drone/                # Drone dispatch & routing
├── field_teams/          # Field team management & assignments
├── tests/                # Full test suite
├── docs/                 # API documentation
└── scripts/              # Deployment & utility scripts
```

## Quick Start

### Prerequisites
- Python 3.10-3.12 for local installs. Python 3.11 is recommended.
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (recommended)

### Setup
```bash
# Clone and install
cd zero_bite
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
python scripts/init_db.py

# Run the full stack
docker-compose up -d

# Or run directly
uvicorn api.main:app --reload --port 8000
```

### Windows-Friendly Docker Run
The full GIS/ML stack is easiest on Windows with Docker because packages like GDAL, Fiona, Rasterio, OSMnx, Leafmap, and Earth Engine are sensitive to local Python and system-library versions.

```bash
docker compose build
docker compose up
```

Open:

```text
http://127.0.0.1:8000/docs
```

### Local Python Run
Use Python 3.11 if possible.

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

The current `.env` uses local SQLite for easier development:

```env
DATABASE_URL=sqlite+aiosqlite:///./zerobite_dev.db
```

For PostgreSQL, switch to:

```env
DATABASE_URL=postgresql+asyncpg://zerobite:password@localhost:5432/zerobite_db
```

## Real Data Pipeline

Every number the dashboards show comes from real sources - nothing is randomly generated:

- **Live weather** (rain, temperature, humidity, sunshine, 16-day forecast) for all 30 districts from Open-Meteo (no API key).
- **Static terrain/census features** from `scripts/build_static_features.py`.
- **Trained XGBoost model** (`models/`) scores every district; results are stored in `risk_zones`, `zone_history`, `alerts`, `predictions` and refreshed on API startup and then every hour.
- NDVI has no free keyless feed, so a seasonal proxy (identical to the one used in training) is used for that one feature.

First run on an existing database:

```bash
python -m scripts.purge_demo_data     # removes old fabricated rows (safe to re-run)
python -m scripts.seed_db             # creates the demo login accounts (admin@zerobite.rw / admin123)
python -m scripts.evaluate_model      # writes models/metrics.json (measured accuracy shown in the UI)
uvicorn api.main:app --reload
```

SMS is sent through Africa's Talking only when `AFRICASTALKING_API_KEY` is set; otherwise messages are logged as "skipped" (Settings > SMS Gateway).

## Core Components

### 1. AI Prediction Engine (`ml/`)
Logistic Regression model trained on:
- Rainfall accumulation (mm)
- Land Surface Temperature (°C)
- NDVI (vegetation index)
- Soil moisture %
- Topographic depression index
- River buffer distance (m)
- Historical outbreak records

**Output**: Risk score (0–1) → classified as High / Moderate / Low

### 2. Data Pipeline (`data_pipeline/`)
- Ingests satellite imagery (Sentinel-2, Landsat-8)
- Pulls live weather from Open-Meteo
- Extracts rivers, wetlands, and water bodies from OpenStreetMap with OSMnx
- Supports Sentinel-2 NDVI through Google Earth Engine
- Creates Leafmap/Folium visualizations
- Extracts GIS features per grid cell
- Runs every 6 hours via scheduler

### 3. Alert System (`alerts/`)
- Generates predictive alerts 24h in advance
- Dispatches SMS (via Africa's Talking), email, and push notifications
- Routes alerts to relevant field teams and health officials

### 4. Drone Dispatch (`drone/`)
- Optimizes drone routes to high-risk zones
- Tracks mission status
- Logs GPS coordinates and coverage data

### 5. Field Teams (`field_teams/`)
- Assigns larviciding teams to prioritized zones
- Tracks treatment completion
- Feeds outcome data back into ML retraining pipeline

## API Endpoints
See `docs/api_reference.md` or run: `http://localhost:8000/docs`

Useful live demo endpoints:

```text
GET  /api/v1/data/weather?lat=-1.9441&lon=30.0619
GET  /api/v1/data/osm/water?place_name=Kigali,%20Rwanda
GET  /api/v1/data/osm/distance-to-water?lat=-1.9441&lon=30.0619
GET  /api/v1/data/ndvi?lat=-1.9441&lon=30.0619
POST /api/v1/data/maps/demo
GET  /api/v1/predictions/live?lat=-1.9441&lon=30.0619&ndvi=0.5&river_distance_m=250
POST /api/v1/alerts/test-sms?phone=+2507XXXXXXXX
```

Earth Engine NDVI requires authentication first:

```bash
earthengine authenticate
```

## Environment Variables
See `.env.example` for full list.

## License
MIT — Zero_Bite Project
