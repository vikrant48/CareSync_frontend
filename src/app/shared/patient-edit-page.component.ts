import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientLayoutComponent } from './patient-layout.component';
import { ToastService } from '../core/services/toast.service';
import { PatientProfileService, PatientDto, UpdatePatientRequest } from '../core/services/patient-profile.service';
import { AuthService } from '../core/services/auth.service';
import { MasterDataService } from '../core/services/master-data.service';
import { SelectDropdownComponent } from './select-dropdown.component';
import { DatePickerComponent } from './date-picker.component';

@Component({
  selector: 'app-patient-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PatientLayoutComponent, SelectDropdownComponent, DatePickerComponent],
  template: `
    <app-patient-layout>
      <div class="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        
        <!-- Header Row -->
        <div class="space-y-1 sm:space-y-2 mb-6">
          <div class="flex items-center gap-3">
            <a [routerLink]="backLink"
               class="bg-[#151b2b] hover:bg-[#1b2333] border border-[#2a3347] hover:border-[#3a4763] text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm">
              <i class="fa-solid fa-arrow-left text-xs"></i>
              <span>Back</span>
            </a>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Edit Profile</h2>
          </div>
          <p class="text-xs sm:text-sm text-[#9aa3b8] pl-0.5">
            Update your personal information and keep your profile up to date.
          </p>
        </div>

        <!-- Top Profile Summary Header Card -->
        <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <!-- Left Identity Info -->
          <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left w-full md:w-auto">
            <div class="relative shrink-0">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1b2333] border-2 border-[#2a3347] overflow-hidden flex items-center justify-center text-white text-2xl font-bold shadow-md">
                <img *ngIf="editableProfile?.profileImageUrl; else initials" [src]="editableProfile?.profileImageUrl" class="w-full h-full object-cover" (error)="onImageError()" />
                <ng-template #initials>
                  <span>{{ initialsFromName(editableProfile) }}</span>
                </ng-template>
              </div>
              <label class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#5b6cf0] hover:bg-[#4a5be0] text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-105" title="Change Photo">
                <input #profileFileInput type="file" class="hidden" (change)="onFileChange($event)" />
                <i class="fa-solid fa-camera text-xs"></i>
              </label>
            </div>

            <div class="space-y-1.5 min-w-0">
              <h3 class="text-xl sm:text-2xl font-extrabold text-white truncate">{{ fullName(editableProfile) }}</h3>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-[#9aa3b8]">
                <span class="bg-[#1b2333] border border-[#2a3347] px-2.5 py-1 rounded-lg font-medium text-gray-300">ID: {{ editableProfile?.id ?? 'NA' }}</span>
                <span class="flex items-center gap-1.5"><i class="fa-regular fa-envelope text-[#5b6cf0]"></i> {{ editableProfile?.email || 'NA' }}</span>
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-phone text-[#5b6cf0]"></i> {{ editableProfile?.contactInfo || 'NA' }}</span>
              </div>

              <div class="pt-1" *ngIf="file">
                <button type="button" class="bg-[#5b6cf0] hover:bg-[#4a5be0] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5" (click)="uploadImage()" [disabled]="uploading">
                  <i class="fa-solid fa-cloud-arrow-up text-xs"></i>
                  {{ uploading ? 'Uploading...' : 'Confirm Upload' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Right Profile Completion Status -->
          <div class="w-full md:w-72 bg-[#121724]/60 border border-[#2a3347]/60 rounded-xl p-4 space-y-2 shrink-0">
            <div class="flex items-center justify-between text-xs font-semibold">
              <span class="text-[#9aa3b8]">Profile Completion</span>
              <span class="text-[#5b6cf0] font-bold">{{ completionPercentage }}%</span>
            </div>
            <div class="w-full h-2 bg-[#1b2333] rounded-full overflow-hidden border border-[#2a3347]/40">
              <div class="h-full bg-[#5b6cf0] rounded-full transition-all duration-500" [style.width.%]="completionPercentage"></div>
            </div>
            <div class="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 pt-0.5">
              <i class="fa-solid fa-circle-check text-xs"></i>
              <span>{{ completionPercentage >= 80 ? 'Great! Your profile is almost complete.' : 'Complete your profile details.' }}</span>
            </div>
          </div>
        </div>

        <!-- Main Edit Form Card Box -->
        <form (ngSubmit)="save()" class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl space-y-8">
          
          <!-- Personal Information Section -->
          <div class="space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[#2a3347]">
              <div class="w-7 h-7 rounded-lg bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-user"></i>
              </div>
              <h3 class="text-base font-bold text-white">Personal Information</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <!-- First Name -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-[#9aa3b8] uppercase tracking-wider">
                  FIRST NAME <span class="text-rose-500">*</span>
                </label>
                <input class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#5a657d] outline-none transition-colors"
                       [(ngModel)]="form.firstName" name="firstName" placeholder="Enter first name" />
              </div>

              <!-- Last Name -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-[#9aa3b8] uppercase tracking-wider">
                  LAST NAME <span class="text-rose-500">*</span>
                </label>
                <input class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#5a657d] outline-none transition-colors"
                       [(ngModel)]="form.lastName" name="lastName" placeholder="Enter last name" />
              </div>

              <!-- Email Address -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-[#9aa3b8] uppercase tracking-wider">
                  EMAIL ADDRESS <span class="text-rose-500">*</span>
                </label>
                <div class="relative flex items-center">
                  <div class="absolute left-3.5 text-[#5b6cf0] pointer-events-none text-xs sm:text-sm">
                    <i class="fa-regular fa-envelope"></i>
                  </div>
                  <input class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#5a657d] outline-none transition-colors"
                         [(ngModel)]="form.email" name="email" type="email" placeholder="email@example.com" />
                </div>
              </div>

              <!-- Contact Number -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-[#9aa3b8] uppercase tracking-wider">
                  CONTACT NUMBER <span class="text-rose-500">*</span>
                </label>
                <div class="relative flex items-center">
                  <div class="absolute left-3.5 text-[#5b6cf0] pointer-events-none text-xs sm:text-sm">
                    <i class="fa-solid fa-phone"></i>
                  </div>
                  <input class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#5a657d] outline-none transition-colors"
                         [(ngModel)]="form.contactInfo" name="contactInfo" placeholder="+91 0000000000" />
                </div>
              </div>

              <!-- Date of Birth -->
              <div class="space-y-1.5">
                <app-date-picker
                  [(ngModel)]="form.dateOfBirth"
                  name="dateOfBirth"
                  label="DATE OF BIRTH *"
                  placeholder="DD-MM-YYYY">
                </app-date-picker>
              </div>

              <!-- Gender -->
              <div class="space-y-1.5">
                <app-select-dropdown 
                   label="GENDER *" 
                   [options]="genders" 
                   placeholder="Select Gender"
                   [(ngModel)]="form.gender" 
                   name="gender">
                </app-select-dropdown>
              </div>

              <!-- Blood Group -->
              <div class="space-y-1.5 md:col-span-1">
                <app-select-dropdown 
                   label="BLOOD GROUP *" 
                   [options]="bloodGroups" 
                   placeholder="Select Blood Group"
                   [autoCapitalize]="false"
                   [(ngModel)]="form.bloodGroup" 
                   name="bloodGroup">
                </app-select-dropdown>
              </div>
            </div>
          </div>

          <!-- Medical Information Section -->
          <div class="space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-[#2a3347]">
              <div class="w-7 h-7 rounded-lg bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-file-lines"></i>
              </div>
              <h3 class="text-base font-bold text-white">Medical Information</h3>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-[#9aa3b8] uppercase tracking-wider">
                MEDICAL HISTORY / ILLNESS DETAILS
              </label>
              <div class="relative">
                <textarea class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-[#5a657d] outline-none transition-colors min-h-[110px]"
                          rows="4" [(ngModel)]="form.illnessDetails" name="illnessDetails"
                          placeholder="Any existing conditions, allergies, or relevant medical history..."></textarea>
                <div class="text-[10px] text-[#5a657d] font-semibold text-right pt-1">
                  {{ illnessDetailsCharCount }}/500
                </div>
              </div>
            </div>
          </div>

          <!-- Status Messages -->
          <div *ngIf="error" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
            <i class="fa-solid fa-circle-exclamation text-lg shrink-0"></i>
            <span class="text-xs sm:text-sm font-medium">{{ error }}</span>
          </div>
          
          <div *ngIf="success" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
            <i class="fa-solid fa-circle-check text-lg shrink-0"></i>
            <span class="text-xs sm:text-sm font-medium">Profile updated successfully!</span>
          </div>

          <!-- Form Actions Footer -->
          <div class="pt-5 border-t border-[#2a3347] flex flex-wrap items-center justify-between gap-4">
            <button type="button" (click)="reset()" [disabled]="saving"
                    class="text-xs font-bold text-[#9aa3b8] hover:text-white flex items-center gap-2 transition-colors cursor-pointer bg-transparent border-0 p-0">
              <i class="fa-solid fa-rotate-right text-xs text-[#5b6cf0]"></i>
              <span>Reset Changes</span>
            </button>

            <div class="flex items-center gap-3 ml-auto">
              <a [routerLink]="backLink"
                 class="bg-[#1b2333] hover:bg-[#253047] border border-[#2a3347] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer">
                Cancel
              </a>
              <button type="submit" [disabled]="saving"
                      class="bg-[#5b6cf0] hover:bg-[#4a5be0] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#5b6cf0]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                <i class="fa-solid fa-floppy-disk text-xs" *ngIf="!saving"></i>
                <i class="fa-solid fa-circle-notch animate-spin text-xs" *ngIf="saving"></i>
                <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </app-patient-layout>
  `,
  styles: [],
})
export class PatientEditPageComponent implements OnInit {
  private svc = inject(PatientProfileService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private masterDataService = inject(MasterDataService);

  @Input() backLink: string = '/patient/profile';
  @Input() patient: PatientDto | null = null;

  editableProfile: PatientDto | null = null;
  form: UpdatePatientRequest = {} as any;
  file: File | null = null;
  uploading = false;
  saving = false;
  error: string | null = null;
  success = false;
  profileFileInput?: HTMLInputElement;

  genders: string[] = [];
  bloodGroups: string[] = [];

  ngOnInit() {
    this.masterDataService.getAllMasterData().subscribe({
      next: (data) => {
        if (data.genders?.length) this.genders = data.genders;
        if (data.bloodGroups?.length) this.bloodGroups = data.bloodGroups;
      }
    });
    if (this.patient) {
      this.editableProfile = { ...this.patient };
      this.form = {
        firstName: this.patient.firstName,
        lastName: this.patient.lastName,
        dateOfBirth: this.patient.dateOfBirth,
        contactInfo: this.patient.contactInfo,
        illnessDetails: this.patient.illnessDetails,
        email: this.patient.email,
        isActive: this.patient.isActive,
        gender: this.patient.gender,
        bloodGroup: this.patient.bloodGroup,
      };
      return;
    }
    const uname = this.auth.username();
    if (!uname) return;
    this.svc.getProfile(uname).subscribe({
      next: (p) => {
        this.editableProfile = p;
        this.form = {
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: p.dateOfBirth,
          contactInfo: p.contactInfo,
          illnessDetails: p.illnessDetails,
          email: p.email,
          isActive: p.isActive,
          gender: p.gender,
          bloodGroup: p.bloodGroup,
        };
      },
    });
  }

  get completionPercentage(): number {
    if (!this.editableProfile) return 0;
    const fields = [
      this.form.firstName,
      this.form.lastName,
      this.form.email,
      this.form.contactInfo,
      this.form.dateOfBirth,
      this.form.gender,
      this.form.bloodGroup,
      this.form.illnessDetails,
      this.editableProfile.profileImageUrl
    ];
    const filled = fields.filter(f => f && String(f).trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }

  get illnessDetailsCharCount(): number {
    return this.form.illnessDetails ? this.form.illnessDetails.length : 0;
  }

  fullName(p?: PatientDto | null) {
    if (!p) return 'Patient';
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
    return name || p.username || 'Patient';
  }

  initialsFromName(p?: PatientDto | null) {
    const n = this.fullName(p);
    return n?.charAt(0) || 'P';
  }

  onImageError() {
    if (this.editableProfile) this.editableProfile.profileImageUrl = '';
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.profileFileInput = input;
    const selected = input.files && input.files.length > 0 ? input.files[0] : null;

    if (selected) {
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (selected.size > maxSizeBytes) {
        this.toast.showError('File too large. Maximum allowed size is 5 MB. Please choose a smaller image.');
        input.value = '';
        this.file = null;
        return;
      }

      if (!allowedTypes.includes(selected.type)) {
        this.toast.showError('Unsupported file type. Please upload a JPG, JPEG, PNG, or WebP image.');
        input.value = '';
        this.file = null;
        return;
      }
    }

    this.file = selected;
  }

  uploadImage() {
    const id = this.editableProfile?.id ?? this.auth.userId();
    if (!id || !this.file) return;
    this.uploading = true;
    this.svc.uploadProfileImage(id, this.file!).subscribe({
      next: (res) => {
        const imageUrl = res?.cloudinaryUrl || res?.imageUrl || res?.url || '';
        if (imageUrl) {
          if (this.editableProfile) {
            this.editableProfile = { ...this.editableProfile, profileImageUrl: imageUrl } as PatientDto;
          }
          this.toast.showSuccess('Profile image updated');
          this.uploading = false;
          const uname = this.auth.username();
          if (uname) {
            this.svc.getProfile(uname).subscribe({
              next: (p) => (this.editableProfile = p),
              error: () => { },
            });
          }
          this.file = null;
          this.profileFileInput && (this.profileFileInput.value = '');
        } else {
          this.toast.showError('Upload succeeded but URL missing');
          this.uploading = false;
        }
      },
      error: (e) => {
        console.error('Upload failed', e);
        const msg = typeof e?.error === 'string' ? e.error : (e?.error?.message || 'Image upload failed');
        this.toast.showError(msg);
        this.uploading = false;
      },
    });
  }

  reset() {
    const p = this.editableProfile;
    if (!p) return;
    this.form = {
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth,
      contactInfo: p.contactInfo,
      illnessDetails: p.illnessDetails,
      email: p.email,
      isActive: p.isActive,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
    };
    this.error = null;
    this.success = false;
  }

  save() {
    const id = this.editableProfile?.id ?? this.auth.userId();
    if (!id) return;
    this.saving = true;
    this.error = null;
    this.success = false;
    this.svc.updateProfile(id, this.form).subscribe({
      next: (updated) => {
        this.success = true;
        this.saving = false;
        this.toast.showSuccess('Profile updated successfully');
        this.router.navigate([this.backLink]);
      },
      error: (e) => {
        if (e && e.status === 0) {
          const uname = this.auth.username();
          if (uname) {
            this.svc.getProfile(uname).subscribe({
              next: (p) => {
                if (p) {
                  const keys: (keyof UpdatePatientRequest)[] = [
                    'firstName', 'lastName', 'email', 'contactInfo', 'dateOfBirth', 'gender', 'illnessDetails'
                  ];
                  const allMatch = keys.every((k) => (p as any)[k] === (this.form as any)[k]);
                  if (allMatch) {
                    this.success = true;
                    this.saving = false;
                    this.toast.showSuccess('Profile updated successfully');
                    this.router.navigate([this.backLink]);
                    return;
                  }
                }
                this.error = 'Update failed';
                this.toast.showError('Update failed');
                this.saving = false;
              },
              error: () => {
                this.error = 'Update failed';
                this.toast.showError('Update failed');
                this.saving = false;
              }
            });
            return;
          }
        }
        if (e && (e.status === 401 || e.status === 403)) {
          this.error = 'Access denied. Please re-authenticate.';
          this.toast.showError('Access denied. Please re-authenticate.');
          this.saving = false;
          return;
        }
        console.error('Failed to update profile', e);
        this.error = 'Update failed';
        this.toast.showError('Update failed');
        this.saving = false;
      },
    });
  }
}