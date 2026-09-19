# Zero_Bite API Reference

Base URL: `http://localhost:8000/api/v1`

Interactive docs: `http://localhost:8000/docs`

---

## Authentication

### POST `/auth/login`
```json
{ "username": "admin@zerobite.rw", "password": "admin123" }
```
Returns: `{ "access_token": "...", "token_type": "bearer", "role": "admin" }`

Use `Authorization: Bearer <token>` on all protected endpoints.

---

## Dashboard

### GET `/dashboard/stats`
Returns all key metrics in one call: risk zone counts, active alerts, field ops, prediction info, drone fleet status.

### GET `/dashboard/activity-log`
Recent system activity for the timeline widget.

---

## Predictions

### POST `/predictions/predict`
Run AI risk prediction for a region.
```json
{ "region": "Rwanda", "prediction_date": "2026-05-06T06:00:00Z" }
```

### GET `/predictions/latest`
Most recent prediction run.

### GET `/predictions/history?days=7`
Historical prediction runs.

### GET `/predictions/grid/{grid_cell_id}`
Risk level for a specific 500m grid cell.

---

## Risk Zones

### GET `/risk-zones/heatmap?region=Kigali`
GeoJSON FeatureCollection for map rendering. Each feature has `risk_level`, `risk_score`, and all environmental features.

### GET `/risk-zones/?risk_level=HIGH`
List zones filtered by risk level.

### GET `/risk-zones/{zone_id}/history?days=30`
Historical risk scores for trend charts.

---

## Alerts

### GET `/alerts/?risk_level=high&status=active`
List alerts with optional filters.

### POST `/alerts/{alert_id}/acknowledge`
```json
{ "notes": "Team dispatched", "assigned_team_id": "..." }
```

### POST `/alerts/{alert_id}/resolve`
Mark alert resolved after field intervention.

### GET `/alerts/stats/summary?days=7`
Summary statistics for dashboard.

---

## Field Teams

### GET `/field-teams/`
List all teams with current status.

### POST `/field-teams/`
Register a new field team.

### POST `/field-teams/{team_id}/assign`
Assign team to a risk zone. Triggers SMS to team leader.
```json
{ "zone_id": "...", "task_type": "larviciding", "priority": "HIGH" }
```

### POST `/field-teams/{team_id}/treatment-log`
Log completed larviciding treatment. Auto-queues data for ML retraining.
```json
{
  "zone_id": "...", "latitude": -1.94, "longitude": 30.06,
  "larvicide_ml_used": 250.0, "site_type": "stagnant_pool",
  "larvae_count_before": 150, "larvae_count_after": 2
}
```

---

## Drone Dispatch

### POST `/drones/missions`
Create and auto-dispatch optimized drone mission.
```json
{ "drone_id": "...", "target_zone_ids": ["...", "..."], "mission_type": "survey" }
```

### GET `/drones/missions?status=in_flight`
List drone missions.

### GET `/drones/fleet/status`
Real-time fleet status (battery, GPS, availability).

---

## Data Ingestion

### POST `/data/satellite/trigger`
Manually trigger satellite imagery download. (Admin only)

### POST `/data/weather/trigger`
Manually trigger weather data pull. (Admin only)

### GET `/data/status`
Status of all pipeline jobs.

### GET `/data/latest-features?region=Rwanda`
Latest extracted environmental features fed into prediction model.

---

## Model Management

### POST `/model/retrain`
Trigger model retraining. (Admin only)

### GET `/model/metrics`
Current model performance: accuracy, F1, AUC-ROC, training sample count.

### GET `/model/versions`
All model versions with accuracy history.

### POST `/model/versions/{version_id}/promote`
Promote a model version to production. (Admin only)

### GET `/model/feature-importance`
Logistic regression coefficients showing which features most strongly predict risk.

### GET `/model/status`
Retraining job progress.

---

## Risk Levels

| Level    | Risk Score | Response Required |
|----------|-----------|-------------------|
| HIGH     | ≥ 0.70    | Immediate larviciding + alert |
| MODERATE | ≥ 0.40    | Schedule treatment within 48h |
| LOW      | < 0.40    | Monitor only |

## Environmental Features

| Feature | Source | Description |
|---------|--------|-------------|
| `rainfall_mm` | CHIRPS / OpenWeatherMap | 7-day accumulated rainfall |
| `temperature_c` | Landsat-8 Band 10 | Land Surface Temperature |
| `ndvi` | Sentinel-2 B8/B4 | Vegetation index |
| `humidity_pct` | ERA5 / Weather stations | Relative humidity |
| `soil_moisture` | Sentinel-1 SAR | Volumetric soil water |
| `river_buffer_m` | SRTM DEM + OSM | Distance to water body |
| `depression_index` | SRTM DEM | Topographic wetness index |
# Live Integration Endpoints

These endpoints were added for the Open-Meteo, OpenStreetMap, Earth Engine NDVI, Leafmap, and SMS integration workflow.

```text
GET  /api/v1/data/weather?lat=-1.9441&lon=30.0619
GET  /api/v1/data/osm/water?place_name=Kigali,%20Rwanda
GET  /api/v1/data/osm/distance-to-water?lat=-1.9441&lon=30.0619
GET  /api/v1/data/ndvi?lat=-1.9441&lon=30.0619
POST /api/v1/data/maps/demo
GET  /api/v1/predictions/live?lat=-1.9441&lon=30.0619&ndvi=0.5&river_distance_m=250
POST /api/v1/alerts/test-sms?phone=+2507XXXXXXXX
```

NDVI requires Google Earth Engine authentication before it can return a value.
