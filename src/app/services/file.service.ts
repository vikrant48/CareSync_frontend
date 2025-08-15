import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private baseUrl = `${environment.apiUrl}/api/files`;

  constructor(private http: HttpClient) { }

  // Upload Methods
  uploadCertificate(file: File, doctorId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doctorId', doctorId.toString());
    return this.http.post(`${this.baseUrl}/upload/certificate`, formData);
  }

  uploadProfileImage(file: File, userId: number, userType: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());
    formData.append('userType', userType);
    return this.http.post(`${this.baseUrl}/upload/profile-image`, formData);
  }

  uploadMedicalDocument(file: File, patientId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId.toString());
    return this.http.post(`${this.baseUrl}/upload/medical-document`, formData);
  }

  // File Operations
  downloadFile(filePath: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${filePath}`, { responseType: 'blob' });
  }

  viewFile(filePath: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/view/${filePath}`);
  }

  deleteFile(filePath: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${filePath}`);
  }

  checkFileExists(filePath: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/exists/${filePath}`);
  }

  getFileSize(filePath: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/size/${filePath}`);
  }

  getFileUrl(filePath: string): Observable<string> {
    return this.http.get<string>(`${this.baseUrl}/url/${filePath}`);
  }

  // Maintenance
  cleanupOrphanedFiles(): Observable<any> {
    return this.http.post(`${this.baseUrl}/cleanup`, {});
  }
}
