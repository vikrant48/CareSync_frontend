export type Role = 'DOCTOR' | 'PATIENT' | 'ADMIN';

export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
  role: Role;
  message?: string;
  user?: any; // Backend returns Doctor/Patient entity
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  role: Role;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // ISO date string
  contactInfo?: string; // phone or contact info
  illnessDetails?: string; // patient-only
  specialization?: string; // doctor-only
}

export interface RefreshTokenRequest {
  refreshToken: string;
}