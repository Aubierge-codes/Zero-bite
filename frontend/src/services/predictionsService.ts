import http from './api';

export interface DistrictHeatmapItem {
  district: string;
  risk_level: string;
  risk_score: number;
  pct_high: number;
}

export interface DistrictPriorityItem {
  district: string;
  risk_score: number;
  risk_level: string;
  hazard_type: string;
}

export interface NationalSummary {
  high_risk_districts: number;
  critical_districts: number;
  active_warnings: number;
  avg_national_risk: number;
  avg_risk_change_pts: number | null;
  rising_districts: number;
  district_heatmap: DistrictHeatmapItem[];
  district_priority_ranking: DistrictPriorityItem[];
}

export interface AiSituationSummary {
  summary: string;
  recommended_actions: string[];
  top_zones?: Array<{ site: string; region: string; score: number }>;
  model_version: string;
  generated_at: string;
}

export interface RiskTrendPoint {
  week: string;
  historical: number | null;
  predicted: number | null;
}

export interface RiskTrendsResponse {
  trends: RiskTrendPoint[];
}

export interface DistrictForecastPoint {
  date: string;
  risk_score: number;
  rainfall_mm: number;
  humidity_pct: number;
  temperature_c: number;
  is_forecast: boolean;
}

export interface DistrictDashboard {
  district: string;
  province: string;
  risk_score: number;
  risk_level: string;
  risk_change_pts: number;
  temperature_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  soil_moisture: number;
  standing_water_index: number;
  flood_risk_index: number;
  confidence: number;
  high_risk_days_ahead: number;
  forecast_30day: DistrictForecastPoint[];
  recommended_actions: string[];
  model_version: string;
  last_updated: string;
}

export interface DistrictListItem {
  district: string;
  province: string;
  current_risk: number;
  risk_level: string;
  trend_7day: string;
}

export interface ZonePrediction {
  zone_id: string;
  site_name?: string;
  district: string;
  village_risk: number;
  risk_level: string;
  risk_change_pts: number;
  rainfall_mm?: number;
  humidity_pct?: number;
  temperature_c?: number;
  last_updated?: string;
  today_goals: Array<{ task: string; completed: boolean }>;
  weather_warning?: string;
}

export interface PublicDistrictRisk {
  district: string;
  risk_score: number;
  risk_level: string;
  transmission_stage: string;
  confidence_score: number;
  weather: {
    temperature_c: number;
    humidity_pct: number;
  };
  rainfall_mm: number;
  summary: string;
  weather_note: string;
  recommended_prevention: Array<{
    action: string;
    priority: string;
    detail: string;
  }>;
  updated_at: string;
}

export interface PredictionRecord {
  id: string;
  region: string;
  critical_risk: number;
  high_risk: number;
  moderate_risk: number;
  low_risk: number;
  model_version?: string;
  created_at: string;
}

export function getNationalSummary() {
  return http.get<NationalSummary>('/predictions/national-summary');
}

export function getAiSituationSummary() {
  return http.get<AiSituationSummary>('/predictions/ai-summary');
}

export function getRiskTrends(weeks: number = 6) {
  return http.get<RiskTrendsResponse>('/predictions/risk-trends', { weeks });
}

export function getDistrictDashboard(district_name: string) {
  return http.get<DistrictDashboard>(`/predictions/district/${encodeURIComponent(district_name)}`);
}

export function listAllDistricts() {
  return http.get<DistrictListItem[]>('/predictions/districts/');
}

export function getZonePrediction(zone_id: string) {
  return http.get<ZonePrediction>(`/predictions/zone/${zone_id}`);
}

export function getPublicDistrictRisk(district_name: string) {
  return http.get<PublicDistrictRisk>(`/predictions/public/${encodeURIComponent(district_name)}`);
}

export function runPrediction(region: string = 'Rwanda') {
  return http.post<{
    region: string;
    prediction_date: string;
    critical_risk: number;
    high_risk: number;
    moderate_risk: number;
    low_risk: number;
    total_cells: number;
    model_version: string;
    confidence: number;
    new_alerts: number;
    top_high_risk: Array<{
      site: string;
      score: number;
      lat: number;
      lon: number;
      level: string;
    }>;
  }>(`/predictions/predict?region=${encodeURIComponent(region)}`);
}

export function getPredictionHistory(days: number = 7) {
  return http.get<PredictionRecord[]>('/predictions/history', { days });
}

export function getLivePrediction(params: {
  lat: number;
  lon: number;
  ndvi?: number;
  river_distance_m?: number;
}) {
  return http.get('/predictions/live', params);
}
