import http from './api';

export interface ReportDistrictRow {
  district: string;
  province: string;
  avg_risk: number;
  peak_risk: number;
  latest_risk: number;
  latest_level: string;
  days_high: number;
  total_rain_mm: number;
  avg_temp_c: number;
  avg_humidity: number;
  avg_flood_risk: number;
}

export interface ReportSummary {
  report_id: string;
  generated_at: string;
  period: { start: string; end: string; days: number };
  available: { from: string; to: string };
  model_version: string;
  totals: {
    districts: number;
    avg_risk: number;
    previous_avg_risk: number | null;
    by_level: Record<'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW', number>;
  };
  executive_summary: string;
  districts: ReportDistrictRow[];
  weekly_trend: Array<{ week: string; avg_risk: number }>;
  operations: {
    alerts_by_level: Record<string, number>;
    alerts_total: number;
    sites_treated: number;
    larvicide_ml: number;
    avg_larvae_reduction_pct: number | null;
    sms_delivered: number;
  };
}

export function getReportSummary(params: { start?: string; end?: string; districts?: string[] }) {
  return http.get<ReportSummary>('/reports/summary', {
    start: params.start,
    end: params.end,
    districts: params.districts?.join(','),
  });
}
