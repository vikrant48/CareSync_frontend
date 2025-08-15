export enum FileType {
  CERTIFICATE = 'CERTIFICATE',
  PROFILE_IMAGE = 'PROFILE_IMAGE',
  MEDICAL_DOCUMENT = 'MEDICAL_DOCUMENT',
  PRESCRIPTION = 'PRESCRIPTION',
  LAB_REPORT = 'LAB_REPORT',
  X_RAY = 'X_RAY',
  MRI = 'MRI',
  OTHER = 'OTHER'
}

export enum FileStatus {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR',
  DELETED = 'DELETED'
}

export interface FileInfo {
  id: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: FileType;
  mimeType: string;
  size: number;
  status: FileStatus;
  uploadedBy: number;
  uploadedByType: string;
  relatedId?: number;
  relatedType?: string;
  url?: string;
  thumbnailUrl?: string;
  metadata?: FileMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface FileUploadRequest {
  file: File;
  fileType: FileType;
  relatedId?: number;
  relatedType?: string;
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface FileUploadResponse {
  success: boolean;
  fileInfo: FileInfo;
  message: string;
  errors?: string[];
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  fileName: string;
}

export interface FileFilter {
  fileType?: FileType;
  status?: FileStatus;
  uploadedBy?: number;
  uploadedByType?: string;
  relatedId?: number;
  relatedType?: string;
  startDate?: string;
  endDate?: string;
  sizeMin?: number;
  sizeMax?: number;
}

export interface FileStatistics {
  totalFiles: number;
  totalSize: number;
  filesByType: FileTypeStats[];
  filesByStatus: FileStatusStats[];
  recentUploads: FileInfo[];
}

export interface FileTypeStats {
  fileType: FileType;
  count: number;
  totalSize: number;
  percentage: number;
}

export interface FileStatusStats {
  status: FileStatus;
  count: number;
  percentage: number;
}

export interface CertificateUploadRequest {
  file: File;
  doctorId: number;
  certificateName?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingOrganization?: string;
  details?: string;
}

export interface ProfileImageUploadRequest {
  file: File;
  userId: number;
  userType: string;
  cropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MedicalDocumentUploadRequest {
  file: File;
  patientId: number;
  documentType?: string;
  description?: string;
  dateOfDocument?: string;
  tags?: string[];
}

export interface FileDownloadRequest {
  filePath: string;
  fileName?: string;
}

export interface FileViewRequest {
  filePath: string;
  thumbnail?: boolean;
  width?: number;
  height?: number;
}

export interface FileExistsResponse {
  exists: boolean;
  fileInfo?: FileInfo;
}

export interface FileSizeResponse {
  size: number;
  formattedSize: string;
}

export interface FileUrlResponse {
  url: string;
  expiresAt?: string;
}

export interface FileCleanupResponse {
  deletedFiles: number;
  freedSpace: number;
  errors: string[];
}
