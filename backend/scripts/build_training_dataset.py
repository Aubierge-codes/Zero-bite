"""
Merges weather history + soil moisture + static features
into the final training_data/dataset_final.csv
This is what trainer.py will load for real training.
Run after all three fetch scripts above.
"""
import pandas as pd
import numpy as np

print("Loading data sources...")
weather = pd.read_csv("training_data/weather_with_soil.csv",  parse_dates=["date"])
static  = pd.read_csv("training_data/district_static.csv")

# Merge static features onto every daily weather row
df = weather.merge(static, on="district", how="left")

# Add season weight: 1.0 = MAM (Mar-May) or OND (Oct-Dec), 0.5 = dry
df["month"]         = df["date"].dt.month
df["season_weight"] = df["month"].apply(
    lambda m: 1.0 if m in {3, 4, 5, 10, 11, 12} else 0.5
)

# Derive flood_risk_index from base + current rainfall + soil moisture
# High base risk + heavy rain + saturated soil = high flood risk
df["flood_risk_index"] = np.clip(
    df["flood_risk_base"]
    + 0.3 * (df["rainfall_mm"] / df["rainfall_mm"].max())
    + 0.2 * df["soil_moisture"],
    0, 1
)

# Standing water (proxy from rainfall + soil saturation)
# In production this comes from Sentinel-2; here we approximate
df["standing_water_km2"] = np.clip(
    (df["rainfall_mm"] / 20) * df["soil_moisture"] * (1 - df["elevation"] / 3000),
    0, 10
)

# Normalise sunshine (NASA gives MJ/m², rough conversion to hours: ÷ 3.6)
df["sunshine_hours"] = np.clip(df["sunshine_hours"] / 3.6, 0, 12)

# Keep only the 12 ML feature columns + metadata
KEEP = [
    "date", "district", "latitude", "longitude",
    "rainfall_mm", "temperature_c", "ndvi",
    "humidity_pct", "soil_moisture",
    "river_buffer_m", "depression_index",
    "flood_risk_index", "standing_water_km2",
    "sunshine_hours", "population_density", "season_weight",
]

# NDVI: NASA POWER doesn't provide it directly
# Use a seasonal proxy: higher in rainy season, peaks at 0.7
df["ndvi"] = df["season_weight"] * 0.65 + np.random.normal(0, 0.05, len(df))
df["ndvi"] = np.clip(df["ndvi"], 0, 1)

df = df[KEEP].dropna()
df.to_csv("training_data/dataset_final.csv", index=False)
print(f"✅ Final dataset: {len(df):,} rows × {len(df.columns)} columns")
print(f"   Date range: {df['date'].min()} → {df['date'].max()}")
print(f"   Districts:  {df['district'].nunique()}")