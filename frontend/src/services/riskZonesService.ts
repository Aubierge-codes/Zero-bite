import http from './api';

export interface RiskZoneItem {
  id: string;
  site_name?: string;
  region: string;
  risk_level: string;
  risk_score: number;
  latitude: number;
  longitude: number;
  rainfall_mm?: number;
  temperature_c?: number;
}

export interface HeatmapResponse {
  type: string;
  features: Array<{
    type: string;
    geometry: { type: string; coordinates: [number, number] };
    properties: {
      id: string;
      risk_level: string;
      risk_score: number;
      site_name?: string;
      region: string;
      rainfall_mm?: number;
      temperature_c?: number;
      ndvi?: number;
      humidity_pct?: number;
    };
  }>;
  metadata: {
    total_sites: number;
    high_risk: number;
    moderate_risk: number;
    low_risk: number;
  };
}

export function getRiskHeatmap(region?: string) {
  return http.get<HeatmapResponse>('/risk-zones/heatmap', region ? { region } : undefined);
}

export function listRiskZones(params?: {
  risk_level?: string;
  region?: string;
  limit?: number;
}) {
  return http.get<RiskZoneItem[]>('/risk-zones/', params);
}

export function getRiskZone(zone_id: string) {
  return http.get<RiskZoneItem & any>(`/risk-zones/${zone_id}`);
}
