import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { DoctorProfileService, DocumentItem } from '../../core/services/doctor-profile.service';
import { SelectDropdownComponent, SelectOption } from '../../shared/select-dropdown.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';

@Component({
  selector: 'app-doctor-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent, SelectDropdownComponent, EmptyStateComponent, FilterBarComponent],
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
  searchTerm = signal<string>('');
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

  // Prepared options for SelectDropdownComponent
  readonly documentTypeOptions: SelectOption[] = this.documentTypes.map(t => ({
    value: t,
    label: t.replace(/_/g, ' ').split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
  }));

  readonly categoryOptions: SelectOption[] = [
    { value: 'Education', label: 'Education' },
    { value: 'Experience', label: 'Experience' },
    { value: 'Other', label: 'Other' }
  ];

  readonly typeFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Types' },
    ...this.documentTypeOptions
  ];

  readonly categoryFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Categories' },
    ...this.categoryOptions
  ];

  readonly educationSubtypeOptions: SelectOption[] = [
    { value: '', label: 'Select Level' },
    ...this.educationSubtypes.map(s => ({ value: s, label: s }))
  ];

  readonly educationSubtypeFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Levels' },
    ...this.educationSubtypes.map(s => ({ value: s, label: s }))
  ];

  readonly documentFilterConfigs: FilterConfig[] = [
    {
      type: 'search',
      key: 'searchTerm',
      label: 'Search',
      placeholder: 'Search by file name or description...'
    },
    {
      type: 'select',
      key: 'filterType',
      label: 'Type',
      placeholder: 'All Types',
      options: this.typeFilterOptions
    },
    {
      type: 'select',
      key: 'filterCategory',
      label: 'Category',
      placeholder: 'All Categories',
      options: this.categoryFilterOptions
    }
  ];

  documentFilterValues: Record<string, any> = {
    searchTerm: '',
    filterType: 'ALL',
    filterCategory: 'ALL'
  };

  onFilterBarChange(values: Record<string, any>) {
    this.searchTerm.set(values['searchTerm'] || '');
    this.filterType = values['filterType'] || 'ALL';
    this.filterCategory = values['filterCategory'] || 'ALL';
    this.applyFilters();
  }

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
        this.applyFilters();
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
        const msg = typeof e?.error === 'string' ? e.error : (e?.error?.message || 'Upload failed');
        this.error.set(msg);
        this.uploading = false;
      },
    });
  }

  applyFilters() {
    let list = this.documents || [];
    const query = (this.searchTerm() || '').trim().toLowerCase();
    if (query) {
      list = list.filter((d) =>
        (d.originalFilename || '').toLowerCase().includes(query) ||
        (d.description || '').toLowerCase().includes(query) ||
        (d.documentType || '').toLowerCase().includes(query)
      );
    }
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
    this.searchTerm.set('');
    this.filterType = 'ALL';
    this.filterCategory = 'ALL';
    this.filterEducationSubtype = 'ALL';
    this.documentFilterValues = {
      searchTerm: '',
      filterType: 'ALL',
      filterCategory: 'ALL'
    };
    this.applyFilters();
  }

  getFileExtension(doc: DocumentItem): string {
    if (!doc?.originalFilename) return 'FILE';
    const parts = doc.originalFilename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'PDF';
  }

  getDocIconClass(doc: DocumentItem): string {
    const type = (doc?.contentType || doc?.originalFilename || '').toLowerCase();
    if (type.includes('pdf')) return 'fa-file-pdf text-[#ef4444]';
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return 'fa-file-image text-[#10b981]';
    return 'fa-file-lines text-[#a855f7]';
  }

  getDocIconBgClass(doc: DocumentItem): string {
    const type = (doc?.contentType || doc?.originalFilename || '').toLowerCase();
    if (type.includes('pdf')) return 'bg-[#ef4444]/15 border border-[#ef4444]/30';
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return 'bg-[#10b981]/15 border border-[#10b981]/30';
    return 'bg-[#a855f7]/15 border border-[#a855f7]/30';
  }

  getStatusBadge(doc: DocumentItem): { text: string; isVerified: boolean } {
    const docType = (doc?.documentType || '').toUpperCase();
    if (docType === 'CERTIFICATE' || docType === 'IDENTIFICATION' || docType === 'MEDICAL_DOCUMENT') {
      return { text: 'Verified', isVerified: true };
    }
    return { text: 'Active', isVerified: false };
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Oct 7, 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  downloadDocument(doc: DocumentItem) {
    if (!doc?.filePath) return;
    window.open(doc.filePath, '_blank');
  }

  trackByDocId(_index: number, doc: DocumentItem): number {
    return doc.id;
  }
}