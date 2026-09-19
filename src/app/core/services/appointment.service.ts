import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface CreateAppointmentRequest {
  doctorId: number;
  appointmentDateTime: string; // ISO string: YYYY-MM-DDTHH:mm:ss
  reason?: string;
  transactionId?: string;
}

export interface PatientAppointmentItem {
  appointmentId: number;
  patientId?: number;
  patientName?: string;
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
  doctorIsVerified?: boolean;
  doctorProfileImageUrl?: string;
  videoRoomId?: string;
  isActive?: boolean;
  consultationFees?: number;
  transactionId?: string;
  appointmentMedicalHistory?: any;
  medicalHistory?: any[];
}

export interface DoctorAppointmentItem {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorName?: string;
  doctorSpecialization?: string;
  patientEmail?: string;
  patientContactInfo?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason?: string;
  statusChangedBy?: string;
  statusChangedAt?: string;
  patientProfileImageUrl?: string;
  videoRoomId?: string;
  isActive?: boolean;
  appointmentMedicalHistory?: any;
  medicalHistory?: any[];
}

export interface SlotAvailabilityResponse {
  availableSlots: string[];
  onLeave: boolean;
  leaveMessage: string | null;
  leaveEndDate: string | null;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getAvailableSlots(doctorId: number, dateISO: string) {
    return this.http.get<SlotAvailabilityResponse>(
      `${this.baseUrl}/api/appointments/available-slots?doctorId=${doctorId}&date=${dateISO}`
    );
  }

  bookAppointment(payload: CreateAppointmentRequest) {
    return this.http.post<PatientAppointmentItem>(`${this.baseUrl}/api/appointments/patient/book`, payload);
  }

  bookAppointmentWithPayment(payload: {
    doctorId: number;
    appointmentDateTime: string;
    reason?: string;
    amount: number;
    paymentMethod: string;
    upiId?: string;
    cardDetails?: any;
  }) {
    return this.http.post<PatientAppointmentItem>(`${this.baseUrl}/api/appointments/patient/book-with-payment`, payload);
  }

  bookEmergencyAppointment(doctorId: number, reason?: string) {
    const params = new URLSearchParams();
    params.append('doctorId', doctorId.toString());
    if (reason) {
      params.append('reason', reason);
    }

    return this.http.post<PatientAppointmentItem>(
      `${this.baseUrl}/api/appointments/patient/book-emergency?${params.toString()}`,
      {}
    );
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

  getDoctorPaginatedAppointments(page: number = 0, size: number = 10, status: string = 'ALL', range: string = 'UPCOMING', search?: string) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('status', status)
      .set('range', range);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients/paginated`, { params });
  }

  countDoctorAppointments(status: string = 'ALL', range: string = 'UPCOMING', search?: string) {
    let params = new HttpParams()
      .set('status', status)
      .set('range', range);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<number>(`${this.baseUrl}/api/appointments/doctor/my-patients/count`, { params });
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