import { apiGet, apiPost, apiPostForm } from './apiClient';

// ── Predictions ────────────────────────────────────────────────────────────

export interface DistrictHeatmapEntry {
  district: string;
  risk_level: string;
  risk_score: number;
  pct_high: number;
}

export interface DistrictPriorityEntry {
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
  district_heatmap: DistrictHeatmapEntry[];
  district_priority_ranking: DistrictPriorityEntry[];
}

export interface AiSummary {
  summary: string;
  recommended_actions: string[];
  top_zones?: { site: string; region: string; score: number }[];
  model_version: string;
  generated_at: string;
}

export interface RiskTrendPoint {
  week: string;
  historical: number;
  predicted: number;
}

export interface DistrictListEntry {
  district: string;
  province: string;
  current_risk: number;
  risk_level: string;
  trend_7day: string;
  high_cells?: number;
  total_cells?: number;
}

export interface SectorHeatmapEntry {
  sector: string;
  risk_score: number;
  risk_level: string;
  lat: number;
  lon: number;
}

export interface ForecastDay {
  date: string;
  humidity_index: number;
  temperature_factor: number;
  satellite_pooling: number;
}

export interface DistrictDashboardData {
  district: string;
  risk_score: number;
  risk_level: string;
  risk_change_pct: number;
  temperature_c: number;
  humidity_pct: number;
  active_hotspots: number;
  sector_heatmap: SectorHeatmapEntry[];
  forecast_30day: ForecastDay[];
  recommended_actions: string[];
  last_updated: string;
}

export interface ZonePrediction {
  zone_id: string;
  site_name?: string;
  village_risk: number;
  risk_level: string;
  rainfall_mm?: number;
  humidity_pct?: number;
  temperature_c?: number;
  risk_change_pct?: number;
  last_updated: string | null;
  today_goals: { task: string; completed: boolean }[];
  weather_warning: string;
}

export interface PublicDistrictRisk {
  district: string;
  risk_score: number;
  risk_level: string;
  transmission_stage: string;
  confidence_score: number;
  weather: { temperature_c: number; humidity_pct: number };
  recommended_prevention: { action: string; priority: string; detail: string }[];
  updated_at: string;
}

export const predictionsApi = {
  nationalSummary: () => apiGet<NationalSummary>('/predictions/national-summary'),
  aiSummary: () => apiGet<AiSummary>('/predictions/ai-summary'),
  riskTrends: (weeks = 6) => apiGet<{ trends: RiskTrendPoint[] }>('/predictions/risk-trends', { weeks }),
  districts: () => apiGet<DistrictListEntry[]>('/predictions/districts/'),
  district: (name: string) => apiGet<DistrictDashboardData>(`/predictions/district/${encodeURIComponent(name)}`),
  zone: (zoneId: string) => apiGet<ZonePrediction>(`/predictions/zone/${encodeURIComponent(zoneId)}`),
  publicDistrict: (name: string) => apiGet<PublicDistrictRisk>(`/predictions/public/${encodeURIComponent(name)}`),
};

// ── Alerts ─────────────────────────────────────────────────────────────────

export interface AlertRecord {
  id: string;
  risk_level: string;
  region: string;
  site_name: string | null;
  trigger_reason: string | null;
  status: string;
  created_at: string;
}

export interface AlertTemplate {
  id: string;
  name: string;
  message: string;
  channel: string[];
  audience: string;
}

export interface AlertStats {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  active: number;
  resolved: number;
}

export const alertsApi = {
  list: (params?: { risk_level?: string; status?: string; district?: string; hours?: number }) =>
    apiGet<AlertRecord[]>('/alerts/', params),
  stats: (days = 7) => apiGet<AlertStats>('/alerts/stats/summary', { days }),
  templates: () => apiGet<AlertTemplate[]>('/alerts/templates'),
  compose: (payload: {
    message: string;
    delivery_channels: string[];
    target_audience: string;
    geographic_scope: string[];
    risk_level: string;
  }) => apiPost<{ message: string; channels: string[]; districts: string[] }>('/alerts/compose', payload),
  subscribeSms: (payload: { phone_number: string; district: string }) =>
    apiPost<{ message: string; district: string; phone: string }>('/alerts/subscribe-sms', payload),
  broadcastSms: (payload: { message: string; district: string; zone_id?: string }) =>
    apiPost<{ message: string; district: string }>('/alerts/broadcast-sms', payload),
  testSms: (phone: string, message?: string) =>
    apiPost<{ message: string }>(`/alerts/test-sms${message ? `?phone=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}` : `?phone=${encodeURIComponent(phone)}`}`),
};

// ── Auth ───────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  redirect_to: string;
  user: { id: string; name: string; email?: string; phone?: string; role: string };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  is_active: boolean;
  last_active: string | null;
}

export const authApi = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.set('username', email);
    form.set('password', password);
    return apiPostForm<LoginResponse>('/auth/login', form);
  },
  sendOtp: (phoneNumber: string, role = 'community_worker') =>
    apiPost<{ message: string; phone_number: string; dev_otp: string | null }>('/auth/send-otp', {
      phone_number: phoneNumber,
      role,
    }),
  verifyOtp: (phoneNumber: string, otpCode: string) =>
    apiPost<LoginResponse>('/auth/verify-otp', { phone_number: phoneNumber, otp_code: otpCode }),
  me: () => apiGet<{ id: string; name: string; email: string; role: string; phone: string }>('/auth/me'),
  users: () => apiGet<AdminUser[]>('/auth/users'),
};

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface ActivityLogEntry {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
}

export const dashboardApi = {
  activityLog: (limit = 20) => apiGet<ActivityLogEntry[]>('/dashboard/activity-log', { limit }),
};
