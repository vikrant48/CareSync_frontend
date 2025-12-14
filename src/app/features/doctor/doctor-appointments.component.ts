import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DoctorAppointmentCardComponent } from '../../shared/doctor-appointment-card.component';
import { getDoctorAppointmentEpochMs } from '../../shared/doctor-appointment-utils';
import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { PatientProfileService, PatientDto, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { firstValueFrom } from 'rxjs';

type TimeRange = 'UPCOMING' | 'TODAY' | 'PAST' | 'ALL';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DoctorAppointmentCardComponent, PatientDetailsModalComponent, MedicalHistoryDetailModalComponent, DoctorLayoutComponent],
  template: `
    <app-doctor-layout>
    <div class="p-6 space-y-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage your patient appointments and schedules</p>
        </div>
        <button class="btn-secondary flex items-center gap-2" (click)="refresh()" [disabled]="loading">
          <i class="fa-solid fa-arrows-rotate" [class.animate-spin]="loading"></i>
          <span>Refresh</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
        <div class="flex items-center justify-between mb-2">
           <div class="flex items-center gap-2">
             <i class="fa-solid fa-filter text-blue-600 dark:text-blue-400"></i>
             <h3 class="font-semibold text-gray-900 dark:text-white">Filters</h3>
           </div>
           <button *ngIf="statusFilter !== 'ALL' || searchTerm || range !== 'ALL'" 
                   (click)="statusFilter='ALL'; range='ALL'; searchTerm=''; refresh()" 
                   class="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium hover:underline transition-all animate-in fade-in">
             Clear All
           </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- Status Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i class="fa-solid fa-circle-check"></i></span>
              <select class="input-modern pl-10" [(ngModel)]="statusFilter" (change)="onFilterChange()">
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled (Any)</option>
                <option value="CANCELLED_BY_PATIENT">Cancelled by Patient</option>
                <option value="CANCELLED_BY_DOCTOR">Cancelled by Me</option>
              </select>
            </div>
          </div>

          <!-- Search Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Search</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i class="fa-solid fa-magnifying-glass"></i></span>
              <input type="text" class="input-modern pl-10" [(ngModel)]="searchTerm" (input)="onFilterChange()" placeholder="Search patient name or ID..." />
            </div>
          </div>

          <!-- Time Range Filter -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Range</label>
            <div class="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
              <button class="btn-tab flex-1" [class.active]="range==='TODAY'" (click)="setRange('TODAY')">Today</button>
              <button class="btn-tab flex-1" [class.active]="range==='UPCOMING'" (click)="setRange('UPCOMING')">Upcoming</button>
              <button class="btn-tab flex-1" [class.active]="range==='PAST'" (click)="setRange('PAST')">Past</button>
              <button class="btn-tab flex-1" [class.active]="range==='ALL'" (click)="setRange('ALL')">All</button>
            </div>
          </div>
        </div>
      </div>

      <!-- List Content -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-20 text-gray-400 animate-in fade-in">
        <div class="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-4"></div>
        <span class="font-medium">Loading appointments...</span>
      </div>

      <div *ngIf="!loading && filteredAppointments().length === 0" class="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
         <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
           <i class="fa-regular fa-calendar-xmark text-4xl"></i>
         </div>
         <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">No appointments found</h3>
         <p class="text-gray-500 dark:text-gray-400 max-w-xs">Try adjusting your filters or search terms to find what you're looking for.</p>
         <button class="btn-secondary mt-4" (click)="statusFilter='ALL'; range='ALL'; searchTerm=''; refresh()">Clear Filters</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4" *ngIf="!loading && filteredAppointments().length > 0">
        <doctor-appointment-card
          *ngFor="let a of filteredAppointments()"
          class="h-full"
          [appointment]="a"
          [showStatusSelect]="true"
          (viewPatient)="openDetails($event)"
          (openHistoryForm)="openDetails($event)"
          (schedule)="changeStatus($event, 'SCHEDULED')"
          (confirm)="changeStatus($event, 'CONFIRMED')"
          (start)="changeStatus($event, 'IN_PROGRESS')"
          (complete)="changeStatus($event, 'COMPLETED')"
          (cancel)="changeStatus($event, 'CANCELLED')"
          (statusChange)="changeStatus($event.appointment, $event.status)"
        ></doctor-appointment-card>
      </div>

      <!-- Details Modal (Shared) -->
      <app-patient-details-modal
        [open]="detailsOpen"
        [patient]="patient"
        [history]="history"
        (close)="closeDetails()"
        (historyClick)="viewHistoryDetail($event)"
      ></app-patient-details-modal>

      <!-- History Detail Modal (Shared) -->
      <app-medical-history-detail-modal
        [open]="historyDetailModalOpen"
        [detail]="selectedHistoryDetail"
        [doctorInfo]="selectedHistoryDoctorInfo"
        (close)="closeHistoryDetail()"
      ></app-medical-history-detail-modal>
    </div>
    </app-doctor-layout>
  `,
  styles: [`
    :host { display: block; }
    /* Modern Input */
    .input-modern {
      @apply block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 text-sm py-2.5;
    }
    
    /* Buttons */
    .btn-primary {
      @apply px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-95;
    }
    .btn-secondary {
      @apply px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 active:scale-95 shadow-sm;
    }

    /* Range Tabs */
    .btn-tab {
      @apply px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 rounded-lg transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-200;
    }
    .btn-tab.active {
      @apply bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm;
    }
  `]
})
export class DoctorAppointmentsComponent {
  loading = false;
  appointments: DoctorAppointmentItem[] = [];
  statusFilter: 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_BY_PATIENT' | 'CANCELLED_BY_DOCTOR' = 'ALL';
  range: TimeRange = 'UPCOMING';
  searchTerm = '';

