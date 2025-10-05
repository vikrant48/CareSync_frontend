import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Minimal request/response typings to aid usage
export interface UpdateDoctorRequest {
  firstName?: string;
  lastName?: string;
  specialization?: string;
  contactInfo?: string;
  profileImageUrl?: string;
  email?: string;
  isActive?: boolean;
}

export interface CreateExperienceRequest {
  hospitalName: string;
  position: string;
  yearsOfService: number;
  details?: string;
}

export interface CreateEducationRequest {
  degree: string;
  institution: string;
  yearOfCompletion: number;
  details?: string;
}

export interface CreateCertificateRequest {
  name: string;
  url: string; // required by backend DTO
  details?: string;
  issuingOrganization?: string;
  issueDate?: string; // ISO date string
  expiryDate?: string; // ISO date string
  credentialId?: string;
  credentialUrl?: string;
}

export interface DocumentItem {
  id: number;
  originalFilename: string;
  filePath: string; // Cloudinary URL
  fileSize: number;
  contentType: string;
  documentType: string;
  uploadDate: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorProfileService {
  private baseUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  // Doctor profile
  getProfile(username: string) {
    return this.http.get<any>(`${this.baseUrl}/api/doctors/profile/${username}`);
  }

  updateProfile(username: string, payload: UpdateDoctorRequest) {
    return this.http.put<any>(`${this.baseUrl}/api/doctors/profile/${username}`, payload);
  }

  // Profile image upload (auto-updates doctor)
  uploadProfileImage(file: File, doctorId: number | string, description?: string) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doctorId', String(doctorId));
    if (description) fd.append('description', description);
    return this.http.post<any>(`${this.baseUrl}/api/files/upload/profile-image/doctor`, fd);
  }

  // Experiences
  getExperiences(username: string) {
    return this.http.get<any[]>(`${this.baseUrl}/api/doctors/profile/${username}/experiences`);
  }

  addExperience(username: string, payload: CreateExperienceRequest) {
    return this.http.post<any>(`${this.baseUrl}/api/doctors/profile/${username}/experiences`, payload);
  }

  updateExperience(username: string, experienceId: number, payload: CreateExperienceRequest) {
    return this.http.put<any>(`${this.baseUrl}/api/doctors/profile/${username}/experiences/${experienceId}`, payload);
  }

  deleteExperience(username: string, experienceId: number) {
    return this.http.delete(`${this.baseUrl}/api/doctors/profile/${username}/experiences/${experienceId}`);
  }

  // Educations
  getEducations(username: string) {
    return this.http.get<any[]>(`${this.baseUrl}/api/doctors/profile/${username}/educations`);
  }

  addEducation(username: string, payload: CreateEducationRequest) {
    return this.http.post<any>(`${this.baseUrl}/api/doctors/profile/${username}/educations`, payload);
  }

  updateEducation(username: string, educationId: number, payload: CreateEducationRequest) {
    return this.http.put<any>(`${this.baseUrl}/api/doctors/profile/${username}/educations/${educationId}`, payload);
  }

  deleteEducation(username: string, educationId: number) {
    return this.http.delete(`${this.baseUrl}/api/doctors/profile/${username}/educations/${educationId}`);
  }

  // Certificates
  getCertificates(username: string) {
    return this.http.get<any[]>(`${this.baseUrl}/api/doctors/profile/${username}/certificates`);
  }

  // Upload certificate file; optionally pass certificateId to replace
  uploadCertificateFile(file: File, doctorId: number | string, description?: string, certificateId?: number) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doctorId', String(doctorId));
    if (description) fd.append('description', description);
    if (certificateId != null) fd.append('certificateId', String(certificateId));
    return this.http.post<any>(`${this.baseUrl}/api/files/upload/certificate`, fd);
  }

  updateCertificate(username: string, certificateId: number, payload: CreateCertificateRequest) {
    return this.http.put<any>(`${this.baseUrl}/api/doctors/profile/${username}/certificates/${certificateId}`, payload);
  }

  deleteCertificate(username: string, certificateId: number) {
    return this.http.delete(`${this.baseUrl}/api/doctors/profile/${username}/certificates/${certificateId}`);
  }

  // Documents
  getDocumentsByDoctor(doctorId: number | string) {
    return this.http.get<DocumentItem[]>(`${this.baseUrl}/api/files/doctor/${doctorId}`);
  }

  deleteDocument(documentId: number) {
    return this.http.delete(`${this.baseUrl}/api/files/${documentId}`);
  }

  updateDocumentDescription(documentId: number, description: string) {
    // backend expects request param
    return this.http.put<any>(`${this.baseUrl}/api/files/${documentId}/description?description=${encodeURIComponent(description)}`, {});
  }
}