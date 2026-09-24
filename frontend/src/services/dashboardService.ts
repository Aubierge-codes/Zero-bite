import http from './api';

export interface DashboardStats {
  timestamp: string;
  risk_zones: {
    total: number;
    high: number;
    moderate: number;
    low: number;
  };
  alerts: {
    active_24h: number;
    high: number;
    moderate: number;
  };
  field_ops: {
    total_teams: number;
    deployed_teams: number;
    sites_treated_7d: number;
    larvicide_saved_pct: number;
  };
  prediction: {
    last_run: string | null;
    model_version: string;
    lead_time_hours: number;
  };
}

export interface ActivityLogItem {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
}

export function getDashboardStats() {
  return http.get<DashboardStats>('/dashboard/stats');
}

export function getActivityLog(limit: number = 20) {
  return http.get<ActivityLogItem[]>('/dashboard/activity-log', { limit });
}
