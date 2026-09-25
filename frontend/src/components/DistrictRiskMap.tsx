import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import * as riskZonesService from '../services/riskZonesService';

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

interface DistrictRiskMapProps {
  showHazardLayers?: boolean;
}

export default function DistrictRiskMap({ showHazardLayers = true }: DistrictRiskMapProps) {
  const { data, isError } = useQuery({
    queryKey: ['risk-heatmap'],
    queryFn: () => riskZonesService.getRiskHeatmap(),
    refetchInterval: 10 * 60 * 1000,
  });

  const districts = (data?.features ?? []).map((f) => ({
    name: f.properties.region,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    risk: Math.round(f.properties.risk_score * 100),
    level: f.properties.risk_level,
    rainfall: f.properties.rainfall_mm,
    temperature: f.properties.temperature_c,
  }));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
              Risk Score: {d.risk}/100 ({d.level})
              {d.rainfall != null && <><br />Rainfall: {d.rainfall.toFixed(1)} mm</>}
              {d.temperature != null && <><br />Temperature: {d.temperature.toFixed(1)}°C</>}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {isError && (
        <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 400, background: 'white', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', color: 'var(--color-risk-critical)' }}>
          Could not load live risk data.
        </div>
      )}
    </div>
  );
}
