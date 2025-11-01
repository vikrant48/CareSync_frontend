import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO date string
  contactInfo?: string;
  illnessDetails?: string;
  email?: string;
  isActive?: boolean;
  gender?: string;
}

export interface PatientDto {
  id: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  contactInfo?: string;
  illnessDetails?: string;
  email?: string;
  isActive?: boolean;
  username?: string;
  profileImageUrl?: string;
  gender?: string;
}

export interface MedicalHistoryItem {
  id: number;
  visitDate: string; // ISO date
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  medicine?: string;
  doses?: string;
  notes?: string;
}

export interface MedicalHistoryWithDoctorItem {
  id: number;
  visitDate: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  doctorName: string;
  doctorSpecialization?: string;
  doctorContactInfo?: string;
  appointmentId?: number;
  appointmentDate?: string;
}

export interface PatientDocumentItem {
  id: number;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  documentType: string;
  uploadDate: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientProfileService {
  private baseUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  /** Get all patients (for doctors only) */
  getAllPatients() {
    return this.http.get<PatientDto[]>(`${this.baseUrl}/api/patients`);
  }

  getProfile(username: string) {
    return this.http.get<PatientDto>(`${this.baseUrl}/api/patients/profile/${username}`);
  }

  updateProfile(id: number | string, payload: UpdatePatientRequest) {
    return this.http.put<PatientDto>(`${this.baseUrl}/api/patients/${id}/profile`, payload);
  }

  getMedicalHistory(patientId: number | string) {
    return this.http.get<MedicalHistoryItem[]>(`${this.baseUrl}/api/patients/${patientId}/medical-history`);
  }

  /** Upload profile image via unified files endpoint (auto-updates patient profile) */
  uploadProfileImage(patientId: number | string, file: File, description?: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('patientId', String(patientId));
    if (description) form.append('description', description);
    return this.http.post<any>(`${this.baseUrl}/api/files/upload/profile-image/patient`, form);
  }

  /** Update patient profile image URL by patient id */
  updateProfileImage(id: number | string, imageUrl: string) {
    return this.http.put<PatientDto>(`${this.baseUrl}/api/patients/${id}/profile-image?imageUrl=${encodeURIComponent(imageUrl)}`, {});
  }

  /** Doctor: fetch complete patient data (basic info, medical history, documents) */
  getCompleteData(patientId: number | string) {
    return this.http.get<{ patient: PatientDto; medicalHistory: MedicalHistoryItem[]; documents: any[] }>(
      `${this.baseUrl}/api/patients/${patientId}/complete-data`
    );
  }

  /** Doctor: fetch medical history records with doctor info */
  getMedicalHistoryWithDoctor(patientId: number | string) {
    return this.http.get<MedicalHistoryWithDoctorItem[]>(
      `${this.baseUrl}/api/medical-history/patient/${patientId}/with-doctor`
    );
  }

  /** Get a single medical history detail by id */
  getMedicalHistoryDetail(historyId: number | string) {
    return this.http.get<MedicalHistoryItem>(`${this.baseUrl}/api/medical-history/${historyId}`);
  }

  /** Doctor: add medical history for a patient (explicit doctor association) */
  addMedicalHistoryWithDoctor(
    patientId: number | string,
    doctorId: number | string,
    payload: Partial<MedicalHistoryItem>
  ) {
    const body = { patientId: Number(patientId), doctorId: Number(doctorId), ...payload } as any;
    return this.http.post(`${this.baseUrl}/api/medical-history/with-doctor`, body);
  }

  /** Patient: fetch own uploaded documents (prescriptions, lab reports, etc.) */
  getDocumentsByPatient(patientId: number | string) {
    return this.http.get<PatientDocumentItem[]>(`${this.baseUrl}/api/files/patient/${patientId}`);
  }
}