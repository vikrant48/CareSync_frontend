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
import { MasterDataService } from '../../core/services/master-data.service';
import { SelectDropdownComponent, SelectOption } from '../../shared/select-dropdown.component';
import { SharedChatModalComponent } from '../../shared/chat/shared-chat-modal.component';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, PatientAppointmentCardComponent, RescheduleAppointmentModalComponent, CancellationModalComponent, SelectDropdownComponent, SharedChatModalComponent],
  template: `
    <app-patient-layout>
    <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">My Appointments</h2>
           <p class="text-gray-800 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Manage and track your scheduled consultations</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="panel p-3 sm:p-6 shadow-lg relative z-30 transition-all duration-300">
        <div class="flex items-center justify-between gap-2 cursor-pointer sm:cursor-default" (click)="toggleFilter()">
            <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
               <i class="fa-solid fa-sliders text-blue-500 shrink-0"></i>
               <span class="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 shrink-0">Filters</span>
               <span *ngIf="activeFilterCount > 0" class="bg-blue-600 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold shrink-0 whitespace-nowrap">
                 {{ activeFilterCount }} Active
               </span>
            </div>
            
            <div class="flex items-center gap-2 shrink-0" (click)="$event.stopPropagation()">
               <button *ngIf="activeFilterCount > 0" 
                       (click)="clearFilters()" 
                       class="text-xs text-red-600 dark:text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 transition-colors font-medium shrink-0 whitespace-nowrap">
                  <i class="fa-solid fa-xmark text-xs"></i> Clear
               </button>
               <button (click)="toggleFilter()" class="sm:hidden text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold transition-all shrink-0 whitespace-nowrap">
                 <i class="fa-solid fa-filter text-[10px]"></i>
                 <span>{{ isFilterExpanded ? 'Hide' : 'Filter' }}</span>
                 <i class="fa-solid fa-chevron-down transition-transform duration-300" [class.rotate-180]="isFilterExpanded"></i>
               </button>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 transition-all duration-300"
             [ngClass]="{ 'hidden sm:grid': !isFilterExpanded, 'grid mt-3': isFilterExpanded }">
          <div class="relative">
            <label class="block text-xs font-medium text-gray-800 dark:text-gray-400 mb-1 ml-1">Status</label>
            <app-select-dropdown
              [(ngModel)]="statusFilter"
              [options]="statusOptions"
              placeholder="All Statuses">
            </app-select-dropdown>
          </div>
          
          <div class="relative">
            <label class="block text-xs font-medium text-gray-800 dark:text-gray-400 mb-1 ml-1">Specialization</label>
            <input type="text" class="input w-full bg-gray-800/50" [(ngModel)]="specializationFilter" placeholder="e.g. Cardiology..." />
          </div>
          
          <div class="relative">
             <label class="block text-xs font-medium text-gray-800 dark:text-gray-400 mb-1 ml-1">Time Range</label>
             <app-select-dropdown
                [(ngModel)]="rangeFilter"
                [options]="rangeOptions"
                placeholder="All Time">
             </app-select-dropdown>
          </div>
        </div>

        <div class="flex items-center justify-end border-t border-gray-800 pt-3 mt-3">
          <div class="text-xs text-gray-800 dark:text-gray-400">
             Showing <span class="font-bold text-gray-800 dark:text-gray-200">{{ filtered().length }}</span> of {{ appointments.length }} appointments
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <section *ngIf="loading" class="mt-8 flex flex-col items-center justify-center min-h-[300px] text-gray-500 animate-fade-in">
         <div class="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
         <span class="animate-pulse">Loading your appointments...</span>
      </section>

      <!-- Empty State -->
      <div *ngIf="!loading && filtered().length === 0" class="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-gray-200 dark:border-gray-800 border-dashed">
         <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl mb-4 text-gray-400 dark:text-gray-600">
            <i class="fa-regular fa-calendar-xmark"></i>
         </div>
         <h3 class="text-xl font-bold text-gray-800 dark:text-gray-300 mb-2">No Appointments Found</h3>
         <p class="text-gray-600 dark:text-gray-500 max-w-md mx-auto mb-6">
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
          (openChat)="openChat($event)"
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

      <!-- Shared Chat Modal -->
      <app-shared-chat-modal
        [isOpen]="chatOpen"
        [appointmentId]="chatAppointmentId"
        [participantName]="chatParticipantName"
        [participantImage]="chatParticipantImage"
        (close)="closeChat()"
      ></app-shared-chat-modal>
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
  statuses: string[] = [];

  isFilterExpanded = false;

  toggleFilter() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.statusFilter) count++;
    if (this.specializationFilter) count++;
    if (this.rangeFilter) count++;
    return count;
  }

  get statusOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Statuses' },
      ...this.statuses.map(s => ({ value: s, label: s }))
    ];
  }

  get rangeOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'past', label: 'Past' }
    ];
  }

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
    private toast: ToastService,
    private masterDataService: MasterDataService
  ) {
    this.refresh();
    this.masterDataService.getStatuses().subscribe({
      next: (s) => this.statuses = s || []
    });
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
    this.doctorApi.getAllForPatients(0, 50).subscribe({
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
        if (!a.consultationFees && doc.consultationFees) {
          a.consultationFees = doc.consultationFees;
        }
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

    // First apply filters
    const filteredList = list.filter((a) => {
      const statusOk = !this.statusFilter || (a.status || '').toUpperCase() === this.statusFilter.toUpperCase();
      const specOk = !this.specializationFilter || (a.doctorSpecialization || '').toLowerCase().includes(this.specializationFilter.toLowerCase());
      let rangeOk = true;
      if (this.rangeFilter === 'upcoming') rangeOk = getAppointmentEpochMs(a) > nowMs;
      if (this.rangeFilter === 'past') rangeOk = getAppointmentEpochMs(a) < nowMs && !isAppointmentToday(a);
      if (this.rangeFilter === 'today') rangeOk = isAppointmentToday(a);
      return statusOk && specOk && rangeOk;
    });

    return this.sortBySmart(filteredList);
  }

  private sortBySmart(items: PatientAppointmentItem[]) {
    const now = Date.now();
    const upcoming = items.filter(a => getAppointmentEpochMs(a) >= now);
    const past = items.filter(a => getAppointmentEpochMs(a) < now);

    // Sort upcoming by nearest date (Ascending)
    upcoming.sort((a, b) => getAppointmentEpochMs(a) - getAppointmentEpochMs(b));

    // Sort past by most recent date (Descending)
    past.sort((a, b) => getAppointmentEpochMs(b) - getAppointmentEpochMs(a));

    return [...upcoming, ...past];
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

  // Chat Logic
  chatOpen = false;
  chatAppointmentId: number | null = null;
  chatParticipantName: string | null = null;
  chatParticipantImage: string | null = null;

  openChat(a: PatientAppointmentItem) {
    this.chatAppointmentId = a.appointmentId;
    this.chatParticipantName = a.doctorName || 'Doctor';
    this.chatParticipantImage = a.doctorProfileImageUrl || null;
    this.chatOpen = true;
  }

  closeChat() {
    this.chatOpen = false;
    this.chatAppointmentId = null;
    this.chatParticipantName = null;
    this.chatParticipantImage = null;
  }
}
