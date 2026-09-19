"""
Builds static per-district features that don't change daily.
Sources: SRTM elevation (known values), NISR Rwanda 2022 census,
         historical flood risk classification.
"""
import pandas as pd

# Rwanda district static data
# elevation: avg metres above sea level
# population_density: people/km² (NISR 2022 census)
# flood_risk_base: baseline flood risk 0-1 (low-lying = higher)
# river_buffer_m: avg distance to nearest river (from OSM analysis)
# depression_index: topographic wetness (higher = more pooling)

DISTRICT_STATIC = [
    {"district": "Bugesera",   "elevation": 1400, "population_density": 285, "flood_risk_base": 0.75, "river_buffer_m": 180, "depression_index": 0.72},
    {"district": "Gatsibo",    "elevation": 1500, "population_density": 198, "flood_risk_base": 0.55, "river_buffer_m": 240, "depression_index": 0.55},
    {"district": "Kayonza",    "elevation": 1450, "population_density": 176, "flood_risk_base": 0.60, "river_buffer_m": 210, "depression_index": 0.58},
    {"district": "Kirehe",     "elevation": 1380, "population_density": 220, "flood_risk_base": 0.70, "river_buffer_m": 160, "depression_index": 0.68},
    {"district": "Nyagatare",  "elevation": 1350, "population_density": 112, "flood_risk_base": 0.50, "river_buffer_m": 320, "depression_index": 0.45},
    {"district": "Rwamagana",  "elevation": 1480, "population_density": 310, "flood_risk_base": 0.58, "river_buffer_m": 200, "depression_index": 0.52},
    {"district": "Huye",       "elevation": 1720, "population_density": 420, "flood_risk_base": 0.30, "river_buffer_m": 380, "depression_index": 0.35},
    {"district": "Gisagara",   "elevation": 1650, "population_density": 380, "flood_risk_base": 0.35, "river_buffer_m": 350, "depression_index": 0.38},
    {"district": "Kamonyi",    "elevation": 1580, "population_density": 395, "flood_risk_base": 0.40, "river_buffer_m": 290, "depression_index": 0.42},
    {"district": "Muhanga",    "elevation": 1700, "population_density": 445, "flood_risk_base": 0.32, "river_buffer_m": 370, "depression_index": 0.36},
    {"district": "Nyamagabe",  "elevation": 2050, "population_density": 290, "flood_risk_base": 0.20, "river_buffer_m": 450, "depression_index": 0.28},
    {"district": "Nyamasheke", "elevation": 1900, "population_density": 330, "flood_risk_base": 0.25, "river_buffer_m": 420, "depression_index": 0.30},
    {"district": "Nyanza",     "elevation": 1620, "population_density": 360, "flood_risk_base": 0.38, "river_buffer_m": 310, "depression_index": 0.40},
    {"district": "Ruhango",    "elevation": 1600, "population_density": 350, "flood_risk_base": 0.42, "river_buffer_m": 300, "depression_index": 0.44},
    {"district": "Gakenke",    "elevation": 1850, "population_density": 298, "flood_risk_base": 0.22, "river_buffer_m": 430, "depression_index": 0.29},
    {"district": "Gicumbi",    "elevation": 1900, "population_density": 312, "flood_risk_base": 0.20, "river_buffer_m": 460, "depression_index": 0.27},
    {"district": "Burera",     "elevation": 2100, "population_density": 265, "flood_risk_base": 0.18, "river_buffer_m": 500, "depression_index": 0.25},
    {"district": "Musanze",    "elevation": 1850, "population_density": 385, "flood_risk_base": 0.22, "river_buffer_m": 440, "depression_index": 0.28},
    {"district": "Ngororero",  "elevation": 1950, "population_density": 272, "flood_risk_base": 0.19, "river_buffer_m": 480, "depression_index": 0.26},
    {"district": "Nyabihu",    "elevation": 2000, "population_density": 288, "flood_risk_base": 0.18, "river_buffer_m": 490, "depression_index": 0.24},
    {"district": "Rubavu",     "elevation": 1520, "population_density": 680, "flood_risk_base": 0.45, "river_buffer_m": 220, "depression_index": 0.50},
    {"district": "Rulindo",    "elevation": 1800, "population_density": 305, "flood_risk_base": 0.24, "river_buffer_m": 410, "depression_index": 0.30},
    {"district": "Karongi",    "elevation": 1750, "population_density": 295, "flood_risk_base": 0.28, "river_buffer_m": 395, "depression_index": 0.32},
    {"district": "Nyarugenge", "elevation": 1567, "population_density": 8200,"flood_risk_base": 0.48, "river_buffer_m": 190, "depression_index": 0.50},
    {"district": "Gasabo",     "elevation": 1490, "population_density": 1850,"flood_risk_base": 0.50, "river_buffer_m": 200, "depression_index": 0.52},
    {"district": "Kicukiro",   "elevation": 1510, "population_density": 2100,"flood_risk_base": 0.46, "river_buffer_m": 195, "depression_index": 0.48},
    {"district": "Rusizi",     "elevation": 1460, "population_density": 245, "flood_risk_base": 0.65, "river_buffer_m": 150, "depression_index": 0.70},
    {"district": "Ngoma",      "elevation": 1420, "population_density": 232, "flood_risk_base": 0.62, "river_buffer_m": 175, "depression_index": 0.65},
    {"district": "Rutsiro",    "elevation": 1780, "population_density": 260, "flood_risk_base": 0.26, "river_buffer_m": 405, "depression_index": 0.31},
    {"district": "Kayonza",    "elevation": 1450, "population_density": 176, "flood_risk_base": 0.60, "river_buffer_m": 210, "depression_index": 0.58},
]

df = pd.DataFrame(DISTRICT_STATIC)
df.to_csv("training_data/district_static.csv", index=False)
print(f"✅ Saved static features for {len(df)} districts")