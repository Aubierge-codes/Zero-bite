import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

const RISK_COLORS = {
  low: '#4CAF50',
  moderate: '#FFB300',
  high: '#F4511E',
  critical: '#E53935',
};

function colorFor(risk: number) {
  if (risk >= 76) return RISK_COLORS.critical;
  if (risk >= 51) return RISK_COLORS.high;
  if (risk >= 26) return RISK_COLORS.moderate;
  return RISK_COLORS.low;
}

const districts = [
  { name: 'Nyagatare', lat: -1.2925, lon: 30.3253, risk: 91 },
  { name: 'Kayonza', lat: -1.8825, lon: 30.6438, risk: 88 },
  { name: 'Bugesera', lat: -2.2367, lon: 30.2483, risk: 82 },
  { name: 'Gasabo', lat: -1.9441, lon: 30.1119, risk: 82 },
  { name: 'Musanze', lat: -1.4998, lon: 29.6344, risk: 78 },
  { name: 'Gicumbi', lat: -1.6939, lon: 30.0692, risk: 75 },
  { name: 'Nyamasheke', lat: -2.3583, lon: 29.1167, risk: 68 },
  { name: 'Rubavu', lat: -1.6939, lon: 29.2569, risk: 64 },
  { name: 'Kicukiro', lat: -1.9706, lon: 30.1044, risk: 45 },
  { name: 'Nyarugenge', lat: -1.9536, lon: 30.0606, risk: 31 },
  { name: 'Huye', lat: -2.5967, lon: 29.7392, risk: 22 },
];

interface DistrictRiskMapProps {
  showHazardLayers?: boolean;
}

export default function DistrictRiskMap({ showHazardLayers = true }: DistrictRiskMapProps) {
  return (
    <MapContainer
      center={[-1.9403, 29.8739]}
      zoom={8}
      scrollWheelZoom={false}
      style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: 'var(--radius-md)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {showHazardLayers && districts.map((d) => (
        <CircleMarker
          key={d.name}
          center={[d.lat, d.lon]}
          radius={8 + d.risk / 12}
          pathOptions={{ color: 'white', weight: 2, fillColor: colorFor(d.risk), fillOpacity: 0.85 }}
        >
          <Popup>
            <strong>{d.name}</strong>
            <br />
            Risk Score: {d.risk}/100
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
