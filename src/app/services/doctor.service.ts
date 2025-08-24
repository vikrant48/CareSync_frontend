import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Doctor, Education, Certificate, UpdateDoctorRequest, DoctorProfile, CreateExperienceRequest, CreateEducationRequest, CreateCertificateRequest } from '../models/doctor.model';
import { Experience } from '../models/user.model';
import { Appointment, AppointmentStatus, DoctorAppointment } from '../models/appointment.model';
import { MedicalRecord, CreateMedicalRecordRequest, UpdateMedicalRecordRequest, MedicalRecordSummary, TodayAppointmentForRecord } from '../models/medical-record.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private baseUrl = `${environment.apiUrl}/api/doctors`;

  constructor(private http: HttpClient) {}

  // Doctor Profile Management
  getAllDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.baseUrl);
  }

  getDoctorById(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.baseUrl}/${id}`);
  }

  getDoctorByUsername(username: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.baseUrl}/username/${username}`);
  }

  getDoctorProfile(username: string): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${this.baseUrl}/profile/${username}`);
  }

  updateDoctorProfile(username: string, profileData: UpdateDoctorRequest): Observable<Doctor> {
    const url = `${this.baseUrl}/profile/${username}`;
    console.log('🔧 DoctorService.updateDoctorProfile called with:');
    console.log('  - Username:', username);
    console.log('  - URL:', url);
    console.log('  - BaseUrl:', this.baseUrl);
    console.log('  - Environment API URL:', environment.apiUrl);
    console.log('  - Request data:', profileData);
    
    return this.http.put<Doctor>(url, profileData);
  }

  // Experience Management Methods
  addExperience(username: string, experienceRequest: CreateExperienceRequest): Observable<Experience> {
    console.log('DoctorService.addExperience called with:', { username, experienceRequest });
    return this.http.post<Experience>(`${this.baseUrl}/profile/${username}/experiences`, experienceRequest);
  }

  getDoctorExperiences(username: string): Observable<Experience[]> {
    console.log('DoctorService.getDoctorExperiences called with username:', username);
    return this.http.get<Experience[]>(`${this.baseUrl}/profile/${username}/experiences`);
  }

  updateExperience(username: string, experienceId: number, experienceRequest: CreateExperienceRequest): Observable<Experience> {
    console.log('DoctorService.updateExperience called with:', { username, experienceId, experienceRequest });
    return this.http.put<Experience>(`${this.baseUrl}/profile/${username}/experiences/${experienceId}`, experienceRequest);
  }

  deleteExperience(username: string, experienceId: number): Observable<void> {
    console.log('DoctorService.deleteExperience called with:', { username, experienceId });
    return this.http.delete<void>(`${this.baseUrl}/profile/${username}/experiences/${experienceId}`);
  }

  updateDoctorProfileImage(id: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.put(`${this.baseUrl}/${id}/profile-image`, formData);
  }

  getDoctorsBySpecialization(specialization: string): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/specialization/${specialization}`);
  }

  searchDoctors(query: string, filters?: {
    specialization?: string;
    location?: string;
    availability?: string;
    rating?: number;
  }): Observable<Doctor[]> {
    let params = new HttpParams().set('query', query);
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Doctor[]>(`${this.baseUrl}/search`, { params });
  }

  // Education Management Methods
  addEducation(username: string, educationRequest: CreateEducationRequest): Observable<Education> {
    return this.http.post<Education>(`${this.baseUrl}/profile/${username}/educations`, educationRequest);
  }

  getDoctorEducations(username: string): Observable<Education[]> {
    return this.http.get<Education[]>(`${this.baseUrl}/profile/${username}/educations`);
  }

  updateEducation(username: string, educationId: number, educationRequest: CreateEducationRequest): Observable<Education> {
    return this.http.put<Education>(`${this.baseUrl}/profile/${username}/educations/${educationId}`, educationRequest);
  }

  deleteEducation(username: string, educationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profile/${username}/educations/${educationId}`);
  }



  // Certificate Management
  addCertificate(username: string, certificateRequest: CreateCertificateRequest): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.baseUrl}/profile/${username}/certificates`, certificateRequest);
  }

  getDoctorCertificates(username: string): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.baseUrl}/profile/${username}/certificates`);
  }

  updateCertificate(username: string, certificateId: number, certificateRequest: CreateCertificateRequest): Observable<Certificate> {
    return this.http.put<Certificate>(`${this.baseUrl}/profile/${username}/certificates/${certificateId}`, certificateRequest);
  }

  deleteCertificate(username: string, certificateId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profile/${username}/certificates/${certificateId}`);
  }

  // Doctor Availability Management
  getDoctorAvailability(doctorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${doctorId}/availability`);
  }

  updateDoctorAvailability(doctorId: number, availability: any[]): Observable<any[]> {
    return this.http.put<any[]>(`${this.baseUrl}/${doctorId}/availability`, availability);
  }

  setDoctorUnavailable(doctorId: number, date: string, reason?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${doctorId}/unavailable`, { date, reason });
  }

  // Doctor Statistics and Analytics
  getDoctorStatistics(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/statistics`);
  }

  getDoctorPerformance(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/performance`, {
      params: { startDate, endDate }
    });
  }

  getDoctorPatientList(doctorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${doctorId}/patients`);
  }

  // Doctor Reviews and Ratings
  getDoctorReviews(doctorId: number, page?: number, size?: number): Observable<any> {
    let params = new HttpParams();
    if (page !== undefined) params = params.set('page', page.toString());
    if (size !== undefined) params = params.set('size', size.toString());
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/reviews`, { params });
  }

  getDoctorAverageRating(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/average-rating`);
  }

  getDoctorRatingDistribution(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/rating-distribution`);
  }

  // Doctor Schedule Management
  getDoctorSchedule(doctorId: number, date: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/schedule`, {
      params: { date }
    });
  }

  getDoctorWeeklySchedule(doctorId: number, weekStart: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/weekly-schedule`, {
      params: { weekStart }
    });
  }

  updateDoctorSchedule(doctorId: number, scheduleData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${doctorId}/schedule`, scheduleData);
  }

  // Doctor Consultation Management
  getConsultationHistory(doctorId: number, patientId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (patientId) params = params.set('patientId', patientId.toString());
    return this.http.get<any[]>(`${this.baseUrl}/${doctorId}/consultations`, { params });
  }

  getConsultationNotes(consultationId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/consultations/${consultationId}/notes`);
  }

  addConsultationNote(consultationId: number, note: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/consultations/${consultationId}/notes`, { note });
  }

  // Doctor Specializations
  getAllSpecializations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/specializations`);
  }

  getDoctorsByMultipleSpecializations(specializations: string[]): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/specializations`, {
      params: { specializations: specializations.join(',') }
    });
  }

  // Doctor Verification and Approval
  submitForVerification(doctorId: number, verificationData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${doctorId}/verify`, verificationData);
  }

  getVerificationStatus(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/verification-status`);
  }

  // Doctor Preferences and Settings
  getDoctorPreferences(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/preferences`);
  }

  updateDoctorPreferences(doctorId: number, preferences: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${doctorId}/preferences`, preferences);
  }

  // Doctor Notifications
  getDoctorNotifications(doctorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${doctorId}/notifications`);
  }

  markNotificationAsRead(doctorId: number, notificationId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${doctorId}/notifications/${notificationId}/read`, {});
  }

  // Doctor Reports
  generateDoctorReport(doctorId: number, reportType: string, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/reports/${reportType}`, {
      params: { startDate, endDate }
    });
  }

  // Doctor Dashboard Data
  getDoctorDashboardData(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${doctorId}/dashboard`);
  }

  getDoctorRecentActivity(doctorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${doctorId}/recent-activity`);
  }

  // Doctor Search and Filtering
  getDoctorsByLocation(location: string): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/location/${location}`);
  }

  getDoctorsByRating(minRating: number): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/rating/${minRating}`);
  }

  getAvailableDoctors(date: string, time: string): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/available`, {
      params: { date, time }
    });
  }

  // Doctor Appointment Management
  updateAppointmentStatus(appointmentId: number, status: string): Observable<DoctorAppointment> {
    console.log('DoctorService.updateAppointmentStatus called with:', { appointmentId, status });
    return this.http.put<DoctorAppointment>(`${environment.apiUrl}/api/appointments/doctor/${appointmentId}/status`, null, {
      params: { status }
    });
  }

  confirmAppointment(appointmentId: number): Observable<DoctorAppointment> {
    console.log('DoctorService.confirmAppointment called with appointmentId:', appointmentId);
    return this.http.put<DoctorAppointment>(`${environment.apiUrl}/api/appointments/doctor/${appointmentId}/confirm`, {});
  }

  completeAppointment(appointmentId: number): Observable<DoctorAppointment> {
    console.log('DoctorService.completeAppointment called with appointmentId:', appointmentId);
    return this.http.put<DoctorAppointment>(`${environment.apiUrl}/api/appointments/doctor/${appointmentId}/complete`, {});
  }

  cancelAppointmentByDoctor(appointmentId: number): Observable<DoctorAppointment> {
    console.log('DoctorService.cancelAppointmentByDoctor called with appointmentId:', appointmentId);
    return this.http.put<DoctorAppointment>(`${environment.apiUrl}/api/appointments/doctor/${appointmentId}/cancel`, {});
  }

  getDoctorAppointments(doctorId?: number, status?: string, startDate?: string, endDate?: string): Observable<DoctorAppointment[]> {
    console.log('DoctorService.getDoctorAppointments called with:', { doctorId, status, startDate, endDate });
    let params = new HttpParams();
    if (doctorId) params = params.set('doctorId', doctorId.toString());
    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    
    return this.http.get<DoctorAppointment[]>(`${environment.apiUrl}/api/appointments/doctor`, { params });
  }

  getDoctorAppointmentById(appointmentId: number): Observable<DoctorAppointment> {
    console.log('DoctorService.getDoctorAppointmentById called with appointmentId:', appointmentId);
    return this.http.get<DoctorAppointment>(`${environment.apiUrl}/api/appointments/doctor/${appointmentId}`);
  }

  // Medical Records Management
  getTodayConfirmedAppointments(doctorId: number): Observable<TodayAppointmentForRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const params = new HttpParams()
      .set('status', 'CONFIRMED')
      .set('date', today);
    
    return this.http.get<TodayAppointmentForRecord[]>(`${this.baseUrl}/${doctorId}/appointments/today`, { params });
  }

  createMedicalRecord(medicalRecordData: CreateMedicalRecordRequest): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${this.baseUrl}/medical-records`, medicalRecordData);
  }

  updateMedicalRecord(recordId: string, updateData: UpdateMedicalRecordRequest): Observable<MedicalRecord> {
    return this.http.put<MedicalRecord>(`${this.baseUrl}/medical-records/${recordId}`, updateData);
  }

  getMedicalRecord(recordId: string): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${this.baseUrl}/medical-records/${recordId}`);
  }

  getMedicalRecordByAppointment(appointmentId: string): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${this.baseUrl}/medical-records/appointment/${appointmentId}`);
  }

  getDoctorMedicalRecords(doctorId: number, page?: number, size?: number): Observable<MedicalRecordSummary[]> {
    let params = new HttpParams();
    if (page !== undefined) params = params.set('page', page.toString());
    if (size !== undefined) params = params.set('size', size.toString());
    
    return this.http.get<MedicalRecordSummary[]>(`${this.baseUrl}/${doctorId}/medical-records`, { params });
  }

  getPatientMedicalRecords(patientId: string): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${this.baseUrl}/medical-records/patient/${patientId}`);
  }

  deleteMedicalRecord(recordId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/medical-records/${recordId}`);
  }
}

