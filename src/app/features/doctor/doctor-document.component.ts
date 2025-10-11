import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { DoctorProfileService, DocumentItem } from '../../core/services/doctor-profile.service';

@Component({
  selector: 'app-doctor-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent],
  templateUrl: './doctor-document.component.html',
  styleUrl: './doctor-document.component.css'
})
export class DoctorDocumentsComponent implements OnInit {
  private svc = inject(DoctorProfileService);
  private auth = inject(AuthService);
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  documents: DocumentItem[] = [];
  displayedDocs: DocumentItem[] = [];
  doctorId: number | null = null;

  // Upload form state
  selectedFile: File | null = null;
  uploadDescription: string = '';
  uploadType: string = 'OTHER';
  uploadCategory: 'Education' | 'Experience' | 'Other' = 'Other';
  uploadEducationSubtype: string = '';
  uploading: boolean = false;
  successMessage: string | null = null;

  // Filter state
  filterType: string = 'ALL';
  filterCategory: 'ALL' | 'Education' | 'Experience' | 'Other' = 'ALL';
  filterEducationSubtype: string = 'ALL';

  // Options
  readonly documentTypes = [
    'CERTIFICATE',
    'MEDICAL_DOCUMENT',
    'PRESCRIPTION',
    'LAB_REPORT',
    'INSURANCE_DOCUMENT',
    'IDENTIFICATION',
    'OTHER',
  ];
  readonly educationSubtypes = [
    '10th',
    '12th',
    'MBBS',
    'BDS',
    'MD',
    'MS',
    'DM',
    'MCh',
    'Diploma',
    'Other',
  ];

  ngOnInit(): void {
    const idStr = this.auth.userId();
    this.doctorId = idStr ? Number(idStr) : null;
    if (this.doctorId == null) {
      this.error.set('No authenticated doctor');
      this.loading.set(false);
      return;
    }
    this.loadDocuments();
  }

  loadDocuments() {
    if (this.doctorId == null) return;
    this.loading.set(true);
    this.error.set(null);
    this.svc.getDocumentsByDoctor(this.doctorId).subscribe({
      next: (docs) => {
        this.documents = docs || [];
        this.applyFilters();
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Failed to load documents');
        this.loading.set(false);
      },
    });
  }

  deleteDocument(doc: DocumentItem) {
    if (!doc?.id) return;
    this.svc.deleteDocument(doc.id).subscribe({
      next: () => {
        this.documents = this.documents.filter((d) => d.id !== doc.id);
      },
    });
  }

  updateDocDescription(doc: DocumentItem) {
    const desc = doc?.description || '';
    if (!doc?.id) return;
    this.svc.updateDocumentDescription(doc.id, desc).subscribe();
  }

  onFileSelected(event: any) {
    const file = event?.target?.files?.[0];
    this.selectedFile = file || null;
  }

  uploadDocument() {
    if (!this.selectedFile || this.doctorId == null) return;
    this.uploading = true;
    this.successMessage = null;
    // Map category to DocumentType by default
    const type = this.uploadType || (this.uploadCategory === 'Education' ? 'CERTIFICATE' : 'OTHER');
    const descParts: string[] = [];
    if (this.uploadCategory) descParts.push(`Category: ${this.uploadCategory}`);
    if (this.uploadCategory === 'Education' && this.uploadEducationSubtype) {
      descParts.push(`Subtype: ${this.uploadEducationSubtype}`);
    }
    if (this.uploadDescription) descParts.push(`Note: ${this.uploadDescription}`);
    const description = descParts.join('; ');

    this.svc.uploadDoctorDocument(this.selectedFile, this.doctorId, type, description).subscribe({
      next: (resp) => {
        // Optimistically add to list (normalize to DocumentItem shape if needed)
        const newDoc: DocumentItem = {
          id: resp?.id,
          originalFilename: resp?.filename || this.selectedFile!.name,
          filePath: resp?.cloudinaryUrl || resp?.url || '',
          fileSize: this.selectedFile!.size,
          contentType: this.selectedFile!.type,
          documentType: resp?.documentType || type,
          uploadDate: resp?.uploadDate || new Date().toISOString(),
          description,
        } as DocumentItem;
        this.documents = [newDoc, ...(this.documents || [])];
        this.applyFilters();
        // reset form
        this.selectedFile = null;
        this.uploadDescription = '';
        this.uploadType = 'OTHER';
        this.uploadCategory = 'Other';
        this.uploadEducationSubtype = '';
        if (this.fileInput?.nativeElement) {
          this.fileInput.nativeElement.value = '';
        }
        this.uploading = false;
        this.successMessage = 'Uploaded successfully';
        setTimeout(() => { this.successMessage = null; }, 3000);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Upload failed');
        this.uploading = false;
      },
    });
  }

  applyFilters() {
    let list = this.documents || [];
    if (this.filterType && this.filterType !== 'ALL') {
      list = list.filter((d) => (d.documentType || '').toUpperCase() === this.filterType.toUpperCase());
    }
    if (this.filterCategory && this.filterCategory !== 'ALL') {
      list = list.filter((d) => (d.description || '').includes(`Category: ${this.filterCategory}`));
    }
    if (this.filterCategory === 'Education' && this.filterEducationSubtype && this.filterEducationSubtype !== 'ALL') {
      list = list.filter((d) => (d.description || '').includes(`Subtype: ${this.filterEducationSubtype}`));
    }
    this.displayedDocs = list;
  }

  onFilterChanged() {
    this.applyFilters();
  }

  clearFilters() {
    this.filterType = 'ALL';
    this.filterCategory = 'ALL';
    this.filterEducationSubtype = 'ALL';
    this.applyFilters();
  }
}