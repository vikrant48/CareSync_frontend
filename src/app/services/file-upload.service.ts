import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  FileInfo,
  FileUploadRequest,
  FileUploadResponse,
  FileUploadProgress,
  FileFilter,
  FileStatistics,
  CertificateUploadRequest,
  ProfileImageUploadRequest,
  MedicalDocumentUploadRequest,
  FileDownloadRequest,
  FileViewRequest,
  FileExistsResponse,
  FileSizeResponse,
  FileUrlResponse,
  FileCleanupResponse,
  FileType
} from '../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private baseUrl = `${environment.apiUrl}/api/files`;

  constructor(private http: HttpClient) {}

  // File Upload Operations
  uploadFile(uploadRequest: FileUploadRequest): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', uploadRequest.file);
    formData.append('fileType', uploadRequest.fileType);
    if (uploadRequest.relatedId) formData.append('relatedId', uploadRequest.relatedId.toString());
    if (uploadRequest.relatedType) formData.append('relatedType', uploadRequest.relatedType);
    if (uploadRequest.description) formData.append('description', uploadRequest.description);
    if (uploadRequest.tags) formData.append('tags', uploadRequest.tags.join(','));
    if (uploadRequest.customFields) {
      Object.keys(uploadRequest.customFields).forEach(key => {
        formData.append(`customFields.${key}`, uploadRequest.customFields[key]);
      });
    }

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  uploadFileWithProgress(uploadRequest: FileUploadRequest): Observable<FileUploadProgress> {
    const formData = new FormData();
    formData.append('file', uploadRequest.file);
    formData.append('fileType', uploadRequest.fileType);
    if (uploadRequest.relatedId) formData.append('relatedId', uploadRequest.relatedId.toString());
    if (uploadRequest.relatedType) formData.append('relatedType', uploadRequest.relatedType);
    if (uploadRequest.description) formData.append('description', uploadRequest.description);
    if (uploadRequest.tags) formData.append('tags', uploadRequest.tags.join(','));
    if (uploadRequest.customFields) {
      Object.keys(uploadRequest.customFields).forEach(key => {
        formData.append(`customFields.${key}`, uploadRequest.customFields[key]);
      });
    }

    return this.http.post(`${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = Math.round(100 * event.loaded / event.total);
            return {
              loaded: event.loaded,
              total: event.total,
              percentage: progress,
              fileName: uploadRequest.file.name
            } as FileUploadProgress;
          case HttpEventType.Response:
            return {
              loaded: event.total,
              total: event.total,
              percentage: 100,
              fileName: uploadRequest.file.name
            } as FileUploadProgress;
          default:
            return {
              loaded: 0,
              total: 0,
              percentage: 0,
              fileName: uploadRequest.file.name
            } as FileUploadProgress;
        }
      })
    );
  }

  // Certificate Upload
  uploadCertificate(uploadRequest: CertificateUploadRequest): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', uploadRequest.file);
    formData.append('doctorId', uploadRequest.doctorId.toString());
    if (uploadRequest.certificateName) formData.append('certificateName', uploadRequest.certificateName);
    if (uploadRequest.issueDate) formData.append('issueDate', uploadRequest.issueDate);
    if (uploadRequest.expiryDate) formData.append('expiryDate', uploadRequest.expiryDate);
    if (uploadRequest.issuingOrganization) formData.append('issuingOrganization', uploadRequest.issuingOrganization);
    if (uploadRequest.details) formData.append('details', uploadRequest.details);

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload/certificate`, formData);
  }

  // Profile Image Upload
  uploadProfileImage(uploadRequest: ProfileImageUploadRequest): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', uploadRequest.file);
    formData.append('userId', uploadRequest.userId.toString());
    formData.append('userType', uploadRequest.userType);
    if (uploadRequest.cropData) {
      formData.append('cropData', JSON.stringify(uploadRequest.cropData));
    }

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload/profile-image`, formData);
  }

  // Medical Document Upload
  uploadMedicalDocument(uploadRequest: MedicalDocumentUploadRequest): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', uploadRequest.file);
    formData.append('patientId', uploadRequest.patientId.toString());
    if (uploadRequest.documentType) formData.append('documentType', uploadRequest.documentType);
    if (uploadRequest.description) formData.append('description', uploadRequest.description);
    if (uploadRequest.dateOfDocument) formData.append('dateOfDocument', uploadRequest.dateOfDocument);
    if (uploadRequest.tags) formData.append('tags', uploadRequest.tags.join(','));

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload/medical-document`, formData);
  }

  // File Download and View
  downloadFile(filePath: string, fileName?: string): Observable<Blob> {
    let params = new HttpParams();
    if (fileName) params = params.set('fileName', fileName);
    return this.http.get(`${this.baseUrl}/download/${filePath}`, {
      params,
      responseType: 'blob'
    });
  }

  viewFile(filePath: string, thumbnail?: boolean, width?: number, height?: number): Observable<Blob> {
    let params = new HttpParams();
    if (thumbnail) params = params.set('thumbnail', 'true');
    if (width) params = params.set('width', width.toString());
    if (height) params = params.set('height', height.toString());
    return this.http.get(`${this.baseUrl}/view/${filePath}`, {
      params,
      responseType: 'blob'
    });
  }

  // File Information
  getFileInfo(filePath: string): Observable<FileInfo> {
    return this.http.get<FileInfo>(`${this.baseUrl}/info/${filePath}`);
  }

  checkFileExists(filePath: string): Observable<FileExistsResponse> {
    return this.http.get<FileExistsResponse>(`${this.baseUrl}/exists/${filePath}`);
  }

  getFileSize(filePath: string): Observable<FileSizeResponse> {
    return this.http.get<FileSizeResponse>(`${this.baseUrl}/size/${filePath}`);
  }

  getFileUrl(filePath: string): Observable<FileUrlResponse> {
    return this.http.get<FileUrlResponse>(`${this.baseUrl}/url/${filePath}`);
  }

  // File Management
  deleteFile(filePath: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${filePath}`);
  }

  updateFileInfo(filePath: string, fileInfo: Partial<FileInfo>): Observable<FileInfo> {
    return this.http.put<FileInfo>(`${this.baseUrl}/${filePath}`, fileInfo);
  }

  // File Search and Filtering
  getFiles(filter?: FileFilter): Observable<FileInfo[]> {
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof FileFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<FileInfo[]>(`${this.baseUrl}/list`, { params });
  }

  searchFiles(query: string, filter?: FileFilter): Observable<FileInfo[]> {
    let params = new HttpParams().set('query', query);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof FileFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<FileInfo[]>(`${this.baseUrl}/search`, { params });
  }

  getFilesByType(fileType: FileType): Observable<FileInfo[]> {
    return this.http.get<FileInfo[]>(`${this.baseUrl}/type/${fileType}`);
  }

  getFilesByUser(userId: number, userType: string): Observable<FileInfo[]> {
    return this.http.get<FileInfo[]>(`${this.baseUrl}/user/${userId}/${userType}`);
  }

  // File Statistics
  getFileStatistics(): Observable<FileStatistics> {
    return this.http.get<FileStatistics>(`${this.baseUrl}/statistics`);
  }

  getFileStatisticsByType(fileType: FileType): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics/type/${fileType}`);
  }

  getFileStatisticsByUser(userId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics/user/${userId}`);
  }

  // File Cleanup
  cleanupOrphanedFiles(): Observable<FileCleanupResponse> {
    return this.http.post<FileCleanupResponse>(`${this.baseUrl}/cleanup`, {});
  }

  // File Validation
  validateFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/validate`, formData);
  }

  // File Processing
  processFile(filePath: string, processingOptions: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/process/${filePath}`, processingOptions);
  }

  getFileProcessingStatus(filePath: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/process/${filePath}/status`);
  }

  // File Conversion
  convertFile(filePath: string, targetFormat: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/convert/${filePath}`, { targetFormat }, {
      responseType: 'blob'
    });
  }

  // File Compression
  compressFile(filePath: string, compressionLevel: number): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/compress/${filePath}`, { compressionLevel }, {
      responseType: 'blob'
    });
  }

  // File Encryption
  encryptFile(filePath: string, password: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/encrypt/${filePath}`, { password }, {
      responseType: 'blob'
    });
  }

  decryptFile(filePath: string, password: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/decrypt/${filePath}`, { password }, {
      responseType: 'blob'
    });
  }

  // File Sharing
  shareFile(filePath: string, shareData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/share/${filePath}`, shareData);
  }

  getSharedFiles(): Observable<FileInfo[]> {
    return this.http.get<FileInfo[]>(`${this.baseUrl}/shared`);
  }

  revokeFileAccess(filePath: string, userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/share/${filePath}/user/${userId}`);
  }

  // File Versioning
  getFileVersions(filePath: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/versions/${filePath}`);
  }

  createFileVersion(filePath: string, file: File, description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return this.http.post(`${this.baseUrl}/versions/${filePath}`, formData);
  }

  restoreFileVersion(filePath: string, versionId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/versions/${filePath}/restore/${versionId}`, {});
  }

  // File Backup
  backupFile(filePath: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/backup/${filePath}`, {});
  }

  restoreFileFromBackup(filePath: string, backupId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/backup/${filePath}/restore/${backupId}`, {});
  }

  getFileBackups(filePath: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/backup/${filePath}`);
  }

  // File Export
  exportFileList(format: 'PDF' | 'EXCEL' | 'CSV', filter?: FileFilter): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof FileFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // File Bulk Operations
  bulkUploadFiles(files: FileUploadRequest[]): Observable<FileUploadResponse[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file.file);
      formData.append(`fileTypes[${index}]`, file.fileType);
      if (file.relatedId) formData.append(`relatedIds[${index}]`, file.relatedId.toString());
      if (file.relatedType) formData.append(`relatedTypes[${index}]`, file.relatedType);
      if (file.description) formData.append(`descriptions[${index}]`, file.description);
      if (file.tags) formData.append(`tags[${index}]`, file.tags.join(','));
    });
    return this.http.post<FileUploadResponse[]>(`${this.baseUrl}/bulk-upload`, formData);
  }

  bulkDeleteFiles(filePaths: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-delete`, { filePaths });
  }

  bulkDownloadFiles(filePaths: string[]): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/bulk-download`, { filePaths }, {
      responseType: 'blob'
    });
  }

  // File Configuration
  getFileConfiguration(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/config`);
  }

  updateFileConfiguration(config: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/config`, config);
  }

  // File Monitoring
  getFileUploadQueue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/queue`);
  }

  getFileProcessingQueue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/processing-queue`);
  }

  cancelFileProcessing(filePath: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/processing-queue/${filePath}`);
  }

  // File API
  getFileApiEndpoints(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api-endpoints`);
  }

  testFileApiEndpoint(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/test-api/${endpoint}`, data);
  }
}
