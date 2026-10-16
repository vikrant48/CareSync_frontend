import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorProfileService, UpdateDoctorRequest, CreateEducationRequest, CreateExperienceRequest, CreateCertificateRequest } from '../../core/services/doctor-profile.service';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SpecializationAutocompleteComponent } from '../../shared/specialization-autocomplete.component';
import { ToastService } from '../../core/services/toast.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { SelectDropdownComponent, SelectOption } from '../../shared/select-dropdown.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { DoctorProfileRecordListComponent } from './doctor-profile-record-list.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { markForCheckOn } from '../../shared/utils/mark-for-check';
import { ConfirmService } from '../../core/services/confirm.service';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { AppValidators } from '../../shared/utils/validators';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [PageContainerComponent, CommonModule, FormsModule, SpecializationAutocompleteComponent, SelectDropdownComponent, EmptyStateComponent, PageLoaderComponent, DoctorProfileRecordListComponent],
  // OnPush: every subscription is piped through markForCheckOn so async results render
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-profile.component.html',
})
export class DoctorProfileComponent implements OnInit, HasUnsavedChanges {
  private cdr = inject(ChangeDetectorRef);
  private svc = inject(DoctorProfileService);
  auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
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
  degreeOptions: (string | SelectOption)[] = [];
  institutionOptions: (string | SelectOption)[] = [];
  customDegree: string = '';
  customInstitution: string = '';

