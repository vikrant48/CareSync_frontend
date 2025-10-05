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
      [(selectedDate)]="selectedDate"
      [slots]="slots"
      [selectedSlot]="selectedSlot"
      (selectSlot)="selectSlot($event)"
      [(reason)]="reason"
      [loadingSlots]="loadingSlots"
      (loadSlots)="loadSlots()"
      [booking]="booking"
      [bookSuccess]="bookSuccess"
      [bookError]="bookError"
      (book)="book()"
    ></doctor-details-panel>
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

  constructor(
    private route: ActivatedRoute,
    private doctors: DoctorService,
    private appts: AppointmentService,
    private doctorProfiles: DoctorProfileService
  ) {
    this.username = this.route.snapshot.paramMap.get('username');
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
      next: (exps) => (this.experiences = exps || []),
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
      },
      error: (err) => {
        this.booking = false;
        this.bookError = err?.error?.message || 'Booking failed. Please try another slot.';
      },
    });
  }
}