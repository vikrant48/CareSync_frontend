import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorProfileService, UpdateDoctorRequest, CreateEducationRequest, CreateExperienceRequest, CreateCertificateRequest } from '../../core/services/doctor-profile.service';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { SpecializationAutocompleteComponent } from '../../shared/specialization-autocomplete.component';
import { ToastService } from '../../core/services/toast.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { SelectDropdownComponent, SelectOption } from '../../shared/select-dropdown.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { DoctorProfileRecordListComponent } from './doctor-profile-record-list.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent, SpecializationAutocompleteComponent, SelectDropdownComponent, EmptyStateComponent, SkeletonComponent, DoctorProfileRecordListComponent],
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.css']
})
export class DoctorProfileComponent implements OnInit {
  private svc = inject(DoctorProfileService);
  auth = inject(AuthService);
  private toast = inject(ToastService);
  private masterDataService = inject(MasterDataService);
  private router = inject(Router);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  profile: any = {};
  username: string | null = null;
  doctorId: number | null = null;

  // Profile form model
  profileForm: UpdateDoctorRequest = {
    firstName: '',
    lastName: '',
    specialization: '',
    contactInfo: '',
    alternateContactInfo: '',
    email: '',
    isActive: true,
    gender: undefined,
    dateOfBirth: '',
    consultationFees: undefined,
    address: '',
    licenseNumber: '',
    bio: '',
    languages: [],
  };

  languageOptions: string[] = [];

  // Education
  educations: any[] = [];
  newEducation: CreateEducationRequest = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' };
  editingEducationId: number | null = null;
  degreeOptions: string[] = [];
  institutionOptions: string[] = [];
  customDegree: string = '';
  customInstitution: string = '';

  // Experience
  experiences: any[] = [];
  newExperience: CreateExperienceRequest = { hospitalName: '', position: '', yearsOfService: 1, details: '' };
  editingExperienceId: number | null = null;
  hospitalOptions: string[] = [];
  positionOptions: string[] = [];
  customHospital: string = '';
  customPosition: string = '';

  // Certificates
  certificates: any[] = [];
  certFile?: File;
  certDescription: string = '';
  certEdit: Record<number, Partial<CreateCertificateRequest>> = {};
  editingCertId: number | null = null;
  lastUploadedCertId: number | null = null;
  @ViewChild('certFileInput') certFileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('profileImageInput') profileImageInputRef?: ElementRef<HTMLInputElement>;

  // Profile image selection & preview
  selectedProfileImage?: File;
  profileImagePreviewUrl: string | null = null;
  uploadingProfileImage = false;
  uploadingCertificate = false;
  certUploadMessage: string | null = null;
  certUploadDetails: { cloudinaryUrl?: string; downloadUrl?: string; filename?: string } | null = null;

  // UI state: active tab
  activeTab: 'overview' | 'education' | 'experience' | 'certificates' = 'overview';
  editingOverview = false;
  editingEducationMode = false;
  editingExperienceMode = false;
  editingCertificatesMode = false;
  genders: string[] = [];

  displayName(): string {
    const first = this.profile?.firstName || '';
    const last = this.profile?.lastName || '';
    const full = `${first} ${last}`.trim();
    return full || this.profile?.username || 'Doctor';
  }

  trackLanguage(_index: number, language: string): string {
    return language;
  }

  displayValue(value: unknown): string {
    if (value == null) return 'Not provided';
    const text = String(value).trim();
    return text || 'Not provided';
  }

  profileLanguages(): string[] {
    return this.normalizeLanguages(this.profile?.languages);
  }

  genderLabel(): string {
    const gender = this.profile?.gender?.trim();
    if (!gender) return 'Not provided';
    const normalized = gender.toLowerCase();
    if (normalized === 'male' || normalized === 'm') return 'Male';
    if (normalized === 'female' || normalized === 'f') return 'Female';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  }

