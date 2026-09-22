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
  active_warnings: number;
  avg_national_risk: number;
  population_at_risk: number;
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
  historical: number;
  predicted: number;
}

export interface RiskTrendsResponse {
  trends: RiskTrendPoint[];
}

export interface DistrictDashboard {
  district: string;
  risk_score: number;
  risk_level: string;
  risk_change_pct: number;
  temperature_c: number;
  humidity_pct: number;
  active_hotspots: number;
  sector_heatmap: Array<{
    sector: string;
    risk_score: number;
    risk_level: string;
    lat: number;
    lon: number;
  }>;
  forecast_30day: Array<{
    date: string;
    humidity_index: number;
    temperature_factor: number;
    satellite_pooling: number;
  }>;
  recommended_actions: string[];
  last_updated: string;
}

export interface DistrictListItem {
  district: string;
  province: string;
  current_risk: number;
  risk_level: string;
  high_cells?: number;
  total_cells?: number;
  trend_7day: string;
}

export interface ZonePrediction {
  zone_id: string;
  site_name?: string;
  village_risk: number;
  risk_level: string;
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
