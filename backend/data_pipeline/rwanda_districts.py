"""
Rwanda's 30 districts: province and representative coordinates.

Coordinates are the district centroids used to query real weather data
(Open-Meteo). Static terrain features (elevation, river distance, ...) live in
scripts/build_static_features.py (DISTRICT_STATIC).
"""

DISTRICTS = [
    # name,        province,   lat,      lon
    ("Bugesera",   "Eastern",  -2.1833, 30.1667),
    ("Gatsibo",    "Eastern",  -1.5833, 30.4667),
    ("Kayonza",    "Eastern",  -1.8833, 30.6500),
    ("Kirehe",     "Eastern",  -2.3500, 30.6833),
    ("Ngoma",      "Eastern",  -2.1500, 30.4500),
    ("Nyagatare",  "Eastern",  -1.2833, 30.3333),
    ("Rwamagana",  "Eastern",  -1.9500, 30.4333),
    ("Huye",       "Southern", -2.5833, 29.7333),
    ("Gisagara",   "Southern", -2.6000, 29.8333),
    ("Kamonyi",    "Southern", -2.0000, 29.8667),
    ("Muhanga",    "Southern", -2.0833, 29.7500),
    ("Nyamagabe",  "Southern", -2.5000, 29.4833),
    ("Nyanza",     "Southern", -2.3500, 29.7500),
    ("Nyaruguru",  "Southern", -2.6167, 29.5333),
    ("Ruhango",    "Southern", -2.2333, 29.7833),
    ("Burera",     "Northern", -1.4667, 29.8500),
    ("Gakenke",    "Northern", -1.6833, 29.7833),
    ("Gicumbi",    "Northern", -1.5667, 30.0500),
    ("Musanze",    "Northern", -1.5000, 29.6333),
    ("Rulindo",    "Northern", -1.7167, 30.0167),
    ("Karongi",    "Western",  -2.1500, 29.3833),
    ("Ngororero",  "Western",  -1.8833, 29.5333),
    ("Nyabihu",    "Western",  -1.6667, 29.5000),
    ("Nyamasheke", "Western",  -2.3167, 29.1333),
    ("Rubavu",     "Western",  -1.6833, 29.2500),
    ("Rusizi",     "Western",  -2.4833, 28.9000),
    ("Rutsiro",    "Western",  -1.9500, 29.3333),
    ("Gasabo",     "Kigali",   -1.8950, 30.1167),
    ("Kicukiro",   "Kigali",   -1.9833, 30.1000),
    ("Nyarugenge", "Kigali",   -1.9441, 30.0619),
]

DISTRICT_NAMES = [d[0] for d in DISTRICTS]
DISTRICT_INFO = {
    name: {"district": name, "province": province, "latitude": lat, "longitude": lon}
    for name, province, lat, lon in DISTRICTS
}


def canonical_district(name: str) -> str | None:
    """Case-insensitive lookup; returns the canonical district name or None."""
    key = (name or "").strip().lower()
    for n in DISTRICT_NAMES:
        if n.lower() == key:
            return n
    return None
