import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  MedicalHistory,
  MedicalHistoryCreate,
  MedicalHistoryUpdate,
  MedicalHistoryFilter,
  MedicalHistorySummary
} from '../models/medical-history.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
  private baseUrl = `${environment.apiUrl}/api/medical-history`;

  constructor(private http: HttpClient) {}

  // Medical History CRUD Operations
  createMedicalHistory(medicalHistory: MedicalHistoryCreate): Observable<MedicalHistory> {
    return this.http.post<MedicalHistory>(this.baseUrl, medicalHistory);
  }

  getMedicalHistoryById(id: number): Observable<MedicalHistory> {
    return this.http.get<MedicalHistory>(`${this.baseUrl}/${id}`);
  }

  updateMedicalHistory(id: number, medicalHistory: MedicalHistoryUpdate): Observable<MedicalHistory> {
    return this.http.put<MedicalHistory>(`${this.baseUrl}/${id}`, medicalHistory);
  }

  deleteMedicalHistory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Patient Medical History
  getPatientMedicalHistory(patientId: number): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/patient/${patientId}`);
  }

  getRecentMedicalHistory(patientId: number, limit?: number): Observable<MedicalHistory[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/patient/${patientId}/recent`, { params });
  }

  getMedicalHistoryByDateRange(patientId: number, startDate: string, endDate: string): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/patient/${patientId}/by-date-range`, {
      params: { startDate, endDate }
    });
  }

  getMedicalHistorySummary(patientId: number): Observable<MedicalHistorySummary> {
    return this.http.get<MedicalHistorySummary>(`${this.baseUrl}/patient/${patientId}/summary`);
  }

  getMedicalHistoryByDiagnosis(patientId: number, diagnosis: string): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/patient/${patientId}/diagnosis/${diagnosis}`);
  }

  // Medical History Search and Filtering
  searchMedicalHistory(query: string, filter?: MedicalHistoryFilter): Observable<MedicalHistory[]> {
    let params = new HttpParams().set('query', query);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof MedicalHistoryFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/search`, { params });
  }

  getMedicalHistoryBySymptoms(patientId: number, symptoms: string[]): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/patient/${patientId}/symptoms`, {
      params: { symptoms: symptoms.join(',') }
    });
  }

  getMedicalHistoryByTreatment(patientId: number, treatment: string): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/patient/${patientId}/treatment/${treatment}`);
  }

  // Medical History Analytics
  getMedicalHistoryStatistics(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/patient/${patientId}/statistics`);
  }

  getMedicalHistoryTrends(patientId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/patient/${patientId}/trends`, {
      params: { startDate, endDate }
    });
  }

  getCommonDiagnoses(patientId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/patient/${patientId}/common-diagnoses`);
  }

  getCommonSymptoms(patientId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/patient/${patientId}/common-symptoms`);
  }

  getCommonTreatments(patientId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/patient/${patientId}/common-treatments`);
  }

  // Medical History Timeline
  getMedicalHistoryTimeline(patientId: number, startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<any[]>(`${this.baseUrl}/patient/${patientId}/timeline`, { params });
  }

  // Medical History Categories
  getMedicalHistoryCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categories`);
  }

  getMedicalHistoryByCategory(patientId: number, category: string): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/patient/${patientId}/category/${category}`);
  }

  // Medical History Attachments
  uploadMedicalHistoryAttachment(historyId: number, file: File, description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return this.http.post(`${this.baseUrl}/${historyId}/attachments`, formData);
  }

  getMedicalHistoryAttachments(historyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${historyId}/attachments`);
  }

  deleteMedicalHistoryAttachment(historyId: number, attachmentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${historyId}/attachments/${attachmentId}`);
  }

  // Medical History Notes
  addMedicalHistoryNote(historyId: number, note: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${historyId}/notes`, { note });
  }

  getMedicalHistoryNotes(historyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${historyId}/notes`);
  }

  updateMedicalHistoryNote(historyId: number, noteId: number, note: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${historyId}/notes/${noteId}`, { note });
  }

  deleteMedicalHistoryNote(historyId: number, noteId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${historyId}/notes/${noteId}`);
  }

  // Medical History Follow-ups
  scheduleFollowUp(historyId: number, followUpData: {
    followUpDate: string;
    reason: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/${historyId}/follow-up`, followUpData);
  }

  getFollowUps(historyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${historyId}/follow-ups`);
  }

  // Medical History Templates
  getMedicalHistoryTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/templates`);
  }

  createMedicalHistoryFromTemplate(templateId: number, patientId: number, data: any): Observable<MedicalHistory> {
    return this.http.post<MedicalHistory>(`${this.baseUrl}/templates/${templateId}/create`, {
      patientId,
      ...data
    });
  }

  // Medical History Export
  exportMedicalHistory(patientId: number, format: 'PDF' | 'EXCEL' | 'CSV', startDate?: string, endDate?: string): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get(`${this.baseUrl}/patient/${patientId}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Medical History Bulk Operations
  bulkUpdateMedicalHistory(historyIds: number[], updates: Partial<MedicalHistoryUpdate>): Observable<MedicalHistory[]> {
    return this.http.put<MedicalHistory[]>(`${this.baseUrl}/bulk-update`, {
      historyIds,
      updates
    });
  }

  bulkDeleteMedicalHistory(historyIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-delete`, { historyIds });
  }

  // Medical History Validation
  validateMedicalHistory(medicalHistory: MedicalHistoryCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/validate`, medicalHistory);
  }

  // Medical History Duplicates
  checkForDuplicates(patientId: number, medicalHistory: MedicalHistoryCreate): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/patient/${patientId}/check-duplicates`, medicalHistory);
  }

  // Medical History Merge
  mergeMedicalHistory(primaryId: number, secondaryId: number): Observable<MedicalHistory> {
    return this.http.post<MedicalHistory>(`${this.baseUrl}/merge`, {
      primaryId,
      secondaryId
    });
  }

  // Medical History Archive
  archiveMedicalHistory(historyId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${historyId}/archive`, {});
  }

  getArchivedMedicalHistory(patientId: number): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.baseUrl}/patient/${patientId}/archived`);
  }

  restoreMedicalHistory(historyId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${historyId}/restore`, {});
  }
}
