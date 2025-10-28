import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CreateAppointmentRequest {
  doctorId: number;
  appointmentDateTime: string; // ISO string: YYYY-MM-DDTHH:mm:ss
  reason?: string;
}

export interface PatientAppointmentItem {
  appointmentId: number;
  doctorName: string;
  doctorSpecialization?: string;
  doctorEmail?: string;
  doctorContactInfo?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason?: string;
  statusChangedBy?: string;
  statusChangedAt?: string;
}

export interface DoctorAppointmentItem {
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientEmail?: string;
  patientContactInfo?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason?: string;
  statusChangedBy?: string;
  statusChangedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getAvailableSlots(doctorId: number, dateISO: string) {
    return this.http.get<string[]>(
      `${this.baseUrl}/api/appointments/available-slots?doctorId=${doctorId}&date=${dateISO}`
    );
  }

  bookAppointment(payload: CreateAppointmentRequest) {
    return this.http.post(`${this.baseUrl}/api/appointments/patient/book`, payload);
  }

  getMyAppointments() {
    return this.http.get<PatientAppointmentItem[]>(`${this.baseUrl}/api/appointments/patient/my-appointments`);
  }

  // Patient endpoints
  getMyUpcomingAppointments() {
    return this.http.get<PatientAppointmentItem[]>(`${this.baseUrl}/api/appointments/patient/my-appointments/upcoming`);
  }

  getMyAppointmentsByStatus(status: string) {
    const s = encodeURIComponent(status);
    return this.http.get<PatientAppointmentItem[]>(`${this.baseUrl}/api/appointments/patient/my-appointments/status/${s}`);
  }

  cancelMyAppointment(id: number) {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/api/appointments/patient/${id}`);
  }

  rescheduleMyAppointment(id: number, newDateTimeISO: string) {
    const dt = encodeURIComponent(newDateTimeISO);
    return this.http.put<{ message: string; appointment: PatientAppointmentItem }>(
      `${this.baseUrl}/api/appointments/patient/${id}/reschedule?newDateTime=${dt}`,
      {}
    );
  }

  updateMyAppointment(id: number, payload: CreateAppointmentRequest) {
    return this.http.put<PatientAppointmentItem>(`${this.baseUrl}/api/appointments/patient/${id}`, payload);
  }

  // Doctor endpoints
  getDoctorAllAppointments() {
    return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients`);
  }

  getDoctorTodayAppointments() {
    return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients/today`);
  }

  getDoctorUpcomingAppointments() {
    return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients/upcoming`);
  }

  getDoctorAppointmentsByStatus(status: string) {
    const s = encodeURIComponent(status);
    return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients/status/${s}`);
  }

  getDoctorCompletedAppointments() {
    return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients/completed`);
  }

  getDoctorCancelledAppointments() {
    return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients/cancelled`);
  }

  // Get unique patients from doctor's appointments for lab test booking
  getDoctorUniquePatients() {
    return this.http.get<any[]>(`${this.baseUrl}/api/appointments/doctor/unique-patients`);
  }

  // Generic status update for doctor appointments
  updateAppointmentStatus(id: number, status: string) {
    const url = `${this.baseUrl}/api/appointments/doctor/${id}/status`;
    return this.http.put<DoctorAppointmentItem>(`${url}?status=${encodeURIComponent(status)}`, {});
  }

  confirmAppointment(id: number) {
    return this.http.put<DoctorAppointmentItem>(`${this.baseUrl}/api/appointments/doctor/${id}/confirm`, {});
  }

  completeAppointment(id: number) {
    return this.http.put<DoctorAppointmentItem>(`${this.baseUrl}/api/appointments/doctor/${id}/complete`, {});
  }

  cancelAppointment(id: number) {
    return this.http.put<DoctorAppointmentItem>(`${this.baseUrl}/api/appointments/doctor/${id}/cancel`, {});
  }
}