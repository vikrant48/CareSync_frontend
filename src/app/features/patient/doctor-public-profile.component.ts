import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorDetailsPanelComponent } from '../../shared/doctor-details-panel.component';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';

@Component({
  selector: 'app-doctor-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, DoctorDetailsPanelComponent],
  template: `
    <app-patient-layout>
    <doctor-details-panel
      *ngIf="doctor; else loadingTpl"
      [doctor]="doctor"
      [avgRating]="avgRating"
      [age]="age"
      [educations]="educations"
      [experiences]="experiences"
      [certificates]="certificates"
      [enableBooking]="true"
      (openBooking)="startBooking()"
    ></doctor-details-panel>
    
    <!-- Booking Modal -->
    <div *ngIf="bookingOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="panel p-6 w-full max-w-xl relative">
        <button class="absolute top-2 right-2 btn-secondary" (click)="closeBooking()">Close</button>
        <div class="flex items-center gap-3 mb-4" *ngIf="doctor as doc">
          <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-white">
            <img *ngIf="doc.profileImageUrl" [src]="doc.profileImageUrl" class="w-full h-full object-cover" (error)="doc.profileImageUrl = ''" />
            <span *ngIf="!doc.profileImageUrl">{{ doctorInitial(doc) }}</span>
          </div>
          <div>
            <div class="font-semibold">{{ formatDoctorName(doc) }}</div>
            <div class="text-sm text-gray-400">{{ doc.specialization || 'General' }}</div>
            <div class="text-sm" *ngIf="experienceYears !== null">Experience: {{ experienceYears }} years</div>
          </div>
        </div>

        <div class="space-y-3">
          <label class="block">
            <span class="text-sm">Select Date</span>
            <input type="date" class="input" [(ngModel)]="selectedDate" (change)="loadSlots()" />
          </label>

          <div *ngIf="loadingSlots" class="text-gray-400">Loading available slots…</div>
          <div *ngIf="bookError" class="text-red-400">{{ bookError }}</div>
          <div *ngIf="!loadingSlots">
            <div class="text-sm mb-2">Available Slots</div>
            <div class="flex flex-wrap gap-2">
              <button
                *ngFor="let s of slots"
                [ngClass]="{ 'btn-primary': selectedSlot === s, 'btn-secondary': selectedSlot !== s }"
                (click)="selectSlot(s)"
              >
                {{ s }}
              </button>
              <div *ngIf="(slots?.length || 0) === 0" class="text-gray-400">No slots available for selected date.</div>
            </div>
          </div>

          <div class="mt-4">
            <label class="block mb-1 text-sm">Reason for visit</label>
            <textarea class="input w-full" rows="3" [(ngModel)]="reason" placeholder="e.g., persistent cough, follow-up, etc."></textarea>
          </div>

          <div class="mt-3">
            <button class="btn-primary" [disabled]="!selectedSlot || booking" (click)="book()">
              {{ booking ? 'Booking…' : 'Book Selected Slot' }}
            </button>
            <span class="ml-3 text-green-500" *ngIf="bookSuccess">Appointment booked successfully.</span>
          </div>
        </div>
      </div>
    </div>
    <ng-template #loadingTpl>
      <div class="p-6 text-center text-gray-400">Loading doctor profile…</div>
    </ng-template>
    </app-patient-layout>
  `,
})
export class DoctorPublicProfileComponent {
  username: string | null = null;
  doctor: Doctor | null = null;
  avgRating: number | null = null;
  age: number | null = null;

  educations: any[] = [];
  experiences: any[] = [];
  certificates: any[] = [];
  loadingDetails = false;

  selectedDate = ''; // YYYY-MM-DD
  slots: string[] = [];
  selectedSlot: string | null = null;
  reason = '';
  loadingSlots = false;
  booking = false;
  bookSuccess = false;
  bookError: string | null = null;
  bookingOpen = false;
  experienceYears: number | null = null;
  autoBookOnLoad = false;

