import http from './api';

export interface AlertItem {
  id: string;
  risk_level: string;
  region: string;
  site_name?: string;
  trigger_reason: string;
  status: string;
  created_at: string;
}

export interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  active: number;
  resolved: number;
}

export interface AlertTemplate {
  id: string;
  name: string;
  message: string;
  channel: string[];
  audience: string;
}

export interface ComposeAlertRequest {
  message: string;
  delivery_channels?: string[];
  target_audience?: string;
  geographic_scope?: string[];
  risk_level?: string;
}

export interface ComposeAlertResponse {
  message: string;
  channels: string[];
  districts: string[];
  results: {
    dashboard: boolean;
    sms: boolean;
    sms_errors: string[];
  };
}

export interface SmsSubscribeRequest {
  phone_number: string;
  district: string;
}

export function listAlerts(params?: {
  risk_level?: string;
  status?: string;
  hours?: number;
  district?: string;
}) {
  return http.get<AlertItem[]>('/alerts/', params);
}

export function getAlertSummary(days: number = 7) {
  return http.get<AlertSummary>('/alerts/stats/summary', { days });
}

export function composeAlert(payload: ComposeAlertRequest) {
  return http.post<ComposeAlertResponse>('/alerts/compose', payload);
}

export function subscribeSms(payload: SmsSubscribeRequest) {
  return http.post<{
    message: string;
    district: string;
    phone: string;
  }>('/alerts/subscribe-sms', payload);
}

export function getAlertTemplates() {
  return http.get<AlertTemplate[]>('/alerts/templates');
}

export function acknowledgeAlert(
  alert_id: string,
  payload?: { notes?: string; assigned_team_id?: string }
) {
  return http.post<{ message: string; alert_id: string }>(
    `/alerts/${alert_id}/acknowledge`,
    payload || {}
  );
}

export function resolveAlert(
  alert_id: string,
  payload?: { response_notes?: string }
) {
  return http.post<{ message: string; alert_id: string }>(
    `/alerts/${alert_id}/resolve`,
    payload || {}
  );
}

export function sendTestSms(phone: string, message?: string) {
  const params: Record<string, string> = { phone };
  if (message) params.message = message;
  return http.post<{ message: string; provider_response: any }>(
    `/alerts/test-sms`,
    params
  );
}