  // Modal state
  detailsOpen = false;
  patient: PatientDto | null = null;
  history: MedicalHistoryWithDoctorItem[] = [];
  selectedAppointment: DoctorAppointmentItem | null = null;

  // History detail modal state
  historyDetailModalOpen = false;
  selectedHistoryDetail: any | null = null;
  selectedHistoryDoctorInfo: { doctorName: string; doctorSpecialization?: string; doctorContactInfo?: string } | null = null;

  constructor(private appts: AppointmentService, private patients: PatientProfileService) {
    this.refresh();
  }

  refresh() {
    this.loadAppointments();
  }

  setRange(r: TimeRange) {
    this.range = r;
    this.loadAppointments();
  }

  onFilterChange() {
    this.loadAppointments();
  }

  private loadAppointments() {
    this.loading = true;
    const now = Date.now();

    // If a specific status is selected, hit status endpoint first, then filter by range
    const fetchByStatus = async () => {
      try {
        const statuses = this.statusFilter === 'PENDING' ? ['BOOKED', 'SCHEDULED'] : [this.statusFilter];
        const arrays = await Promise.all(statuses.map((s) => firstValueFrom(this.appts.getDoctorAppointmentsByStatus(s))));
        const merged = ([] as DoctorAppointmentItem[]).concat(...arrays);
        const dedup = this.dedupById(merged);
        this.applyRangeFilterAndSet(dedup, now);
      } catch (e) {
        this.appointments = [];
        this.loading = false;
      }
    };

    if (this.statusFilter !== 'ALL') {
      fetchByStatus();
      return;
    }

    // Fetch based on range
    let obs;
    switch (this.range) {
      case 'TODAY':
        obs = this.appts.getDoctorTodayAppointments();
        break;
      case 'UPCOMING':
        obs = this.appts.getDoctorUpcomingAppointments();
        break;
      case 'PAST':
        obs = this.appts.getDoctorAllAppointments();
        break;
      case 'ALL':
      default:
        obs = this.appts.getDoctorAllAppointments();
        break;
    }

    obs.subscribe({
      next: (items) => {
        const list = this.range === 'PAST' ? items.filter((a) => getDoctorAppointmentEpochMs(a) < now) : items;
        this.appointments = this.sortByNearestUpcoming(list);
        this.loading = false;
      },
      error: () => {
        this.appointments = [];
        this.loading = false;
      }
    });
  }

  private applyRangeFilterAndSet(items: DoctorAppointmentItem[], now: number) {
    let list = items;
    if (this.range === 'TODAY') {
      const todayISO = new Date().toISOString().slice(0, 10);
      list = items.filter((a) => (a.appointmentDate || '').startsWith(todayISO));
    } else if (this.range === 'UPCOMING') {
      list = items.filter((a) => getDoctorAppointmentEpochMs(a) >= now);
    } else if (this.range === 'PAST') {
      list = items.filter((a) => getDoctorAppointmentEpochMs(a) < now);
    }
    this.appointments = this.sortByNearestUpcoming(list);
    this.loading = false;
  }

  filteredAppointments(): DoctorAppointmentItem[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    return (this.appointments || [])
      .filter((a) => term ? ((a.patientName || '').toLowerCase().includes(term) || (String(a.patientId || '').includes(term))) : true);
  }

  changeStatus(a: DoctorAppointmentItem, status: string) {
    if (!status) return;
    this.appts.updateAppointmentStatus(a.appointmentId, status).subscribe({
      next: () => this.refresh(),
    });
  }

  openDetails(a: DoctorAppointmentItem) {
    this.selectedAppointment = a;
    this.detailsOpen = true;
    this.patient = null;
    this.history = [];
    this.patients.getCompleteData(a.patientId).subscribe({
      next: (resp) => {
        this.patient = resp?.patient ?? null;
        this.history = (resp?.medicalHistory as any) || [];
      }
    });
    // Also load with-doctor records if available
    this.patients.getMedicalHistoryWithDoctor(a.patientId).subscribe({
      next: (h) => (this.history = h || this.history || []),
    });
  }

  viewHistoryDetail(h: any) {
    this.selectedHistoryDoctorInfo = {
      doctorName: h?.doctorName,
      doctorSpecialization: h?.doctorSpecialization,
      doctorContactInfo: h?.doctorContactInfo,
    };
    this.selectedHistoryDetail = null;
    this.historyDetailModalOpen = true;
    this.patients.getMedicalHistoryDetail(h.id).subscribe({
      next: (detail) => (this.selectedHistoryDetail = detail),
      error: () => (this.selectedHistoryDetail = { id: h.id, visitDate: h.visitDate } as any),
    });
  }

  closeHistoryDetail() {
    this.historyDetailModalOpen = false;
    this.selectedHistoryDetail = null;
    this.selectedHistoryDoctorInfo = null;
  }

  closeDetails() {
    this.detailsOpen = false;
    this.selectedAppointment = null;
    this.patient = null;
    this.history = [];
  }

  private dedupById(items: DoctorAppointmentItem[]) {
    const seen = new Set<number>();
    const out: DoctorAppointmentItem[] = [];
    for (const a of items) {
      if (!seen.has(a.appointmentId)) { seen.add(a.appointmentId); out.push(a); }
    }
    return out;
  }

  private sortByNearestUpcoming(items: DoctorAppointmentItem[]) {
    return items.slice().sort((x, y) => getDoctorAppointmentEpochMs(x) - getDoctorAppointmentEpochMs(y));
  }
}
