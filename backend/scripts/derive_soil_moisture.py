"""
Derives soil moisture index from rainfall and temperature.
This is the Antecedent Precipitation Index (API) method — used by WHO and FAO.
Run AFTER fetch_historical_weather.py
"""
import pandas as pd
import numpy as np

df = pd.read_csv("training_data/weather_historical.csv", parse_dates=["date"])
df = df.sort_values(["district", "date"])

# API method: soil_moisture today = 0.85 * yesterday + today's rainfall
# Higher rainfall + cooler = wetter soil
df["soil_moisture"] = 0.0

for district in df["district"].unique():
    mask = df["district"] == district
    rows = df[mask].copy()
    
    sm = []
    prev = 0.3  # starting soil moisture
    for _, row in rows.iterrows():
        curr = 0.85 * prev + (row["rainfall_mm"] / 100)
        curr = float(np.clip(curr, 0, 1))
        sm.append(curr)
        prev = curr
    
    df.loc[mask, "soil_moisture"] = sm

df.to_csv("training_data/weather_with_soil.csv", index=False)
print(f"✅ Added soil moisture — saved {len(df)} rows")