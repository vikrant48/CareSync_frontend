import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AppointmentService, PatientAppointmentItem } from '../../core/services/appointment.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { PatientAppointmentCardComponent } from '../../shared/patient-appointment-card.component';
import { RescheduleAppointmentModalComponent } from '../../shared/reschedule-appointment-modal.component';
import { CancellationModalComponent } from '../../shared/cancellation-modal.component';
import { getAppointmentEpochMs, isAppointmentToday } from '../../shared/appointment-utils';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, PatientAppointmentCardComponent, RescheduleAppointmentModalComponent, CancellationModalComponent],
  template: `
    <app-patient-layout>
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-100 tracking-tight">My Appointments</h2>
           <p class="text-gray-400 text-sm mt-1">Manage and track your scheduled consultations</p>
        </div>
        <button class="btn-secondary self-start sm:self-auto text-sm py-2 px-4 shadow-lg shadow-gray-900/20" (click)="refresh()" [disabled]="loading">
           <i class="fa-solid fa-rotate mr-2" [class.fa-spin]="loading"></i> Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="panel p-4 sm:p-6 space-y-4 shadow-lg relative z-30">
        <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
               <i class="fa-solid fa-filter text-blue-500"></i>
               <span class="font-semibold text-gray-200">Filters</span>
            </div>
            <button *ngIf="statusFilter || specializationFilter || rangeFilter" 
                    (click)="clearFilters()" 
                    class="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 transition-colors">
               <i class="fa-solid fa-xmark"></i> Clear Filters
            </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="relative z-10">
            <label class="block text-xs font-medium text-gray-400 mb-1 ml-1">Status</label>
            <div class="relative">
              <select class="input w-full appearance-none bg-gray-900/50" [(ngModel)]="statusFilter">
                <option value="">All Statuses</option>
                <option value="BOOKED">Booked</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="CANCELLED">Cancelled (Any)</option>
                <option value="CANCELLED_BY_PATIENT">Cancelled by Me</option>
                <option value="CANCELLED_BY_DOCTOR">Cancelled by Doctor</option>
                <option value="COMPLETED">Completed</option>
              </select>
               <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fa-solid fa-chevron-down text-xs text-gray-500"></i>
               </div>
            </div>
          </div>
          
          <div class="relative z-10">
            <label class="block text-xs font-medium text-gray-400 mb-1 ml-1">Specialization</label>
            <input type="text" class="input w-full bg-gray-900/50" [(ngModel)]="specializationFilter" placeholder="e.g. Cardiology..." />
          </div>
          
          <div class="relative z-10">
             <label class="block text-xs font-medium text-gray-400 mb-1 ml-1">Time Range</label>
             <div class="relative">
                <select class="input w-full appearance-none bg-gray-900/50" [(ngModel)]="rangeFilter">
                  <option value="">All Time</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="past">Past</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fa-solid fa-chevron-down text-xs text-gray-500"></i>
               </div>
             </div>
          </div>
        </div>

        <div class="flex items-center justify-end border-t border-gray-800 pt-3 mt-2">
          <div class="text-xs text-gray-400">
             Showing <span class="font-bold text-gray-200">{{ filtered().length }}</span> of {{ appointments.length }} appointments
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <section *ngIf="loading" class="mt-8 flex flex-col items-center justify-center min-h-[300px] text-gray-500 animate-fade-in">
         <div class="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
         <span class="animate-pulse">Loading your appointments...</span>
      </section>

      <!-- Empty State -->
      <div *ngIf="!loading && filtered().length === 0" class="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-gray-800/20 rounded-2xl border border-gray-800 border-dashed">
         <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-4xl mb-4 text-gray-600">
            <i class="fa-regular fa-calendar-xmark"></i>
         </div>
         <h3 class="text-xl font-bold text-gray-300 mb-2">No Appointments Found</h3>
         <p class="text-gray-500 max-w-md mx-auto mb-6">
            {{ appointments.length === 0 ? "You haven't booked any appointments yet." : "No appointments match your current filters." }}
         </p>
         <button *ngIf="appointments.length > 0" (click)="clearFilters()" class="btn-secondary">
            Clear Filters
         </button>
         <a *ngIf="appointments.length === 0" routerLink="/patient/book-appointment" class="btn-primary">
            Book Now
         </a>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" *ngIf="!loading && filtered().length > 0">
        <patient-appointment-card
          *ngFor="let a of filtered()"
          [appointment]="a"
          [disabled]="loading"
          (reschedule)="startReschedule($event)"
          (cancel)="cancelAppointment($event)"
          (viewDoctor)="viewDoctorFromAppointment($event)"
          (joinVideo)="joinConsultation($event)"
          class="h-full"
        ></patient-appointment-card>
      </div>

      <!-- Reschedule Modal (shared) -->
      <reschedule-appointment-modal
        [appointment]="rescheduleTarget"
        [doctors]="doctors"
        (close)="closeReschedule()"
        (confirmed)="onRescheduleConfirmed($event)"
      ></reschedule-appointment-modal>
      
      <!-- Cancellation Modal -->
      <app-cancellation-modal
        [appointment]="cancellationTarget"
        (close)="closeCancellation()"
        (confirmCancel)="confirmCancellation()"
        (requestReschedule)="handleRescheduleFromCancellation()"
      ></app-cancellation-modal>
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
  cancellationTarget: PatientAppointmentItem | null = null;
  rescheduleDateISO: string | null = null; // kept for compatibility if needed
  rescheduleTimeSlot: string | null = null; // kept for compatibility if needed
  availableSlots: string[] = [];
  rescheduleError: string | null = null;

  constructor(
    private apptApi: AppointmentService,
    private router: Router,
    private doctorApi: DoctorService,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    this.refresh();
    // Apply default filters from query params if provided
    const qp = this.route.snapshot.queryParamMap;
    const statusParam = (qp.get('status') || '').toUpperCase();
    const rangeParam = (qp.get('range') || '').toUpperCase();

    // Status: 'ALL' means no filter; otherwise map to specific status
    if (statusParam && statusParam !== 'ALL') {
      this.statusFilter = statusParam;
    } else {
      this.statusFilter = '';
    }

    // Range: map to component's lowercase values; 'ALL' means no filter
    if (rangeParam === 'TODAY') this.rangeFilter = 'today';
    else if (rangeParam === 'UPCOMING') this.rangeFilter = 'upcoming';
    else if (rangeParam === 'PAST') this.rangeFilter = 'past';
    else this.rangeFilter = '';
    // Preload doctors list to enable navigation to doctor profile from appointments
    this.doctorApi.getAllForPatients().subscribe({
      next: (res) => {
        this.doctors = res || [];
        this.enrichAppointments();
      },
      error: () => (this.doctors = []),
    });
  }

  refresh() {
    this.loading = true;
    this.apptApi.getMyAppointments().subscribe({
      next: (res) => {
        this.appointments = res || [];
        this.enrichAppointments();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  enrichAppointments() {
    if (!this.appointments.length || !this.doctors.length) return;
    this.appointments.forEach(a => {
      const doc = this.doctors.find(d => {
        const name = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
        return name === a.doctorName;
      });
      if (doc) {
        a.doctorIsVerified = doc.isVerified;
      }
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
        this.toast.showSuccess('Appointment rescheduled successfully');
        this.closeReschedule();
        this.refresh();
      },
      error: () => {
        this.rescheduleError = 'Unable to reschedule';
        this.toast.showError('Failed to reschedule appointment');
      },
    });
  }

  cancelAppointment(a: PatientAppointmentItem) {
    this.cancellationTarget = a;
  }

  closeCancellation() {
    this.cancellationTarget = null;
  }

  confirmCancellation() {
    if (!this.cancellationTarget) return;
    this.apptApi.cancelMyAppointment(this.cancellationTarget.appointmentId).subscribe({
      next: () => {
        this.toast.showSuccess('Appointment cancelled successfully');
        this.closeCancellation();
        this.refresh();
      },
      error: (err) => {
        console.error('Cancellation failed', err);
        this.toast.showError('Failed to cancel appointment. Please try again.');
        this.closeCancellation(); // modifying this to close regardless, or maybe keep open? User said "not able to cancel" so maybe good to close and let them try again.
      }
    });
  }

  handleRescheduleFromCancellation() {
    if (!this.cancellationTarget) return;
    const target = this.cancellationTarget;
    this.closeCancellation();
    this.startReschedule(target);
  }

  joinConsultation(a: PatientAppointmentItem) {
    this.router.navigate(['/patient/consultation', a.appointmentId]);
  }
}