  constructor(
    private route: ActivatedRoute,
    private doctors: DoctorService,
    private appts: AppointmentService,
    private doctorProfiles: DoctorProfileService
  ) {
    this.username = this.route.snapshot.paramMap.get('username');
    this.autoBookOnLoad = this.route.snapshot.queryParamMap.get('book') === '1';
    if (this.username) {
      this.loadDoctor(this.username);
    }
  }

  loadDoctor(username: string) {
    this.doctors.getByUsername(username).subscribe({
      next: (d) => {
        this.doctor = d;
        this.age = this.computeAge(d?.dateOfBirth);
        // Ratings
        this.doctors.getAverageRating(d.id).subscribe({
          next: (r) => (this.avgRating = r?.averageRating ?? null),
        });
        // Details
        this.loadDetails(username);
        if (this.autoBookOnLoad) {
          // Open booking modal immediately on arrival when requested
          this.startBooking();
        }
      },
    });
  }

  loadDetails(username: string) {
    this.loadingDetails = true;
    this.doctorProfiles.getEducations(username).subscribe({
      next: (eds) => (this.educations = eds || []),
      error: () => {},
    });
    this.doctorProfiles.getExperiences(username).subscribe({
      next: (exps) => {
        this.experiences = exps || [];
        // Keep experience years in sync if booking modal is open
        if (this.bookingOpen) {
          this.experienceYears = (this.experiences || []).reduce((acc: number, ex: any) => acc + (ex?.yearsOfService || 0), 0);
        }
      },
      error: () => {},
    });
    this.doctorProfiles.getCertificates(username).subscribe({
      next: (certs) => {
        this.certificates = certs || [];
        this.loadingDetails = false;
      },
      error: () => (this.loadingDetails = false),
    });
  }

  computeAge(dob?: string): number | null {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  loadSlots() {
    if (!this.doctor || !this.selectedDate) return;
    this.loadingSlots = true;
    this.selectedSlot = null;
    this.bookSuccess = false;
    this.bookError = null;
    this.appts.getAvailableSlots(this.doctor.id, this.selectedDate).subscribe({
      next: (slots) => {
        this.slots = slots || [];
        this.loadingSlots = false;
      },
      error: () => (this.loadingSlots = false),
    });
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
  }

  toIso(date: string, time: string) {
    // Ensure seconds present
    const t = time.length === 5 ? `${time}:00` : time;
    return `${date}T${t}`;
  }

  book() {
    if (!this.doctor || !this.selectedDate || !this.selectedSlot) return;
    this.booking = true;
    this.bookSuccess = false;
    this.bookError = null;
    const payload = {
      doctorId: this.doctor.id,
      appointmentDateTime: this.toIso(this.selectedDate, this.selectedSlot),
      reason: this.reason || undefined,
    };
    this.appts.bookAppointment(payload).subscribe({
      next: () => {
        this.booking = false;
        this.bookSuccess = true;
        // Optionally close modal after success
        // this.bookingOpen = false;
      },
      error: (err) => {
        this.booking = false;
        this.bookError = err?.error?.message || 'Booking failed. Please try another slot.';
      },
    });
  }

  startBooking() {
    this.bookingOpen = true;
    this.bookSuccess = false;
    this.bookError = null;
    this.selectedSlot = null;
    // Default date to today
    const today = new Date();
    this.selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);
    // Precompute experience years from loaded experiences
    this.experienceYears = (this.experiences || []).reduce((acc: number, ex: any) => acc + (ex?.yearsOfService || 0), 0);
    this.loadSlots();
  }

  closeBooking() {
    this.bookingOpen = false;
  }

  doctorInitial(d: Doctor) {
    const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
    const stripped = base.replace(/^dr\.?\s+/i, '');
    return stripped.charAt(0) || '?';
  }

  formatDoctorName(d: Doctor) {
    const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
    if (!base) return '';
    return /^dr\.?\s+/i.test(base) ? base : `Dr ${base}`;
  }
}