  // Experience
  experiences: any[] = [];
  newExperience: CreateExperienceRequest = { hospitalName: '', position: '', yearsOfService: 1, details: '' };
  editingExperienceId: number | null = null;
  hospitalOptions: (string | SelectOption)[] = [];
  positionOptions: (string | SelectOption)[] = [];
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
    this.masterDataService.getAllMasterData().pipe(markForCheckOn(this.cdr)).subscribe({
      next: (data) => {
        if (data.genders) this.genders = data.genders;
        if (data.languages) this.languageOptions = data.languages;
        if (data.degrees) this.degreeOptions = [...data.degrees, { value: '__other__', label: 'Other (type it in)' }];
        if (data.institutions) this.institutionOptions = [...data.institutions, { value: '__other__', label: 'Other (type it in)' }];
        if (data.hospitals) this.hospitalOptions = [...data.hospitals, { value: '__other__', label: 'Other (type it in)' }];
        if (data.positions) this.positionOptions = [...data.positions, { value: '__other__', label: 'Other (type it in)' }];
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
    }).pipe(markForCheckOn(this.cdr)).subscribe({
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
    if (!this.username || this.savingProfile) return;
    if (!this.validateSection('profile')) return;
    this.savingProfile = true;
    const payload = {
      ...this.profileForm,
      dateOfBirth: this.profileForm.dateOfBirth || undefined,
    };
    this.svc.updateProfile(this.username, payload).pipe(markForCheckOn(this.cdr)).subscribe({
      next: (resp) => {
        this.profile = resp;
        this.editingOverview = false;
        this.savingProfile = false;
        this.toast.showSuccess('Profile updated successfully');
      },
      error: (e) => {
        this.savingProfile = false;
        this.toast.showError(e?.error?.message || 'Failed to update profile');
      },
    });
  }

  normalizeLanguages(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((x) => !!x);
    if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter((s) => !!s);
    return [];
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
    this.svc.uploadProfileImage(file, this.doctorId, 'Profile image').pipe(markForCheckOn(this.cdr)).subscribe({
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
    if (!this.validateSection('edu')) return;
    this.resolveOtherValues('edu');
    this.svc.addEducation(this.username, this.newEducation).pipe(markForCheckOn(this.cdr)).subscribe({
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
    this.clearValidation('edu');
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
    if (!this.validateSection('edu')) return;
    this.resolveOtherValues('edu');
    const id = this.editingEducationId;
    this.svc.updateEducation(this.username, id!, {
      degree: this.newEducation.degree,
      institution: this.newEducation.institution,
      yearOfCompletion: this.newEducation.yearOfCompletion,
      details: this.newEducation.details,
    }).pipe(markForCheckOn(this.cdr)).subscribe({
      next: () => {
        this.editingEducationId = null;
        this.newEducation = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' };
        this.svc.getEducations(this.username!).pipe(markForCheckOn(this.cdr)).subscribe({ next: (list) => (this.educations = list || []) });
        this.refreshProfileStats();
        this.editingEducationMode = false;
        this.toast.showSuccess('Education updated successfully');
      },
      error: (err) => this.toast.showError(err?.error?.message || 'Failed to update education'),
    });
  }

  async deleteEducation(item: any) {
    if (!this.username) return;
    const ok = await this.confirm.ask({ title: 'Delete education entry', message: 'Delete this education entry? This cannot be undone.', confirmLabel: 'Delete', cancelLabel: 'Keep', danger: true });
    if (!ok) return;
    this.svc.deleteEducation(this.username, item.id).pipe(markForCheckOn(this.cdr)).subscribe({
      next: () => {
        this.educations = this.educations.filter((e) => e.id !== item.id);
        this.refreshProfileStats();
      },
    });
  }

  addExperience() {
    if (!this.username) return;
    if (!this.validateSection('exp')) return;
    this.resolveOtherValues('exp');
    this.svc.addExperience(this.username, this.newExperience).pipe(markForCheckOn(this.cdr)).subscribe({
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
    this.clearValidation('exp');
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
    if (!this.validateSection('exp')) return;
    this.resolveOtherValues('exp');
    const id = this.editingExperienceId;
    this.svc.updateExperience(this.username, id!, {
      hospitalName: this.newExperience.hospitalName,
      position: this.newExperience.position,
      yearsOfService: this.newExperience.yearsOfService,
      details: this.newExperience.details,
    }).pipe(markForCheckOn(this.cdr)).subscribe({
      next: () => {
        this.editingExperienceId = null;
        this.newExperience = { hospitalName: '', position: '', yearsOfService: 1, details: '' };
        this.svc.getExperiences(this.username!).pipe(markForCheckOn(this.cdr)).subscribe({ next: (list) => (this.experiences = list || []) });
        this.refreshProfileStats();
        this.editingExperienceMode = false;
        this.toast.showSuccess('Experience updated successfully');
      },
      error: (err) => this.toast.showError(err?.error?.message || 'Failed to update experience'),
    });
  }

  async deleteExperience(item: any) {
    if (!this.username) return;
    const ok = await this.confirm.ask({ title: 'Delete experience entry', message: 'Delete this experience entry? This cannot be undone.', confirmLabel: 'Delete', cancelLabel: 'Keep', danger: true });
    if (!ok) return;
    this.svc.deleteExperience(this.username, item.id).pipe(markForCheckOn(this.cdr)).subscribe({
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
    this.svc.uploadCertificateFile(this.certFile, this.doctorId, this.certDescription).pipe(markForCheckOn(this.cdr)).subscribe({
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
          this.svc.updateCertificate(this.username, certificateId, payload).pipe(markForCheckOn(this.cdr)).subscribe({
            next: () => this.svc.getCertificates(this.username!).pipe(markForCheckOn(this.cdr)).subscribe({
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

  // ================= Inline validation =================
  savingProfile = false;
  private touched = new Set<string>();
  private submittedSections = new Set<'profile' | 'edu' | 'exp'>();

  private static readonly SECTION_FIELDS: Record<'profile' | 'edu' | 'exp', string[]> = {
    profile: ['firstName', 'lastName', 'specialization', 'consultationFees', 'email', 'contactInfo',
      'alternateContactInfo', 'dateOfBirth', 'licenseNumber', 'address', 'bio'],
    edu: ['eduDegree', 'customDegree', 'eduInstitution', 'customInstitution', 'eduYear', 'eduDetails'],
    exp: ['expHospital', 'customHospital', 'expPosition', 'customPosition', 'expYears', 'expDetails'],
  };

  markTouched(key: string) {
    this.touched.add(key);
  }

  private sectionOf(key: string): 'profile' | 'edu' | 'exp' {
    return (Object.keys(DoctorProfileComponent.SECTION_FIELDS) as ('profile' | 'edu' | 'exp')[])
      .find((sec) => DoctorProfileComponent.SECTION_FIELDS[sec].includes(key)) ?? 'profile';
  }

  /** Message for a field, shown after it was touched or its section was submitted. */
  fieldError(key: string): string {
    if (!this.touched.has(key) && !this.submittedSections.has(this.sectionOf(key))) return '';
    return this.validateField(key);
  }

  private validateField(key: string): string {
    const pf = this.profileForm as any;
    const text = (v: unknown) => String(v ?? '').trim();
    const check = (value: unknown, fn: (c: AbstractControl) => any) => !!fn({ value } as AbstractControl);
    const currentYear = new Date().getFullYear();
    switch (key) {
      case 'firstName': return text(pf.firstName) ? '' : 'First name is required.';
      case 'lastName': return text(pf.lastName) ? '' : 'Last name is required.';
      case 'specialization': return text(pf.specialization) ? '' : 'Specialization is required.';
      case 'email':
        if (!text(pf.email)) return 'Email is required.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(pf.email)) ? '' : 'Enter a valid email address.';
      case 'contactInfo':
        return check(pf.contactInfo, AppValidators.phone(10)) ? 'Enter a valid 10-digit mobile number.' : '';
      case 'alternateContactInfo':
        return check(pf.alternateContactInfo, AppValidators.phone(10)) ? 'Enter a valid 10-digit mobile number.' : '';
      case 'consultationFees': {
        const fee = pf.consultationFees;
        if (fee === null || fee === undefined || fee === '') return '';
        const n = Number(fee);
        return Number.isFinite(n) && n >= 0 && n <= 100000 ? '' : 'Enter a fee between 0 and 100000.';
      }
      case 'dateOfBirth':
        if (check(pf.dateOfBirth, AppValidators.notInFuture())) return "Date of birth can't be in the future.";
        return check(pf.dateOfBirth, AppValidators.maxAge(100)) ? 'Enter a date of birth within the last 100 years.' : '';
      case 'licenseNumber': return text(pf.licenseNumber).length > 50 ? 'Keep this under 50 characters.' : '';
      case 'address': return text(pf.address).length > 250 ? 'Keep this under 250 characters.' : '';
      case 'bio': return text(pf.bio).length > 1000 ? 'Keep this under 1000 characters.' : '';

      case 'eduDegree': return text(this.newEducation.degree) ? '' : 'Degree is required.';
      case 'customDegree':
        return this.newEducation.degree === '__other__' && !text(this.customDegree) ? 'Type the degree.' : '';
      case 'eduInstitution': return text(this.newEducation.institution) ? '' : 'Institution is required.';
      case 'customInstitution':
        return this.newEducation.institution === '__other__' && !text(this.customInstitution) ? 'Type the institution.' : '';
      case 'eduYear': {
        const y = Number(this.newEducation.yearOfCompletion);
        return Number.isInteger(y) && y >= 1950 && y <= currentYear + 6 ? '' : `Enter a year between 1950 and ${currentYear + 6}.`;
      }
      case 'eduDetails': return text(this.newEducation.details).length > 200 ? 'Keep this under 200 characters.' : '';

      case 'expHospital': return text(this.newExperience.hospitalName) ? '' : 'Hospital or clinic is required.';
      case 'customHospital':
        return this.newExperience.hospitalName === '__other__' && !text(this.customHospital) ? 'Type the hospital or clinic.' : '';
      case 'expPosition': return text(this.newExperience.position) ? '' : 'Role is required.';
      case 'customPosition':
        return this.newExperience.position === '__other__' && !text(this.customPosition) ? 'Type the role.' : '';
      case 'expYears': {
        const y = Number(this.newExperience.yearsOfService);
        return Number.isFinite(y) && y >= 0 && y <= 70 ? '' : 'Enter years of service between 0 and 70.';
      }
      case 'expDetails': return text(this.newExperience.details).length > 200 ? 'Keep this under 200 characters.' : '';
      default: return '';
    }
  }

  /** Reveal all errors in a section; focus the first invalid field. Returns true when valid. */
  private validateSection(section: 'profile' | 'edu' | 'exp'): boolean {
    this.submittedSections.add(section);
    const first = DoctorProfileComponent.SECTION_FIELDS[section].find((k) => this.validateField(k));
    if (!first) return true;
    this.toast.showError('Please fix the highlighted fields.');
    setTimeout(() => document.getElementById(`dp-${first}`)?.focus());
    return false;
  }

  private clearValidation(section: 'profile' | 'edu' | 'exp') {
    this.submittedSections.delete(section);
    DoctorProfileComponent.SECTION_FIELDS[section].forEach((k) => this.touched.delete(k));
  }

  /** Swap "Other (type it in)" for what the doctor typed, and keep it selectable afterwards. */
  private resolveOtherValues(section: 'edu' | 'exp') {
    const resolve = (value: string, custom: string, list: (string | SelectOption)[]) => {
      if (value !== '__other__') return value;
      const typed = custom.trim();
      if (!list.some((o) => (typeof o === 'string' ? o : o.value) === typed)) list.splice(list.length - 1, 0, typed);
      return typed;
    };
    if (section === 'edu') {
      this.newEducation.degree = resolve(this.newEducation.degree, this.customDegree, this.degreeOptions);
      this.newEducation.institution = resolve(this.newEducation.institution, this.customInstitution, this.institutionOptions);
      this.customDegree = '';
      this.customInstitution = '';
    } else {
      this.newExperience.hospitalName = resolve(this.newExperience.hospitalName, this.customHospital, this.hospitalOptions);
      this.newExperience.position = resolve(this.newExperience.position, this.customPosition, this.positionOptions);
      this.customHospital = '';
      this.customPosition = '';
    }
  }

  /** Snapshot of the profile form when editing starts, to detect unsaved edits */
  private profileFormSnapshot = '';

  startEditOverview() {
    this.editingOverview = true;
    this.clearValidation('profile');
    this.profileFormSnapshot = JSON.stringify(this.profileForm);
  }

  hasUnsavedChanges(): boolean {
    return this.editingOverview && JSON.stringify(this.profileForm) !== this.profileFormSnapshot;
  }

  /** Browser close / refresh with unsaved edits */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  startAddEducation() { this.clearValidation('edu'); this.editingEducationMode = true; this.editingEducationId = null; this.newEducation = { degree: '', institution: '', yearOfCompletion: new Date().getFullYear(), details: '' }; }
  startAddExperience() { this.clearValidation('exp'); this.editingExperienceMode = true; this.editingExperienceId = null; this.newExperience = { hospitalName: '', position: '', yearsOfService: 1, details: '' }; }
  startAddCertificate() { this.editingCertificatesMode = true; this.certFile = undefined; this.certDescription = ''; }
  cancelAddCertificate() { this.editingCertificatesMode = false; this.certFile = undefined; this.certDescription = ''; if (this.certFileInputRef?.nativeElement) { this.certFileInputRef.nativeElement.value = ''; } }

  async deleteCertificate(item: any) {
    if (!this.username) return;
    const ok = await this.confirm.ask({ title: 'Delete certificate', message: 'Delete this certificate? This cannot be undone.', confirmLabel: 'Delete', cancelLabel: 'Keep', danger: true });
    if (!ok) return;
    this.svc.deleteCertificate(this.username, item.id).pipe(markForCheckOn(this.cdr)).subscribe({
      next: () => {
        this.certificates = this.certificates.filter((c) => c.id !== item.id);
        this.refreshProfileStats();
      },
    });
  }

  private refreshProfileStats() {
    if (this.username) {
      this.svc.getProfile(this.username).pipe(markForCheckOn(this.cdr)).subscribe((p) => (this.profile = p));
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