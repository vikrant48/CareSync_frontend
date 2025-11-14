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
      <section class="panel p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Edit Patient Details</h2>
          <a class="btn-secondary" [routerLink]="backLink">Back to Profile</a>
        </div>

        <!-- Basic info header -->
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-white">
            <img *ngIf="editableProfile?.profileImageUrl; else initials" [src]="editableProfile?.profileImageUrl" class="w-full h-full object-cover" (error)="onImageError()" />
            <ng-template #initials>
              <span class="text-xl font-semibold">{{ initialsFromName(editableProfile) }}</span>
            </ng-template>
          </div>
          <div class="text-sm">
            <div class="text-lg font-semibold">{{ fullName(editableProfile) }}</div>
            <div class="text-gray-400">ID: {{ editableProfile?.id ?? '—' }}</div>
            <div class="text-gray-400">Email: {{ editableProfile?.email || '—' }}</div>
            <div class="text-gray-400">Mobile: {{ editableProfile?.contactInfo || '—' }}</div>
          </div>
        </div>

        <!-- Edit form -->
        <form class="grid gap-4" (ngSubmit)="save()">
          <div class="grid md:grid-cols-2 gap-4">
          <label class="grid gap-1">
            <span class="text-sm text-gray-300">First Name</span>
            <input class="input" [(ngModel)]="form.firstName" name="firstName" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm text-gray-300">Last Name</span>
            <input class="input" [(ngModel)]="form.lastName" name="lastName" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm text-gray-300">Email</span>
            <input class="input" [(ngModel)]="form.email" name="email" type="email" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm text-gray-300">Contact Info</span>
            <input class="input" [(ngModel)]="form.contactInfo" name="contactInfo" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm text-gray-300">Date of Birth</span>
            <input class="input" [(ngModel)]="form.dateOfBirth" name="dateOfBirth" type="date" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm text-gray-300">Gender</span>
            <select class="input" [(ngModel)]="form.gender" name="gender">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          </div>
          <label class="grid gap-1">
            <span class="text-sm text-gray-300">Illness Details</span>
            <textarea class="input" rows="3" [(ngModel)]="form.illnessDetails" name="illnessDetails"></textarea>
          </label>

        <!-- Image upload -->
        <div class="border border-gray-700 rounded p-4">
          <div class="font-medium mb-2">Profile Image</div>
          <div class="flex items-center gap-4">
            <input #profileFileInput type="file" (change)="onFileChange($event)" />
            <button type="button" class="btn-upload" (click)="uploadImage()" [disabled]="uploading || !file">
              {{ uploading ? 'Uploading…' : 'Upload' }}
            </button>
          </div>
        </div>

          <div class="flex items-center gap-2 justify-end">
            <button type="button" class="btn-secondary" (click)="reset()" [disabled]="saving">Reset</button>
            <button type="submit" class="btn-primary" [disabled]="saving">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
          </div>

          <div *ngIf="error" class="text-red-400">{{ error }}</div>
          <div *ngIf="success" class="text-green-400">Saved successfully</div>
        </form>
      </section>
    </app-patient-layout>
  `,
  styles: [
    `
    .panel { background-color: rgba(17,24,39,0.6); border: 1px solid #374151; border-radius: 0.75rem; }
    .input { background:#111827; border:1px solid #374151; border-radius:.5rem; padding:.5rem .75rem; color:#fff; }
    .btn-primary { background:#2563EB; color:#fff; padding:.5rem .75rem; border-radius:.5rem; }
    .btn-secondary { background:#374151; color:#fff; padding:.5rem .75rem; border-radius:.5rem; }
    .btn-upload { background:#10B981; color:#0b1b13; padding:.5rem .75rem; border-radius:.5rem; font-weight:600; }
    .btn-upload[disabled] { opacity:0.6; cursor:not-allowed; }
    `,
  ],
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
              error: () => {},
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
        this.toast.showError('Image upload failed');
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