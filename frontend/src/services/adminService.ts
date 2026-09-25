import http from './api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  district: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SmsStatus {
  configured: boolean;
  provider: string;
  username: string;
  sandbox: boolean;
  sender_id: string;
  api_key_hint: string | null;
  delivered_7d: number;
  failed_7d: number;
  delivery_rate_7d: number | null;
  subscribers: number;
}

export interface SmsLogItem {
  id: string;
  phone: string;
  district: string | null;
  status: 'delivered' | 'failed' | 'skipped';
  detail: string | null;
  created_at: string;
}

export interface Thresholds {
  moderate: number;
  high: number;
  critical: number;
}

export interface ModelMetrics {
  version: string;
  deployed_version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_samples: number;
  test_samples: number;
  evaluated_at: string;
  note?: string;
}

export const listUsers = () => http.get<AdminUser[]>('/auth/users');

export const setUserActive = (id: string, is_active: boolean) =>
  http.patch<{ id: string; is_active: boolean }>(`/auth/users/${id}/active`, { is_active });

export const getSmsStatus = () => http.get<SmsStatus>('/alerts/sms/status');

export const getSmsLog = (limit = 20) => http.get<SmsLogItem[]>('/alerts/sms/log', { limit });

export const sendTestSms = (phone: string) =>
  http.post<{ message: string; status: string }>(`/alerts/test-sms?phone=${encodeURIComponent(phone)}`);

export const getThresholds = () => http.get<Thresholds>('/model/thresholds');

export const getModelMetrics = () => http.get<ModelMetrics>('/model/metrics');
