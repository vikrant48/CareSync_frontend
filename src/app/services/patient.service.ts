import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, PatientProfileUpdate } from '../models/user.model';
import { MedicalHistory, MedicalHistoryCreate, MedicalHistoryUpdate, MedicalHistoryFilter, MedicalHistorySummary } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private baseUrl = `${environment.apiUrl}/api/patients`;

  constructor(private http: HttpClient) {}

  // Patient Profile Management
  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.baseUrl);
  }

  getPatientById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/${id}`);
  }

  getPatientByUsername(username: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/username/${username}`);
  }

  getMyProfile(username: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/profile/${username}`);
  }

  updatePatientProfile(id: number, profileData: PatientProfileUpdate): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}/profile`, profileData);
  }

  updatePatientIllnessDetails(id: number, illnessDetails: string): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}/illness-details`, {}, {
      params: { illnessDetails }
    });
  }

  updatePatientContactInfo(id: number, contactInfo: string): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}/contact-info`, {}, {
      params: { contactInfo }
    });
  }

  // Patient Search and Filtering
  searchPatientsByIllness(illness: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/illness/${illness}`);
  }

  searchPatients(query: string, filters?: {
    ageRange?: string;
    location?: string;
    illness?: string;
    bloodType?: string;
  }): Observable<Patient[]> {
    let params = new HttpParams().set('query', query);
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Patient[]>(`${this.baseUrl}/search`, { params });
  }

  getPatientsByBloodType(bloodType: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/blood-type/${bloodType}`);
  }

  getPatientsByAgeRange(minAge: number, maxAge: number): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/age-range`, {
      params: { minAge: minAge.toString(), maxAge: maxAge.toString() }
    });
  }

  // Medical History Management
  addMedicalHistory(patientId: number, medicalHistory: MedicalHistoryCreate): Observable<MedicalHistory> {
    return this.http.post<MedicalHistory>(`${this.baseUrl}/${patientId}/medical-history`, medicalHistory);
  }

  getPatientMedicalHistory(patientId: number): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/${patientId}/medical-history`);
  }

  getMedicalHistoryByDateRange(patientId: number, startDate: string, endDate: string): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/${patientId}/medical-history/date-range`, {
      params: { startDate, endDate }
    });
  }

  getRecentMedicalHistory(patientId: number, limit?: number): Observable<MedicalHistory[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/${patientId}/medical-history/recent`, { params });
  }

  getMedicalHistorySummary(patientId: number): Observable<MedicalHistorySummary> {
    return this.http.get<MedicalHistorySummary>(`${this.baseUrl}/${patientId}/medical-history/summary`);
  }

  updateMedicalHistory(historyId: number, medicalHistory: MedicalHistoryUpdate): Observable<MedicalHistory> {
    return this.http.put<MedicalHistory>(`${this.baseUrl}/medical-history/${historyId}`, medicalHistory);
  }

  deleteMedicalHistory(historyId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/medical-history/${historyId}`);
  }

  getMedicalHistoryByDiagnosis(patientId: number, diagnosis: string): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/${patientId}/medical-history/diagnosis/${diagnosis}`);
  }

  // Patient Health Analytics
  getPatientHealthTrends(patientId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${patientId}/health-trends`, {
      params: { startDate, endDate }
    });
  }

  getPatientVitalSigns(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/vital-signs`);
  }

  addVitalSigns(patientId: number, vitalSigns: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${patientId}/vital-signs`, vitalSigns);
  }

  getPatientAllergies(patientId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${patientId}/allergies`);
  }

  updatePatientAllergies(patientId: number, allergies: string[]): Observable<string[]> {
    return this.http.put<string[]>(`${this.baseUrl}/${patientId}/allergies`, allergies);
  }

  getPatientMedications(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/medications`);
  }

  addPatientMedication(patientId: number, medication: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${patientId}/medications`, medication);
  }

  // Patient Appointments
  getPatientAppointments(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/appointments`);
  }

  getPatientUpcomingAppointments(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/appointments/upcoming`);
  }

  getPatientPastAppointments(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/appointments/past`);
  }

  // Patient Emergency Contacts
  getPatientEmergencyContacts(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/emergency-contacts`);
  }

  addEmergencyContact(patientId: number, contact: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${patientId}/emergency-contacts`, contact);
  }

  updateEmergencyContact(patientId: number, contactId: number, contact: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${patientId}/emergency-contacts/${contactId}`, contact);
  }

  deleteEmergencyContact(patientId: number, contactId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${patientId}/emergency-contacts/${contactId}`);
  }

  // Patient Insurance Information
  getPatientInsurance(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${patientId}/insurance`);
  }

  updatePatientInsurance(patientId: number, insurance: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${patientId}/insurance`, insurance);
  }

  // Patient Documents
  getPatientDocuments(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/documents`);
  }

  uploadPatientDocument(patientId: number, document: File, documentType: string): Observable<any> {
    const formData = new FormData();
    formData.append('document', document);
    formData.append('documentType', documentType);
    return this.http.post(`${this.baseUrl}/${patientId}/documents`, formData);
  }

  deletePatientDocument(patientId: number, documentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${patientId}/documents/${documentId}`);
  }

  // Patient Preferences
  getPatientPreferences(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${patientId}/preferences`);
  }

  updatePatientPreferences(patientId: number, preferences: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${patientId}/preferences`, preferences);
  }

  // Patient Notifications
  getPatientNotifications(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/notifications`);
  }

  markNotificationAsRead(patientId: number, notificationId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${patientId}/notifications/${notificationId}/read`, {});
  }

  // Patient Dashboard Data
  getPatientDashboardData(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${patientId}/dashboard`);
  }

  getPatientRecentActivity(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/recent-activity`);
  }

  // Patient Statistics
  getPatientStatistics(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${patientId}/statistics`);
  }

  getPatientVisitHistory(patientId: number, startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${patientId}/visit-history`, {
      params: { startDate, endDate }
    });
  }

  // Patient Family History
  getPatientFamilyHistory(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${patientId}/family-history`);
  }

  updatePatientFamilyHistory(patientId: number, familyHistory: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${patientId}/family-history`, familyHistory);
  }

  // Patient Lifestyle Information
  getPatientLifestyle(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${patientId}/lifestyle`);
  }

  updatePatientLifestyle(patientId: number, lifestyle: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${patientId}/lifestyle`, lifestyle);
  }

  // Patient Reports
  generatePatientReport(patientId: number, reportType: string, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${patientId}/reports/${reportType}`, {
      params: { startDate, endDate }
    });
  }

  // Patient Export
  exportPatientData(patientId: number, format: 'PDF' | 'EXCEL' | 'CSV'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${patientId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }
}
