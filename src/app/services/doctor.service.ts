import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Doctor, Education, Experience, Certificate, DoctorProfileUpdate } from '../models/user.model';

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
    return this.http.get<Doctor>(`${this.baseUrl}/profile/${username}`);
  }

  updateDoctorProfile(id: number, profileData: DoctorProfileUpdate): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.baseUrl}/${id}/profile`, profileData);
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

  // Education Management
  addEducation(doctorId: number, education: Omit<Education, 'id'>): Observable<Education> {
    return this.http.post<Education>(`${this.baseUrl}/${doctorId}/educations`, education);
  }

  getEducations(doctorId: number): Observable<Education[]> {
    return this.http.get<Education[]>(`${this.baseUrl}/${doctorId}/educations`);
  }

  updateEducation(educationId: number, education: Omit<Education, 'id'>): Observable<Education> {
    return this.http.put<Education>(`${this.baseUrl}/educations/${educationId}`, education);
  }

  deleteEducation(educationId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/educations/${educationId}`);
  }

  // Experience Management
  addExperience(doctorId: number, experience: Omit<Experience, 'id'>): Observable<Experience> {
    return this.http.post<Experience>(`${this.baseUrl}/${doctorId}/experiences`, experience);
  }

  getExperiences(doctorId: number): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${this.baseUrl}/${doctorId}/experiences`);
  }

  updateExperience(experienceId: number, experience: Omit<Experience, 'id'>): Observable<Experience> {
    return this.http.put<Experience>(`${this.baseUrl}/experiences/${experienceId}`, experience);
  }

  deleteExperience(experienceId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/experiences/${experienceId}`);
  }

  // Certificate Management
  addCertificate(doctorId: number, certificate: Omit<Certificate, 'id'>): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.baseUrl}/${doctorId}/certificates`, certificate);
  }

  getCertificates(doctorId: number): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.baseUrl}/${doctorId}/certificates`);
  }

  updateCertificate(certificateId: number, certificate: Omit<Certificate, 'id'>): Observable<Certificate> {
    return this.http.put<Certificate>(`${this.baseUrl}/certificates/${certificateId}`, certificate);
  }

  deleteCertificate(certificateId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/certificates/${certificateId}`);
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
}