  feeLabel(): string {
    const fee = this.profile?.consultationFees;
    if (fee == null || fee === '') return 'Not provided';
    return `₹${fee}`;
  }

  completionPercent(): number {
    const value = Number(this.profile?.completionPercentage);
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, Math.round(value)));
  }

  ngOnInit(): void {
    this.masterDataService.getAllMasterData().subscribe({
      next: (data) => {
        if (data.genders) this.genders = data.genders;
        if (data.languages) this.languageOptions = data.languages;
        if (data.degrees) this.degreeOptions = [...data.degrees, '__other__'];
        if (data.institutions) this.institutionOptions = [...data.institutions, '__other__'];
        if (data.hospitals) this.hospitalOptions = [...data.hospitals, '__other__'];
        if (data.positions) this.positionOptions = [...data.positions, '__other__'];
      }
    });
    this.username = this.auth.username();
    const idStr = this.auth.userId();
    this.doctorId = idStr ? Number(idStr) : null;
    if (!this.username) {
      this.error.set('No authenticated doctor user');
      this.loading.set(false);
      return;
    }
    this.loadAll();
  }

  loadAll() {
    if (!this.username) {
      this.error.set('No authenticated doctor user');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const u = this.username!;

    forkJoin({
      profile: this.svc.getProfile(u),
      educations: this.svc.getEducations(u),
      experiences: this.svc.getExperiences(u),
      certificates: this.svc.getCertificates(u),
    }).subscribe({
      next: ({ profile, educations, experiences, certificates }) => {
        this.profile = profile;
        this.profileForm = {
          firstName: profile?.firstName ?? '',
          lastName: profile?.lastName ?? '',
          specialization: profile?.specialization ?? '',
          contactInfo: profile?.contactInfo ?? '',
          alternateContactInfo: profile?.alternateContactInfo ?? '',
          email: profile?.email ?? '',
          isActive: profile?.isActive ?? true,
          gender: profile?.gender ?? undefined,
          dateOfBirth: profile?.dateOfBirth ?? '',
          consultationFees: profile?.consultationFees ?? undefined,
          address: profile?.address ?? '',
          licenseNumber: profile?.licenseNumber ?? '',
          bio: profile?.bio ?? '',
          languages: this.normalizeLanguages(profile?.languages),
        };
        this.educations = educations || [];
        this.experiences = experiences || [];
        this.certificates = certificates || [];
        this.initCertEdit();
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Failed to load profile');
        this.loading.set(false);
      },
    });
  }

  private initCertEdit() {
    this.certEdit = {};
    for (const c of this.certificates) {
      this.certEdit[c.id] = {
        name: c.name,
        url: c.url,
        details: c.details,
        issuingOrganization: c.issuingOrganization,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        credentialId: c.credentialId,
        credentialUrl: c.credentialUrl,
      };
    }
  }

  saveProfile() {
    if (!this.username) return;
    const payload = {
      ...this.profileForm,
      dateOfBirth: this.profileForm.dateOfBirth || undefined,
    };
    this.svc.updateProfile(this.username, payload).subscribe({
      next: (resp) => {
        this.profile = resp;
        this.editingOverview = false;
        this.toast.showSuccess('Profile updated successfully');
      },
      error: (e) => this.toast.showError(e?.error?.message || 'Failed to update profile'),
    });
  }

  normalizeLanguages(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((x) => !!x);
    if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter((s) => !!s);
    return [];
  }

  toggleLanguage(lang: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    const set = new Set(this.profileForm.languages || []);
    if (checked) {
      set.add(lang);
    } else {
      set.delete(lang);
    }
    this.profileForm.languages = Array.from(set);
  }

  onProfileImageSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedProfileImage = file;
    if (this.profileImagePreviewUrl) {
      URL.revokeObjectURL(this.profileImagePreviewUrl);
    }
    this.profileImagePreviewUrl = URL.createObjectURL(file);
  }

  uploadSelectedProfileImage() {
    if (!this.selectedProfileImage || this.doctorId == null) return;
    this.uploadingProfileImage = true;
    const file = this.selectedProfileImage;
    this.svc.uploadProfileImage(file, this.doctorId, 'Profile image').subscribe({
      next: () => {
        this.clearProfileImageSelection();
        this.loadAll();
        this.uploadingProfileImage = false;
        this.editingOverview = false;
        this.toast.showSuccess('Profile image updated');
      },
      error: (e) => {
        this.uploadingProfileImage = false;
        const msg = typeof e?.error === 'string' ? e.error : (e?.error?.message || 'Failed to upload profile image');
        this.toast.showError(msg);
      },
    });
  }

  clearProfileImageSelection() {
    if (this.profileImagePreviewUrl) {
      URL.revokeObjectURL(this.profileImagePreviewUrl);
    }
    this.profileImagePreviewUrl = null;
    this.selectedProfileImage = undefined;
    if (this.profileImageInputRef?.nativeElement) {
      this.profileImageInputRef.nativeElement.value = '';
    }
  }

  triggerProfileImageUpload() {
    this.profileImageInputRef?.nativeElement.click();
  }

  addEducation() {
    if (!this.username) return;
    if (this.newEducation.degree === '__other__') {
      this.toast.showError('Please add a custom degree before saving');
      return;
    }
    if (this.newEducation.institution === '__other__') {
      this.toast.showError('Please add a custom institution before saving');
      return;
    }
    this.svc.addEducation(this.username, this.newEducation).subscribe({
      next: (e) => {
        this.educations.push(e);
        this.newEducation = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' };
        this.refreshProfileStats();
        this.editingEducationMode = false;
        this.toast.showSuccess('Education added successfully');
      },
      error: (err) => this.toast.showError(err?.error?.message || 'Failed to add education'),
    });
  }

  startEditEducation(item: any) {
    this.editingEducationId = item?.id ?? null;
    this.editingEducationMode = true;
    this.newEducation = {
      degree: item?.degree || '',
      institution: item?.institution || '',
      yearOfCompletion: item?.yearOfCompletion || new Date().getFullYear(),
      details: item?.details || '',
    };
    if (item?.degree && !this.degreeOptions.includes(item.degree)) {
      this.degreeOptions.push(item.degree);
    }
    if (item?.institution && !this.institutionOptions.includes(item.institution)) {
      this.institutionOptions.push(item.institution);
    }
  }

  cancelEditEducation() {
    this.editingEducationId = null;
    this.newEducation = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' };
    this.editingEducationMode = false;
  }

  submitEducation() {
    if (!this.username) return;
    if (this.editingEducationId == null) {
      this.addEducation();
      return;
    }
    if (this.newEducation.degree === '__other__') {
      this.toast.showError('Please add a custom degree before updating');
      return;
    }
    if (this.newEducation.institution === '__other__') {
      this.toast.showError('Please add a custom institution before updating');
      return;
    }
    const id = this.editingEducationId;
    this.svc.updateEducation(this.username, id!, {
      degree: this.newEducation.degree,
      institution: this.newEducation.institution,
      yearOfCompletion: this.newEducation.yearOfCompletion,
      details: this.newEducation.details,
    }).subscribe({
      next: () => {
        this.editingEducationId = null;
        this.newEducation = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' };
        this.svc.getEducations(this.username!).subscribe({ next: (list) => (this.educations = list || []) });
        this.refreshProfileStats();
        this.editingEducationMode = false;
        this.toast.showSuccess('Education updated successfully');
      },
      error: (err) => this.toast.showError(err?.error?.message || 'Failed to update education'),
    });
  }

  addCustomDegree() {
    const val = (this.customDegree || '').trim();
    if (!val) {
      this.toast.showError('Enter a degree name to add');
      return;
    }
    if (!this.degreeOptions.includes(val)) {
      this.degreeOptions.push(val);
    }
    this.newEducation.degree = val;
    this.customDegree = '';
  }

  addCustomInstitution() {
    const val = (this.customInstitution || '').trim();
    if (!val) {
      this.toast.showError('Enter an institution name to add');
      return;
    }
    if (!this.institutionOptions.includes(val)) {
      this.institutionOptions.push(val);
    }
    this.newEducation.institution = val;
    this.customInstitution = '';
  }

  deleteEducation(item: any) {
    if (!this.username) return;
    this.svc.deleteEducation(this.username, item.id).subscribe({
      next: () => {
        this.educations = this.educations.filter((e) => e.id !== item.id);
        this.refreshProfileStats();
      },
    });
  }

  addExperience() {
    if (!this.username) return;
    if (this.newExperience.hospitalName === '__other__') {
      this.toast.showError('Please add a custom hospital before saving');
      return;
    }
    if (this.newExperience.position === '__other__') {
      this.toast.showError('Please add a custom position before saving');
      return;
    }
    this.svc.addExperience(this.username, this.newExperience).subscribe({
      next: (e) => {
        this.experiences.push(e);
        this.newExperience = { hospitalName: '', position: '', yearsOfService: 1, details: '' };
        this.refreshProfileStats();
        this.editingExperienceMode = false;
        this.toast.showSuccess('Experience added successfully');
      },
      error: (err) => this.toast.showError(err?.error?.message || 'Failed to add experience'),
    });
  }

  startEditExperience(item: any) {
    this.editingExperienceId = item?.id ?? null;
    this.editingExperienceMode = true;
    this.newExperience = {
      hospitalName: item?.hospitalName || '',
      position: item?.position || '',
      yearsOfService: item?.yearsOfService || 1,
      details: item?.details || '',
    };
    if (item?.hospitalName && !this.hospitalOptions.includes(item.hospitalName)) {
      this.hospitalOptions.push(item.hospitalName);
    }
    if (item?.position && !this.positionOptions.includes(item.position)) {
      this.positionOptions.push(item.position);
    }
  }

  cancelEditExperience() {
    this.editingExperienceId = null;
    this.newExperience = { hospitalName: '', position: '', yearsOfService: 1, details: '' };
    this.editingExperienceMode = false;
  }

  submitExperience() {
    if (!this.username) return;
    if (this.editingExperienceId == null) {
      this.addExperience();
      return;
    }
    if (this.newExperience.hospitalName === '__other__') {
      this.toast.showError('Please add a custom hospital before updating');
      return;
    }
    if (this.newExperience.position === '__other__') {
      this.toast.showError('Please add a custom position before updating');
      return;
    }
    const id = this.editingExperienceId;
    this.svc.updateExperience(this.username, id!, {
      hospitalName: this.newExperience.hospitalName,
      position: this.newExperience.position,
      yearsOfService: this.newExperience.yearsOfService,
      details: this.newExperience.details,
    }).subscribe({
      next: () => {
        this.editingExperienceId = null;
        this.newExperience = { hospitalName: '', position: '', yearsOfService: 1, details: '' };
        this.svc.getExperiences(this.username!).subscribe({ next: (list) => (this.experiences = list || []) });
        this.refreshProfileStats();
        this.editingExperienceMode = false;
        this.toast.showSuccess('Experience updated successfully');
      },
      error: (err) => this.toast.showError(err?.error?.message || 'Failed to update experience'),
    });
  }

  addCustomHospital() {
    const val = (this.customHospital || '').trim();
    if (!val) {
      this.toast.showError('Enter a hospital name to add');
      return;
    }
    if (!this.hospitalOptions.includes(val)) {
      this.hospitalOptions.push(val);
    }
    this.newExperience.hospitalName = val;
    this.customHospital = '';
  }

  addCustomPosition() {
    const val = (this.customPosition || '').trim();
    if (!val) {
      this.toast.showError('Enter a position to add');
      return;
    }
    if (!this.positionOptions.includes(val)) {
      this.positionOptions.push(val);
    }
    this.newExperience.position = val;
    this.customPosition = '';
  }

  deleteExperience(item: any) {
    if (!this.username) return;
    this.svc.deleteExperience(this.username, item.id).subscribe({
      next: () => {
        this.experiences = this.experiences.filter((e) => e.id !== item.id);
        this.refreshProfileStats();
      },
    });
  }

  onCertFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.certFile = input.files?.[0] || undefined;
  }

  uploadCertificate() {
    if (!this.certFile || this.doctorId == null) return;
    this.uploadingCertificate = true;
    this.certUploadMessage = null;
    this.certUploadDetails = null;
    this.svc.uploadCertificateFile(this.certFile, this.doctorId, this.certDescription).subscribe({
      next: (resp) => {
        const certificateId = resp?.certificateId;
        const cloudinaryUrl = resp?.cloudinaryUrl;
        this.certUploadMessage = resp?.message || 'Uploaded successfully';
        this.certUploadDetails = {
          cloudinaryUrl: resp?.cloudinaryUrl,
          downloadUrl: resp?.downloadUrl || resp?.url,
          filename: resp?.filename,
        };
        if (this.username && certificateId && cloudinaryUrl) {
          const payload: CreateCertificateRequest = {
            name: resp?.filename || 'Certificate',
            url: cloudinaryUrl,
            details: this.certDescription,
          };
          this.svc.updateCertificate(this.username, certificateId, payload).subscribe({
            next: () => this.svc.getCertificates(this.username!).subscribe({
              next: (list) => {
                this.certificates = list || [];
                this.initCertEdit();
                this.lastUploadedCertId = null;
                this.editingCertId = null;
              },
            }),
          });
        }
        this.certFile = undefined;
        this.certDescription = '';
        if (this.certFileInputRef?.nativeElement) {
          this.certFileInputRef.nativeElement.value = '';
        }
        this.uploadingCertificate = false;
        this.editingCertificatesMode = false;
        this.refreshProfileStats();
        this.toast.showSuccess('Certificate uploaded successfully');
      },
      error: (e) => {
        this.uploadingCertificate = false;
        const msg = typeof e?.error === 'string' ? e.error : (e?.error?.message || 'Upload failed');
        this.certUploadMessage = msg;
        this.toast.showError(msg);
      },
    });
  }

  replaceCertificateFile(item: any, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.doctorId == null) return;
    this.svc.uploadCertificateFile(file, this.doctorId, item.details, item.id).subscribe({
      next: (resp) => {
        const cloudinaryUrl = resp?.cloudinaryUrl;
        if (this.username && cloudinaryUrl) {
          const payload: CreateCertificateRequest = {
            name: item.name,
            url: cloudinaryUrl,
            details: item.details,
            issuingOrganization: item.issuingOrganization,
            issueDate: item.issueDate,
            expiryDate: item.expiryDate,
            credentialId: item.credentialId,
            credentialUrl: item.credentialUrl,
          };
          this.svc.updateCertificate(this.username, item.id, payload).subscribe({
            next: () => this.svc.getCertificates(this.username!).subscribe({
              next: (list) => {
                this.certificates = list || [];
                this.initCertEdit();
                this.refreshProfileStats();
              },
            }),
          });
        }
      },
    });
  }

  saveCertificateMeta(item: any) {
    if (!this.username) return;
    const edited = this.certEdit[item.id] || {};
    const payload: CreateCertificateRequest = {
      name: (edited.name ?? item.name),
      url: (edited.url ?? item.url)?.trim?.() ?? (item.url ?? ''),
      details: edited.details ?? item.details,
      issuingOrganization: edited.issuingOrganization ?? item.issuingOrganization,
      issueDate: (edited.issueDate ?? item.issueDate),
      expiryDate: (edited.expiryDate ?? item.expiryDate),
      credentialId: edited.credentialId ?? item.credentialId,
      credentialUrl: edited.credentialUrl ?? item.credentialUrl,
    };
    this.svc.updateCertificate(this.username, item.id, payload).subscribe({
      next: (updated) => {
        const idx = this.certificates.findIndex((c) => c.id === item.id);
        if (idx >= 0) this.certificates[idx] = updated;
        this.certEdit[item.id] = {
          name: updated.name,
          url: updated.url,
          details: updated.details,
          issuingOrganization: updated.issuingOrganization,
          issueDate: updated.issueDate,
          expiryDate: updated.expiryDate,
          credentialId: updated.credentialId,
          credentialUrl: updated.credentialUrl,
        };
        if (this.editingCertId === item.id) {
          this.editingCertId = null;
        }
        if (this.lastUploadedCertId === item.id) {
          this.lastUploadedCertId = null;
        }
        this.toast.showSuccess('Certificate details saved');
      },
      error: (e) => this.toast.showError(e?.error?.message || 'Failed to save certificate'),
    });
  }

  startEditCert(item: any) {
    this.editingCertId = item?.id ?? null;
    if (item && !this.certEdit[item.id]) {
      this.certEdit[item.id] = {
        name: item.name,
        url: item.url,
        details: item.details,
        issuingOrganization: item.issuingOrganization,
        issueDate: item.issueDate,
        expiryDate: item.expiryDate,
        credentialId: item.credentialId,
        credentialUrl: item.credentialUrl,
      };
    }
  }

  cancelEditCert() {
    this.editingCertId = null;
  }

  findCert(id: number) {
    return this.certificates.find((c) => c.id === id);
  }

  cancelNewCertMeta() {
    this.lastUploadedCertId = null;
  }

  startEditOverview() { this.editingOverview = true; }
  startAddEducation() { this.editingEducationMode = true; this.editingEducationId = null; this.newEducation = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' }; }
  startAddExperience() { this.editingExperienceMode = true; this.editingExperienceId = null; this.newExperience = { hospitalName: '', position: '', yearsOfService: 1, details: '' }; }
  startAddCertificate() { this.editingCertificatesMode = true; this.certFile = undefined; this.certDescription = ''; }
  cancelAddCertificate() { this.editingCertificatesMode = false; this.certFile = undefined; this.certDescription = ''; if (this.certFileInputRef?.nativeElement) { this.certFileInputRef.nativeElement.value = ''; } }

  deleteCertificate(item: any) {
    if (!this.username) return;
    this.svc.deleteCertificate(this.username, item.id).subscribe({
      next: () => {
        this.certificates = this.certificates.filter((c) => c.id !== item.id);
        this.refreshProfileStats();
      },
    });
  }

  private refreshProfileStats() {
    if (this.username) {
      this.svc.getProfile(this.username).subscribe((p) => (this.profile = p));
    }
  }

  // Quick Action Navigation Handler
  onQuickAction(action: string) {
    switch (action) {
      case 'personal':
        this.startEditOverview();
        break;
      case 'education':
        this.activeTab = 'education';
        this.startAddEducation();
        break;
      case 'experience':
        this.activeTab = 'experience';
        this.startAddExperience();
        break;
      case 'certificates':
        this.activeTab = 'certificates';
        this.startAddCertificate();
        break;
      case 'documents':
        this.router.navigate(['/doctor/documents']);
        break;
      case 'password':
        this.router.navigate(['/doctor/change-password']);
        break;
    }
  }

  // Years of Experience Calculator
  getTotalExperienceYears(): string {
    if (!this.experiences?.length) return 'Not provided';
    const total = this.experiences.reduce((sum, exp) => sum + (Number(exp.yearsOfService) || 0), 0);
    if (total <= 0) return 'Not provided';
    return total === 1 ? '1 year' : `${total} years`;
  }

  // Hospital Name Helper
  getPrimaryHospitalName(): string {
    const named = (this.experiences || []).filter(exp => exp.hospitalName?.trim());
    if (!named.length) return 'Not provided';
    const latest = [...named].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
    return latest.hospitalName;
  }
}