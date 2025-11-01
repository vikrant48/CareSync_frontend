import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientProfileService, PatientDto, UpdatePatientRequest, MedicalHistoryItem } from '../../core/services/patient-profile.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, PatientLayoutComponent],
  template: `
    <app-patient-layout>
    <div class="grid gap-6">
      <p *ngIf="loadingProfile()" class="text-gray-400">Loading profile…</p>
      <!-- Profile Picture Upload -->
      <section class="panel p-6">
        <h2 class="text-xl font-semibold mb-4">Profile Picture</h2>
        <div class="flex items-start gap-6">
          <img
            *ngIf="profile()?.profileImageUrl; else noImg"
            [src]="profile()?.profileImageUrl"
            alt="Profile"
            class="w-24 h-24 rounded object-cover border border-gray-700"
          />
          <ng-template #noImg>
            <div class="w-24 h-24 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500">
              No Image
            </div>
          </ng-template>

          <div class="flex-1 grid gap-2">
            <input type="file" accept="image/*" (change)="onProfileFileSelected($event)" />
            <input class="input" placeholder="Description (optional)" [(ngModel)]="imageDescription" name="imgDesc" />
            <div class="flex gap-2">
              <button class="btn-primary" (click)="uploadProfileImage()" [disabled]="!selectedImage || uploadingImage()">
                {{ uploadingImage() ? 'Uploading...' : 'Upload & Update' }}
              </button>
              <button class="btn-secondary" type="button" (click)="clearSelectedImage()" [disabled]="uploadingImage()">Clear</button>
            </div>
            <div *ngIf="profileImagePreview" class="mt-2">
              <span class="text-sm text-gray-400">Preview:</span>
              <img [src]="profileImagePreview" alt="Preview" class="w-20 h-20 rounded object-cover border border-gray-700" />
            </div>
            <p *ngIf="error()" class="text-red-400 text-sm">{{ error() }}</p>
            <p *ngIf="success()" class="text-green-400 text-sm">Profile image updated.</p>
          </div>
        </div>
      </section>
      <!-- Profile Edit -->
      <section class="panel p-6">
        <h2 class="text-xl font-semibold mb-4">My Profile</h2>
        <form class="grid gap-4" (ngSubmit)="saveProfile()">
          <div class="grid md:grid-cols-2 gap-4">
            <label class="grid gap-1">
              <span class="text-sm text-gray-300">First Name</span>
              <input class="input" [(ngModel)]="editable().firstName" name="firstName" />
            </label>
            <label class="grid gap-1">
              <span class="text-sm text-gray-300">Last Name</span>
              <input class="input" [(ngModel)]="editable().lastName" name="lastName" />
            </label>
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <label class="grid gap-1">
              <span class="text-sm text-gray-300">Email</span>
              <input class="input" [(ngModel)]="editable().email" name="email" type="email" />
            </label>
            <label class="grid gap-1">
              <span class="text-sm text-gray-300">Contact Info</span>
              <input class="input" [(ngModel)]="editable().contactInfo" name="contactInfo" />
            </label>
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <label class="grid gap-1">
              <span class="text-sm text-gray-300">Date of Birth</span>
              <input class="input" [(ngModel)]="editable().dateOfBirth" name="dateOfBirth" type="date" />
            </label>
            <label class="grid gap-1">
              <span class="text-sm text-gray-300">Gender</span>
              <select class="input" [(ngModel)]="editable().gender" name="gender">
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
          </div>
          <div class="grid gap-4">
            <label class="grid gap-1">
              <span class="text-sm text-gray-300">Illness Details</span>
              <textarea class="input" [(ngModel)]="editable().illnessDetails" name="illnessDetails"></textarea>
            </label>
          </div>

          <div class="flex gap-2 mt-2">
            <button class="btn-primary" type="submit" [disabled]="saving()">Save Changes</button>
            <button class="btn-secondary" type="button" (click)="reset()" [disabled]="saving()">Reset</button>
          </div>
          <p *ngIf="error()" class="text-red-400 text-sm mt-2">{{ error() }}</p>
          <p *ngIf="success()" class="text-green-400 text-sm mt-2">Profile updated.</p>
        </form>
      </section>

      <!-- Medical History -->
      <section class="panel p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Medical History</h2>
          <button class="btn-secondary" (click)="loadHistory()" [disabled]="loadingHistory()">Refresh</button>
        </div>
        <div *ngIf="loadingHistory()" class="text-gray-400">Loading history…</div>
        <div *ngIf="medicalHistory().length === 0" class="text-gray-400">No medical history found.</div>
        <ul class="grid gap-3" *ngIf="medicalHistory().length > 0">
          <li *ngFor="let item of medicalHistory()" class="border border-gray-700 rounded p-4">
            <div class="flex items-center justify-between">
              <span class="font-medium">Visit: {{ item.visitDate | date:'mediumDate' }}</span>
              <span class="text-sm text-gray-400">ID: {{ item.id }}</span>
            </div>
            <div class="grid md:grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <div><span class="text-gray-400">Diagnosis:</span> {{ item.diagnosis || '-' }}</div>
                <div><span class="text-gray-400">Symptoms:</span> {{ item.symptoms || '-' }}</div>
                <div><span class="text-gray-400">Treatment:</span> {{ item.treatment || '-' }}</div>
              </div>
              <div>
                <div><span class="text-gray-400">Medicine:</span> {{ item.medicine || '-' }}</div>
                <div><span class="text-gray-400">Doses:</span> {{ item.doses || '-' }}</div>
                <div><span class="text-gray-400">Notes:</span> {{ item.notes || '-' }}</div>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
    </app-patient-layout>
  `,
})
export class PatientProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(PatientProfileService);

  profile = signal<PatientDto | null>(null);
  editable = signal<UpdatePatientRequest>({});
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  loadingProfile = signal(false);

  medicalHistory = signal<MedicalHistoryItem[]>([]);
  loadingHistory = signal(false);

  // Image upload state
  uploadingImage = signal(false);
  selectedImage: File | null = null;
  profileImagePreview: string | null = null;
  imageDescription = '';

  ngOnInit(): void {
    this.loadProfile();
    this.loadHistory();
  }

  loadProfile() {
    const username = this.auth.username();
    if (!username) return;
    this.loadingProfile.set(true);
    this.api.getProfile(username).subscribe({
      next: (dto) => {
        this.profile.set(dto);
        this.editable.set({
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          contactInfo: dto.contactInfo,
          dateOfBirth: dto.dateOfBirth,
          illnessDetails: dto.illnessDetails,
          isActive: dto.isActive,
        });
        this.loadingProfile.set(false);
      },
      error: (e) => {
        console.error('Failed to load patient profile', e);
        this.error.set('Failed to load profile');
        this.loadingProfile.set(false);
      },
    });
  }

  saveProfile() {
    const id = this.auth.userId();
    if (!id) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);
    this.api.updateProfile(id, this.editable()).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.success.set(true);
        this.saving.set(false);
      },
      error: (e) => {
        console.error('Failed to update profile', e);
        this.error.set('Update failed');
        this.saving.set(false);
      },
    });
  }

  reset() {
    const dto = this.profile();
    if (!dto) return;
    this.editable.set({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      contactInfo: dto.contactInfo,
      dateOfBirth: dto.dateOfBirth,
      illnessDetails: dto.illnessDetails,
      isActive: dto.isActive,
    });
    this.error.set(null);
    this.success.set(false);
  }

  loadHistory() {
    const patientId = this.auth.userId();
    if (!patientId) return;
    this.loadingHistory.set(true);
    this.api.getMedicalHistory(patientId).subscribe({
      next: (items) => {
        this.medicalHistory.set(items || []);
        this.loadingHistory.set(false);
      },
      error: (e) => {
        console.error('Failed to load medical history', e);
        this.loadingHistory.set(false);
      },
    });
  }

  onProfileFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedImage = file;
    this.profileImagePreview = file ? URL.createObjectURL(file) : null;
    this.success.set(false);
    this.error.set(null);
  }

  clearSelectedImage() {
    this.selectedImage = null;
    this.profileImagePreview = null;
  }

  uploadProfileImage() {
    if (!this.selectedImage) return;
    const id = this.auth.userId();
    if (!id) return;
    this.uploadingImage.set(true);
    this.error.set(null);
    this.success.set(false);
    this.api.uploadProfileImage(id, this.selectedImage, this.imageDescription).subscribe({
      next: (resp) => {
        const imageUrl = resp?.cloudinaryUrl || resp?.url;
        if (!imageUrl) {
          this.error.set('Upload succeeded but no image URL returned');
          this.uploadingImage.set(false);
          return;
        }
        // Files endpoint auto-updates profile image; refresh profile state
        this.loadProfile();
        this.success.set(true);
        this.uploadingImage.set(false);
        this.clearSelectedImage();
      },
      error: (e) => {
        console.error('Profile image upload failed', e);
        this.error.set('Upload failed');
        this.uploadingImage.set(false);
      },
    });
  }
}