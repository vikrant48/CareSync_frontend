import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppointmentService, PatientAppointmentItem } from '../../core/services/appointment.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { PatientAppointmentCardComponent } from '../../shared/patient-appointment-card.component';
import { RescheduleAppointmentModalComponent } from '../../shared/reschedule-appointment-modal.component';
import { getAppointmentEpochMs, isAppointmentToday } from '../../shared/appointment-utils';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, PatientAppointmentCardComponent, RescheduleAppointmentModalComponent],
  template: `
    <app-patient-layout>
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">My Appointments</h2>
        <button class="btn-secondary" (click)="refresh()">Refresh</button>
      </div>

      <!-- Filters -->
      <div class="panel p-4 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label class="block text-sm">
            <span class="block mb-1">Status</span>
            <select class="input w-full" [(ngModel)]="statusFilter">
              <option value="">All</option>
              <option value="BOOKED">Booked</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="block mb-1">Doctor specialization</span>
            <input type="text" class="input w-full" [(ngModel)]="specializationFilter" placeholder="e.g., Cardiology" />
          </label>
          <label class="block text-sm">
            <span class="block mb-1">Time range</span>
            <select class="input w-full" [(ngModel)]="rangeFilter">
              <option value="">Select range</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="past">Past</option>
            </select>
          </label>
        </div>
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-400">Showing {{ filtered().length }} of {{ appointments.length }} appointments</div>
          <button class="btn-secondary" (click)="clearFilters()">Clear filters</button>
        </div>
      </div>

      <!-- List -->
      <div *ngIf="loading" class="text-gray-400">Loading appointments...</div>
      <div *ngIf="!loading && filtered().length === 0" class="text-gray-400">No appointments match your filters.</div>
      <div class="space-y-3" *ngIf="!loading">
        <patient-appointment-card
          *ngFor="let a of filtered()"
          [appointment]="a"
          [disabled]="loading"
          (reschedule)="startReschedule($event)"
          (cancel)="cancelAppointment($event)"
          (viewDoctor)="viewDoctorFromAppointment($event)"
        ></patient-appointment-card>
      </div>

      <!-- Reschedule Modal (shared) -->
      <reschedule-appointment-modal
        [appointment]="rescheduleTarget"
        [doctors]="doctors"
        (close)="closeReschedule()"
        (confirmed)="onRescheduleConfirmed($event)"
      ></reschedule-appointment-modal>
    </div>
    </app-patient-layout>
  `,
})
export class MyAppointmentsComponent {
  appointments: PatientAppointmentItem[] = [];
  loading = false;
  detailsOpen: Record<number, boolean> = {};
  doctors: Doctor[] = [];

  statusFilter = '';
  specializationFilter = '';
  rangeFilter: 'upcoming' | 'today' | 'past' | '' = '';

  rescheduleTarget: PatientAppointmentItem | null = null;
  rescheduleDateISO: string | null = null; // kept for compatibility if needed
  rescheduleTimeSlot: string | null = null; // kept for compatibility if needed
  availableSlots: string[] = [];
  rescheduleError: string | null = null;

  constructor(private apptApi: AppointmentService, private router: Router, private doctorApi: DoctorService) {
    this.refresh();
    // Preload doctors list to enable navigation to doctor profile from appointments
    this.doctorApi.getAllForPatients().subscribe({
      next: (res) => (this.doctors = res || []),
      error: () => (this.doctors = []),
    });
  }

  refresh() {
    this.loading = true;
    this.apptApi.getMyAppointments().subscribe({
      next: (res) => {
        this.appointments = res || [];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  setRange(v: 'upcoming' | 'today' | 'past') {
    this.rangeFilter = this.rangeFilter === v ? '' : v;
  }

  clearFilters() {
    this.statusFilter = '';
    this.specializationFilter = '';
    this.rangeFilter = '';
  }

  // Date helpers moved to shared utils

  filtered() {
    const list = [...this.appointments];
    const nowMs = new Date().getTime();
    return list.filter((a) => {
      const statusOk = !this.statusFilter || (a.status || '').toUpperCase() === this.statusFilter.toUpperCase();
      const specOk = !this.specializationFilter || (a.doctorSpecialization || '').toLowerCase().includes(this.specializationFilter.toLowerCase());
      let rangeOk = true;
      if (this.rangeFilter === 'upcoming') rangeOk = getAppointmentEpochMs(a) > nowMs;
      if (this.rangeFilter === 'past') rangeOk = getAppointmentEpochMs(a) < nowMs && !isAppointmentToday(a);
      if (this.rangeFilter === 'today') rangeOk = isAppointmentToday(a);
      return statusOk && specOk && rangeOk;
    });
  }

  // Status class moved to shared utils (cards consume it internally)

  viewDoctorFromAppointment(a: PatientAppointmentItem) {
    // Try to find the doctor entity by display name to get username
    const target = this.doctors.find((d) => {
      const display = d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim();
      return display === a.doctorName;
    });
    if (target?.username) {
      this.router.navigate(['/patient/doctor', target.username]);
    } else {
      // Fallback: navigate to book appointment page
      this.router.navigate(['/patient/book-appointment']);
    }
  }

  startReschedule(a: PatientAppointmentItem) {
    this.rescheduleTarget = a;
    this.rescheduleDateISO = null;
    this.rescheduleTimeSlot = null;
    this.availableSlots = [];
    this.rescheduleError = null;
  }

  closeReschedule() {
    this.rescheduleTarget = null;
    this.rescheduleDateISO = null;
    this.rescheduleTimeSlot = null;
    this.availableSlots = [];
    this.rescheduleError = null;
  }

  onRescheduleConfirmed(iso: string) {
    if (!this.rescheduleTarget) return;
    this.apptApi.rescheduleMyAppointment(this.rescheduleTarget.appointmentId, iso).subscribe({
      next: () => {
        this.closeReschedule();
        this.refresh();
      },
      error: () => (this.rescheduleError = 'Unable to reschedule'),
    });
  }

  cancelAppointment(a: PatientAppointmentItem) {
    if (!confirm('Cancel this appointment?')) return;
    this.apptApi.cancelMyAppointment(a.appointmentId).subscribe({
      next: () => this.refresh(),
    });
  }
}