import http from './api';

export function submitContact(payload: {
  name: string;
  email: string;
  organization?: string;
  subject?: string;
  message: string;
}) {
  return http.post<{ message: string }>('/contact/', payload);
}

export interface ModelMetricsPublic {
  accuracy: number;
  version: string;
  test_samples: number;
}

export function getPublicModelMetrics() {
  return http.get<ModelMetricsPublic>('/model/metrics');
}
