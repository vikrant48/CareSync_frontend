import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Subject, takeUntil } from 'rxjs';

import { FileUploadService } from '../../../services/file-upload.service';
import { FileUploadRequest, FileUploadProgress } from '../../../models/file.model';

@Component({
  selector: 'app-upload-files',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">File Upload</h1>
          <p class="text-gray-600">Upload medical documents, certificates, and other files</p>
        </div>

        <!-- Upload Form -->
        <mat-card class="shadow-xl">
          <mat-card-content class="p-8">
            <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <!-- File Type Selection -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>File Type</mat-label>
                <mat-select formControlName="fileType" required>
                  <mat-option value="MEDICAL_DOCUMENT">Medical Document</mat-option>
                  <mat-option value="CERTIFICATE">Certificate</mat-option>
                  <mat-option value="PROFILE_IMAGE">Profile Image</mat-option>
                  <mat-option value="REPORT">Report</mat-option>
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
              </mat-form-field>

              <!-- Tags -->
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Tags (comma separated)</mat-label>
                <input 
                  matInput 
                  formControlName="tags" 
                  placeholder="e.g., medical, report, 2024"
                >
                <mat-icon matSuffix>local_offer</mat-icon>
              </mat-form-field>

              <!-- File Upload Area -->
              <div 
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors"
                [class.border-blue-500]="isDragOver"
                [class.bg-blue-50]="isDragOver"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
              >
                <input 
                  #fileInput
                  type="file" 
                  multiple 
                  (change)="onFileSelected($event)"
                  class="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xlsx,.xls"
                >
                
                <div class="space-y-4">
                  <mat-icon class="text-4xl text-gray-400">cloud_upload</mat-icon>
                  <div>
                    <p class="text-lg font-medium text-gray-900">
                      Drop files here or click to browse
                    </p>
                    <p class="text-sm text-gray-500 mt-1">
                      Supports PDF, DOC, images, and other common formats
                    </p>
                  </div>
                  <button 
                    type="button"
                    mat-stroked-button 
                    color="primary"
                    (click)="fileInput.click()"
                  >
                    <mat-icon>folder_open</mat-icon>
                    Choose Files
                  </button>
                </div>
              </div>

              <!-- Selected Files -->
              <div *ngIf="selectedFiles.length > 0" class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Selected Files</h3>
                <div class="space-y-3">
                  <div 
                    *ngFor="let file of selectedFiles; let i = index" 
                    class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div class="flex items-center space-x-3">
                      <mat-icon class="text-blue-600">insert_drive_file</mat-icon>
                      <div>
                        <p class="font-medium">{{ file.name }}</p>
                        <p class="text-sm text-gray-500">{{ formatFileSize(file.size) }}</p>
                      </div>
                    </div>
                    <button 
                      mat-icon-button 
                      color="warn" 
                      (click)="removeFile(i)"
                      type="button"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Upload Progress -->
              <div *ngIf="uploadProgress.length > 0" class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Upload Progress</h3>
                <div class="space-y-3">
                  <div 
                    *ngFor="let progress of uploadProgress" 
                    class="space-y-2"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium">{{ progress.fileName }}</span>
                      <span class="text-sm text-gray-500">{{ progress.percentage }}%</span>
                    </div>
                    <mat-progress-bar 
                      [value]="progress.percentage" 
                      [color]="progress.percentage === 100 ? 'primary' : 'accent'"
                    ></mat-progress-bar>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="flex justify-end">
                <button 
                  mat-raised-button 
                  color="primary" 
                  type="submit" 
                  class="px-8 py-3"
                  [disabled]="uploadForm.invalid || selectedFiles.length === 0 || isUploading"
                >
                  <mat-spinner 
                    *ngIf="isUploading" 
                    diameter="20" 
                    class="mr-2"
                  ></mat-spinner>
                  {{ isUploading ? 'Uploading...' : 'Upload Files' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Upload History -->
        <mat-card class="shadow-xl mt-8">
          <mat-card-header>
            <mat-card-title>Recent Uploads</mat-card-title>
            <mat-card-subtitle>Your recently uploaded files</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="p-0">
            <div *ngIf="recentUploads.length === 0" class="p-6 text-center text-gray-500">
              <mat-icon class="text-4xl mb-4">folder_open</mat-icon>
              <p>No recent uploads</p>
            </div>
            <div *ngIf="recentUploads.length > 0" class="divide-y divide-gray-200">
              <div 
                *ngFor="let upload of recentUploads" 
                class="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div class="flex items-center space-x-3">
                  <mat-icon class="text-green-600">check_circle</mat-icon>
                  <div>
                    <p class="font-medium">{{ upload.fileName }}</p>
                    <p class="text-sm text-gray-500">{{ upload.uploadedAt | date:'short' }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <mat-chip color="primary" selected>{{ upload.fileType }}</mat-chip>
                  <button mat-icon-button [routerLink]="['/files', upload.id]">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    mat-card {
      border-radius: 16px;
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
export class UploadFilesComponent implements OnInit, OnDestroy {
  uploadForm: FormGroup;
  selectedFiles: File[] = [];
  uploadProgress: FileUploadProgress[] = [];
  recentUploads: any[] = [];
  isDragOver = false;
  isUploading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.uploadForm = this.fb.group({
      fileType: ['', Validators.required],
      description: [''],
      tags: [''],
      relatedId: [''],
      relatedType: ['']
    });
  }

  ngOnInit(): void {
    this.loadRecentUploads();
  }

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

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  private addFiles(files: File[]): void {
    const validFiles = files.filter(file => this.validateFile(file));
    
    if (validFiles.length !== files.length) {
      this.snackBar.open('Some files were rejected due to invalid format or size', 'Close', {
        duration: 5000
      });
    }
    
    this.selectedFiles.push(...validFiles);
  }

  private validateFile(file: File): boolean {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open(`File ${file.name} is too large. Maximum size is 10MB.`, 'Close', {
        duration: 3000
      });
      return false;
    }
    
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open(`File type ${file.type} is not supported.`, 'Close', {
        duration: 3000
      });
      return false;
    }
    
    return true;
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onSubmit(): void {
    if (this.uploadForm.valid && this.selectedFiles.length > 0) {
      this.isUploading = true;
      this.uploadProgress = [];
      
      const formData = this.uploadForm.value;
      const tags = formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : [];
      
      // Upload each file
      this.selectedFiles.forEach((file, index) => {
        const uploadRequest: FileUploadRequest = {
          file: file,
          fileType: formData.fileType,
          description: formData.description,
          tags: tags,
          relatedId: formData.relatedId || undefined,
          relatedType: formData.relatedType || undefined,
          customFields: {}
        };
        
        this.fileUploadService.uploadFileWithProgress(uploadRequest)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (progress) => {
              this.updateUploadProgress(index, progress);
            },
            error: (error) => {
              console.error('Upload error:', error);
              this.snackBar.open(`Failed to upload ${file.name}`, 'Close', {
                duration: 5000
              });
            }
          });
      });
      
      // Reset form after upload
      setTimeout(() => {
        this.uploadForm.reset();
        this.selectedFiles = [];
        this.uploadProgress = [];
        this.isUploading = false;
        this.loadRecentUploads();
        
        this.snackBar.open('Files uploaded successfully!', 'Close', {
          duration: 3000
        });
      }, 2000);
    }
  }

  private updateUploadProgress(index: number, progress: FileUploadProgress): void {
    if (index >= this.uploadProgress.length) {
      this.uploadProgress.push(progress);
    } else {
      this.uploadProgress[index] = progress;
    }
  }

  private loadRecentUploads(): void {
    // Get recent uploads from the service
    this.fileUploadService.getFiles()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: (files) => {
          this.recentUploads = files.map(file => ({
            id: file.id,
            fileName: file.fileName || file.originalName,
            fileType: file.fileType,
            uploadedAt: new Date(file.createdAt)
          }));
        },
        error: (error) => {
          console.error('Error loading recent uploads:', error);
          // Fallback to empty array or show error message
          this.recentUploads = [];
          this.snackBar.open('Failed to load recent uploads', 'Close', {
            duration: 3000
          });
        }
      });
  }
}
