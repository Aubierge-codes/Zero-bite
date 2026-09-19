"""
Fetches 10 years of daily weather data from NASA POWER API
for all 30 Rwanda districts and saves to training_data/weather_historical.csv
"""
import requests
import pandas as pd
from datetime import datetime, timedelta
import time

# Rwanda's 30 districts with approximate center coordinates
RWANDA_DISTRICTS = [
    {"name": "Bugesera",    "lat": -2.1833, "lon": 30.1667},
    {"name": "Gatsibo",     "lat": -1.5833, "lon": 30.4667},
    {"name": "Kayonza",     "lat": -1.8833, "lon": 30.6500},
    {"name": "Kirehe",      "lat": -2.3500, "lon": 30.6833},
    {"name": "Ngoma",       "lat": -2.1500, "lon": 30.4500},
    {"name": "Nyagatare",   "lat": -1.2833, "lon": 30.3333},
    {"name": "Rwamagana",   "lat": -1.9500, "lon": 30.4333},
    {"name": "Huye",        "lat": -2.5833, "lon": 29.7333},
    {"name": "Gisagara",    "lat": -2.6000, "lon": 29.8333},
    {"name": "Kamonyi",     "lat": -2.0000, "lon": 29.8667},
    {"name": "Muhanga",     "lat": -2.0833, "lon": 29.7500},
    {"name": "Nyamagabe",   "lat": -2.5000, "lon": 29.4833},
    {"name": "Nyamasheke",  "lat": -2.3167, "lon": 29.1333},
    {"name": "Nyanza",      "lat": -2.3500, "lon": 29.7500},
    {"name": "Ruhango",     "lat": -2.2333, "lon": 29.7833},
    {"name": "Gakenke",     "lat": -1.6833, "lon": 29.7833},
    {"name": "Gicumbi",     "lat": -1.5667, "lon": 30.0500},
    {"name": "Burera",      "lat": -1.4667, "lon": 29.8500},
    {"name": "Musanze",     "lat": -1.5000, "lon": 29.6333},
    {"name": "Ngororero",   "lat": -1.8833, "lon": 29.5333},
    {"name": "Nyabihu",     "lat": -1.6667, "lon": 29.5000},
    {"name": "Rubavu",      "lat": -1.6833, "lon": 29.2500},
    {"name": "Rulindo",     "lat": -1.7167, "lon": 30.0167},
    {"name": "Karongi",     "lat": -2.1500, "lon": 29.3833},
    {"name": "Ngoma",       "lat": -2.1500, "lon": 30.4500},
    {"name": "Nyarugenge",  "lat": -1.9441, "lon": 30.0619},
    {"name": "Gasabo",      "lat": -1.8950, "lon": 30.1167},
    {"name": "Kicukiro",    "lat": -1.9833, "lon": 30.1000},
    {"name": "Rusizi",      "lat": -2.4833, "lon": 28.9000},
    {"name": "Nyagatare",   "lat": -1.2833, "lon": 30.3333},
]

def fetch_district_weather(district: dict, start_year: int = 2015) -> pd.DataFrame:
    """Fetch daily weather from NASA POWER for one district, 10 years back."""
    
    start = f"{start_year}0101"
    end   = datetime.utcnow().strftime("%Y%m%d")
    
    url = (
        f"https://power.larc.nasa.gov/api/temporal/daily/point"
        f"?parameters=PRECTOTCORR,T2M,RH2M,ALLSKY_SFC_SW_DWN"
        f"&community=AG"
        f"&longitude={district['lon']}"
        f"&latitude={district['lat']}"
        f"&start={start}&end={end}"
        f"&format=JSON"
    )
    
    response = requests.get(url, timeout=60)
    data     = response.json()["properties"]["parameter"]
    
    dates      = list(data["PRECTOTCORR"].keys())
    rainfall   = list(data["PRECTOTCORR"].values())   # mm/day
    temp       = list(data["T2M"].values())            # °C at 2m
    humidity   = list(data["RH2M"].values())           # % relative humidity
    sunshine   = list(data["ALLSKY_SFC_SW_DWN"].values())  # MJ/m² → proxy for sunshine

    df = pd.DataFrame({
        "date":             dates,
        "district":         district["name"],
        "latitude":         district["lat"],
        "longitude":        district["lon"],
        "rainfall_mm":      rainfall,
        "temperature_c":    temp,
        "humidity_pct":     humidity,
        "sunshine_hours":   sunshine,
    })
    df["date"] = pd.to_datetime(df["date"], format="%Y%m%d")
    return df


if __name__ == "__main__":
    all_frames = []
    
    for i, district in enumerate(RWANDA_DISTRICTS):
        print(f"[{i+1}/{len(RWANDA_DISTRICTS)}] Fetching {district['name']}...")
        try:
            df = fetch_district_weather(district, start_year=2015)
            all_frames.append(df)
            time.sleep(1)  # be polite to the API
        except Exception as e:
            print(f"  ⚠ Failed for {district['name']}: {e}")
    
    combined = pd.concat(all_frames, ignore_index=True)
    combined.to_csv("training_data/weather_historical.csv", index=False)
    print(f"\n✅ Saved {len(combined)} rows to training_data/weather_historical.csv")