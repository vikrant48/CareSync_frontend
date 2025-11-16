import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PatientAppointmentItem } from './appointment.service';

export interface PatientFeedbackItem {
  id: number;
  appointmentId: number;
  doctorName?: string | null;
  rating: number;
  comment?: string | null;
  anonymous?: boolean;
  submittedAt?: string; // ISO date string
}

export interface CreateFeedbackRequest {
  appointmentId: number;
  doctorId?: number | null; // optional; derived on backend
  rating: number;
  comment?: string;
  anonymous?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Completed appointments without feedback for current patient
  getPendingForPatient() {
    return this.http.get<PatientAppointmentItem[]>(`${this.baseUrl}/api/feedback/patient/pending`);
  }

  submitFeedback(payload: CreateFeedbackRequest) {
    return this.http.post(`${this.baseUrl}/api/feedback`, payload);
  }

  // Patient: fetch all previously submitted feedback
  getGivenForPatient(patientId: number | string) {
    return this.http.get<PatientFeedbackItem[]>(`${this.baseUrl}/api/feedback/patient/${patientId}`);
  }
}