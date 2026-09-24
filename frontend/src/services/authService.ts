import http from './api';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  redirect_to: string;
  user: User;
}

export interface OtpSendResponse {
  message: string;
  phone_number: string;
  dev_otp?: string;
}

export interface OtpVerifyResponse {
  access_token: string;
  token_type: string;
  role: string;
  redirect_to: string;
  user: User;
}

export function loginWithEmail(email: string, password: string) {
  const form = new FormData();
  form.append('username', email);
  form.append('password', password);
  return http.post<LoginResponse>('/auth/login', form);
}

export function sendOtp(phone_number: string, role: string = 'community_worker') {
  return http.post<OtpSendResponse>('/auth/send-otp', { phone_number, role });
}

export function verifyOtp(phone_number: string, otp_code: string) {
  return http.post<OtpVerifyResponse>('/auth/verify-otp', { phone_number, otp_code });
}

export function register(payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  district?: string;
}) {
  return http.post<{ message: string; email: string; role: string; redirect_to: string }>(
    '/auth/register',
    payload
  );
}

export function logout() {
  return http.post<{ message: string }>('/auth/logout', {});
}

export function getMe() {
  return http.get<User>('/auth/me');
}
