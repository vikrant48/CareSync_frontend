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
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { FilterBarComponent } from '../../shared/ui/filter-bar.component';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, PatientAppointmentCardComponent, RescheduleAppointmentModalComponent, CancellationModalComponent, SelectDropdownComponent, SharedChatModalComponent, EmptyStateComponent, PageHeaderComponent, SkeletonComponent, FilterBarComponent],
  template: `
    <app-patient-layout>
    <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      <app-page-header
        title="My Appointments"
        subtitle="Manage and track your scheduled consultations"
      ></app-page-header>

      <app-filter-bar
        [(expanded)]="isFilterExpanded"
        [activeCount]="activeFilterCount"
        [hasSummary]="true"
        (clear)="clearFilters()"
      >
          <div class="space-y-0.5">
            <app-select-dropdown
              label="Status"
              [(ngModel)]="statusFilter"
              [options]="statusOptions"
              placeholder="All Statuses">
            </app-select-dropdown>
          </div>
          
          <div class="space-y-0.5">
            <label class="filter-label">Specialization</label>
            <div class="relative w-full">
              <i class="fa-solid fa-stethoscope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm pointer-events-none z-10"></i>
              <input type="text" class="filter-input-search" [(ngModel)]="specializationFilter" placeholder="e.g. Cardiology..." />
            </div>
          </div>
          
          <div class="space-y-0.5">
             <app-select-dropdown
                label="Time Range"
                [(ngModel)]="rangeFilter"
                [options]="rangeOptions"
                placeholder="All Time">
             </app-select-dropdown>
          </div>

        <div filterSummary class="text-xs text-gray-500 dark:text-gray-400">
           Showing <span class="font-bold text-gray-800 dark:text-gray-200">{{ filtered().length }}</span> of {{ appointments.length }} appointments
        </div>
      </app-filter-bar>

      <app-skeleton *ngIf="loading" variant="card" [count]="3" wrapperClass="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></app-skeleton>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!loading && filtered().length === 0 && appointments.length === 0"
        icon="fa-solid fa-calendar-xmark"
        title="No Appointments Found"
        message="You haven't booked any appointments yet."
        containerClass="bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-gray-200 dark:border-gray-800 border-dashed px-4"
        [hasAction]="true"
      >
        <a routerLink="/patient/book-appointment" class="btn-primary">Book Now</a>
      </app-empty-state>
      <app-empty-state
        *ngIf="!loading && filtered().length === 0 && appointments.length > 0"
        icon="fa-solid fa-calendar-xmark"
        title="No Appointments Found"
        message="No appointments match your current filters."
        containerClass="bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-gray-200 dark:border-gray-800 border-dashed px-4"
        [hasAction]="true"
      >
        <button type="button" (click)="clearFilters()" class="btn-secondary">Clear Filters</button>
      </app-empty-state>

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
