import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientLayoutComponent } from './patient-layout.component';
import { ToastService } from '../core/services/toast.service';
import { PatientProfileService, PatientDto, UpdatePatientRequest } from '../core/services/patient-profile.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-patient-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PatientLayoutComponent],
  template: `
    <app-patient-layout>
      <div class="max-w-6xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 class="text-2xl font-bold text-gray-100 tracking-tight">Edit Profile</h2>
          <a class="btn-secondary self-start sm:self-auto" [routerLink]="backLink">
            <i class="fa-solid fa-arrow-left mr-2"></i> Back
          </a>
        </div>

        <section class="panel p-6 sm:p-8 space-y-8 animate-fade-in">
          
          <!-- Identity Section -->
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-gray-800">
            <div class="relative group">
              <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-800 overflow-hidden ring-4 ring-gray-800 shadow-xl flex items-center justify-center text-white text-3xl font-bold">
                <img *ngIf="editableProfile?.profileImageUrl; else initials" [src]="editableProfile?.profileImageUrl" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" (error)="onImageError()" />
                <ng-template #initials>
                  <span>{{ initialsFromName(editableProfile) }}</span>
                </ng-template>
              </div>
              <label class="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105" title="Change Photo">
                <input #profileFileInput type="file" class="hidden" (change)="onFileChange($event)" />
                <i class="fa-solid fa-camera text-sm"></i>
              </label>
            </div>
            
            <div class="text-center sm:text-left space-y-1 flex-1">
              <h3 class="text-2xl font-bold text-white">{{ fullName(editableProfile) }}</h3>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-400">
                <span class="bg-gray-800 px-2 py-1 rounded">ID: {{ editableProfile?.id ?? '—' }}</span>
                <span>{{ editableProfile?.email || '—' }}</span>
              </div>
              
              <div class="pt-3" *ngIf="file">
                 <button type="button" class="btn-primary text-sm py-1.5 px-3" (click)="uploadImage()" [disabled]="uploading">
                   <i class="fa-solid fa-cloud-arrow-up mr-2"></i>
                   {{ uploading ? 'Uploading...' : 'Confirm Upload' }}
                 </button>
              </div>
            </div>
          </div>

          <!-- Edit Form -->
          <form class="space-y-6" (ngSubmit)="save()">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-400">First Name</label>
                <input class="input" [(ngModel)]="form.firstName" name="firstName" placeholder="John" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-400">Last Name</label>
                <input class="input" [(ngModel)]="form.lastName" name="lastName" placeholder="Doe" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-400">Email Address</label>
                <input class="input" [(ngModel)]="form.email" name="email" type="email" placeholder="john@example.com" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-400">Contact Number</label>
                <input class="input" [(ngModel)]="form.contactInfo" name="contactInfo" placeholder="+1 (555) 000-0000" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-400">Date of Birth</label>
                <input class="input" [(ngModel)]="form.dateOfBirth" name="dateOfBirth" type="date" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-400">Gender</label>
                <div class="relative">
                  <select class="input appearance-none" [(ngModel)]="form.gender" name="gender">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <i class="fa-solid fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </div>

            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-400">Medical History / Illness Details</label>
              <textarea class="input min-h-[100px]" rows="4" [(ngModel)]="form.illnessDetails" name="illnessDetails" placeholder="Any existing conditions..."></textarea>
            </div>

            <div class="pt-6 border-t border-gray-800 flex items-center justify-end gap-3">
              <button type="button" class="btn-secondary" (click)="reset()" [disabled]="saving">Reset Changes</button>
              <button type="submit" class="btn-primary min-w-[120px]" [disabled]="saving">
                <i class="fa-solid fa-save mr-2" *ngIf="!saving"></i>
                <i class="fa-solid fa-circle-notch animate-spin mr-2" *ngIf="saving"></i>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>

            <!-- Status Messages -->
            <div *ngIf="error" class="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 flex items-center gap-3 animate-fade-in">
              <i class="fa-solid fa-circle-exclamation text-xl"></i>
              <span>{{ error }}</span>
            </div>
            
            <div *ngIf="success" class="p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 animate-fade-in">
              <i class="fa-solid fa-circle-check text-xl"></i>
              <span>Profile updated successfully!</span>
            </div>
            
          </form>
        </section>
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

  @Input() backLink: string = '/patient/profile';
  @Input() patient: PatientDto | null = null;

  editableProfile: PatientDto | null = null;
  form: UpdatePatientRequest = {} as any;
  file: File | null = null;
  uploading = false;
  saving = false;
  error: string | null = null;
  success = false;
  // Ref to reset file input after successful upload
  profileFileInput?: HTMLInputElement;

  ngOnInit() {
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
        };
      },
    });
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
    this.file = (input.files && input.files.length > 0) ? input.files[0] : null;
  }

  uploadImage() {
    const id = this.editableProfile?.id ?? this.auth.userId();
    if (!id || !this.file) return;
    this.uploading = true;
    this.svc.uploadProfileImage(id, this.file!).subscribe({
      next: (res) => {
        // Prefer Cloudinary URL to avoid saving internal /api/files/view/* URLs
        const imageUrl = res?.cloudinaryUrl || res?.imageUrl || res?.url || '';
        if (imageUrl) {
          // Backend already updates patient profile image to cloudinaryUrl in upload endpoint
          // Update UI immediately and optionally refresh profile
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
          // Reset file input and selection
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
        // Handle network interruption cases (status 0 / chunked encoding),
        // confirm via GET that data was actually updated, then treat as success.
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