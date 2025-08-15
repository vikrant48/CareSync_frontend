import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { Subject, takeUntil } from 'rxjs';

import { FileUploadService } from '../../services/file-upload.service';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">File Upload</h1>
          <p class="text-gray-600">Upload and manage your files securely</p>
        </div>

        <!-- Upload Form -->
        <mat-card class="shadow-lg mb-8">
          <mat-card-header>
            <mat-card-title>Upload Files</mat-card-title>
            <mat-card-subtitle>Select files to upload to the system</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="p-6">
            <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <!-- File Type -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>File Type</mat-label>
                <mat-select formControlName="fileType" required>
                  <mat-option value="MEDICAL_RECORD">Medical Record</mat-option>
                  <mat-option value="PRESCRIPTION">Prescription</mat-option>
                  <mat-option value="LAB_RESULT">Lab Result</mat-option>
                  <mat-option value="IMAGING">Imaging</mat-option>
                  <mat-option value="CONSENT_FORM">Consent Form</mat-option>
                  <mat-option value="OTHER">Other</mat-option>
                </mat-select>
                <mat-icon matSuffix>category</mat-icon>
                <mat-error *ngIf="uploadForm.get('fileType')?.hasError('required')">
                  File type is required
                </mat-error>
              </mat-form-field>

              <!-- Description -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Description</mat-label>
                <textarea 
                  matInput 
                  formControlName="description" 
                  placeholder="Enter file description"
                  rows="3"
                ></textarea>
                <mat-icon matSuffix>description</mat-icon>
                <mat-error *ngIf="uploadForm.get('description')?.hasError('required')">
                  Description is required
                </mat-error>
              </mat-form-field>

              <!-- Tags -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Tags</mat-label>
                <input 
                  matInput 
                  formControlName="tags" 
                  placeholder="Enter tags separated by commas"
                >
                <mat-icon matSuffix>label</mat-icon>
                <mat-hint>Separate tags with commas (e.g., urgent, follow-up, review)</mat-hint>
              </mat-form-field>

              <!-- File Selection -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Select Files</h3>
                
                <!-- Drag & Drop Area -->
                <div 
                  class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors"
                  [class.border-blue-500]="isDragOver"
                  [class.bg-blue-50]="isDragOver"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                  (click)="fileInput.click()"
                >
                  <mat-icon class="text-4xl text-gray-400 mb-4">cloud_upload</mat-icon>
                  <p class="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p class="text-gray-600">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (Max: 10MB per file)
                  </p>
                </div>

                <!-- File Input -->
                <input
                  #fileInput
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                  (change)="onFileSelected($event)"
                  class="hidden"
                >

                <!-- Selected Files -->
                <div *ngIf="selectedFiles.length > 0" class="space-y-3">
                  <h4 class="font-medium text-gray-900">Selected Files ({{ selectedFiles.length }})</h4>
                  <div class="space-y-2">
                    <div 
                      *ngFor="let file of selectedFiles; trackBy: trackByFile" 
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div class="flex items-center space-x-3">
                        <mat-icon class="text-gray-600">
                          {{ getFileIcon(file.file.type) }}
                        </mat-icon>
                        <div>
                          <p class="font-medium text-gray-900">{{ file.file.name }}</p>
                          <p class="text-sm text-gray-600">
                            {{ formatFileSize(file.file.size) }} • {{ file.file.type }}
                          </p>
                        </div>
                      </div>
                      <button 
                        mat-icon-button 
                        color="warn" 
                        (click)="removeFile(file)"
                        matTooltip="Remove file"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="flex justify-end">
                <button 
                  mat-raised-button 
                  color="primary" 
                  type="submit"
                  [disabled]="uploadForm.invalid || selectedFiles.length === 0 || isUploading"
                  class="px-8"
                >
                  <mat-icon>upload</mat-icon>
                  {{ isUploading ? 'Uploading...' : 'Upload Files' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Upload Progress -->
        <div *ngIf="uploadingFiles.length > 0" class="space-y-4">
          <h2 class="text-xl font-bold text-gray-900">Upload Progress</h2>
          
          <div class="space-y-3">
            <div 
              *ngFor="let uploadFile of uploadingFiles; trackBy: trackByFile" 
              class="bg-white rounded-lg shadow p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <mat-icon class="text-gray-600">
                    {{ getFileIcon(uploadFile.file.type) }}
                  </mat-icon>
                  <div>
                    <p class="font-medium text-gray-900">{{ uploadFile.file.name }}</p>
                    <p class="text-sm text-gray-600">{{ formatFileSize(uploadFile.file.size) }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <mat-chip 
                    [color]="getStatusColor(uploadFile.status)" 
                    selected
                  >
                    {{ uploadFile.status | titlecase }}
                  </mat-chip>
                  <button 
                    *ngIf="uploadFile.status === 'uploading'"
                    mat-icon-button 
                    color="warn" 
                    (click)="cancelUpload(uploadFile)"
                    matTooltip="Cancel upload"
                  >
                    <mat-icon>cancel</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Progress Bar -->
              <mat-progress-bar 
                *ngIf="uploadFile.status === 'uploading'"
                [value]="uploadFile.progress"
                color="primary"
                class="mb-2"
              ></mat-progress-bar>

              <!-- Error Message -->
              <div *ngIf="uploadFile.status === 'error' && uploadFile.error" class="text-red-600 text-sm">
                {{ uploadFile.error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    mat-card {
      border-radius: 12px;
    }
    
    .border-dashed {
      cursor: pointer;
    }
    
    .border-dashed:hover {
      border-color: rgb(59, 130, 246);
      background-color: rgb(239, 246, 255);
    }
  `]
})
export class FileUploadComponent implements OnInit, OnDestroy {
  uploadForm: FormGroup;
  selectedFiles: UploadFile[] = [];
  uploadingFiles: UploadFile[] = [];
  isDragOver = false;
  isUploading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    private snackBar: MatSnackBar
  ) {
    this.uploadForm = this.fb.group({
      fileType: ['', Validators.required],
      description: ['', Validators.required],
      tags: ['']
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  private addFiles(files: File[]): void {
    const validFiles = files.filter(file => this.validateFile(file));
    
    validFiles.forEach(file => {
      const uploadFile: UploadFile = {
        file,
        progress: 0,
        status: 'pending'
      };
      
      if (!this.selectedFiles.some(f => f.file.name === file.name)) {
        this.selectedFiles.push(uploadFile);
      }
    });

    if (files.length !== validFiles.length) {
      this.snackBar.open('Some files were rejected due to invalid format or size', 'Close', {
        duration: 5000
      });
    }
  }

  private validateFile(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      this.snackBar.open(`File ${file.name} is too large. Maximum size is 10MB.`, 'Close', {
        duration: 3000
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open(`File ${file.name} has an unsupported format.`, 'Close', {
        duration: 3000
      });
      return false;
    }

    return true;
  }

  removeFile(uploadFile: UploadFile): void {
    const index = this.selectedFiles.indexOf(uploadFile);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.uploadForm.valid && this.selectedFiles.length > 0) {
      this.isUploading = true;
      
      // Move files to uploading state
      this.uploadingFiles = [...this.selectedFiles];
      this.selectedFiles = [];
      
      // Upload each file
      this.uploadingFiles.forEach(uploadFile => {
        this.uploadFile(uploadFile);
      });
    }
  }

  private uploadFile(uploadFile: UploadFile): void {
    uploadFile.status = 'uploading';
    
    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('fileType', this.uploadForm.value.fileType);
    formData.append('description', this.uploadForm.value.description);
    formData.append('tags', this.uploadForm.value.tags);

    this.fileUploadService.uploadFile(formData).subscribe({
      next: (response) => {
        uploadFile.status = 'completed';
        uploadFile.progress = 100;
        
        this.snackBar.open(`File ${uploadFile.file.name} uploaded successfully!`, 'Close', {
          duration: 3000
        });
        
        this.checkUploadCompletion();
      },
      error: (error) => {
        uploadFile.status = 'error';
        uploadFile.error = error.error?.message || 'Upload failed';
        
        this.snackBar.open(`Failed to upload ${uploadFile.file.name}`, 'Close', {
          duration: 5000
        });
        
        this.checkUploadCompletion();
      }
    });
  }

  private checkUploadCompletion(): void {
    const completed = this.uploadingFiles.every(f => f.status === 'completed' || f.status === 'error');
    if (completed) {
      this.isUploading = false;
      this.uploadForm.reset();
      
      // Clear completed uploads after a delay
      setTimeout(() => {
        this.uploadingFiles = this.uploadingFiles.filter(f => f.status === 'error');
      }, 5000);
    }
  }

  cancelUpload(uploadFile: UploadFile): void {
    // In a real implementation, you would cancel the HTTP request
    uploadFile.status = 'error';
    uploadFile.error = 'Upload cancelled';
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('excel')) return 'table_chart';
    if (mimeType.includes('image')) return 'image';
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'primary';
      case 'uploading': return 'accent';
      case 'error': return 'warn';
      default: return 'primary';
    }
  }

  trackByFile(index: number, uploadFile: UploadFile): string {
    return uploadFile.file.name;
  }
}
