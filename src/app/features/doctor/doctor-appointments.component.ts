import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DoctorAppointmentCardComponent } from '../../shared/doctor-appointment-card.component';
import { getDoctorAppointmentEpochMs } from '../../shared/doctor-appointment-utils';
import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { SharedChatModalComponent } from '../../shared/chat/shared-chat-modal.component';
import { PatientProfileService, PatientDto, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { forkJoin, map, firstValueFrom } from 'rxjs';
import { SelectDropdownComponent, SelectOption } from '../../shared/select-dropdown.component';

type TimeRange = 'UPCOMING' | 'TODAY' | 'PAST' | 'ALL';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DoctorAppointmentCardComponent, PatientDetailsModalComponent, MedicalHistoryDetailModalComponent, DoctorLayoutComponent, SharedChatModalComponent, SelectDropdownComponent],
  template: `
    <app-doctor-layout>
    <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Appointments</h2>
          <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Manage your patient appointments and schedules</p>
        </div>
      </div>

      <!-- Filters (Minimized & Collapsible for Mobile) -->
      <div class="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-3 sm:space-y-4">
        <div class="flex items-center justify-between cursor-pointer sm:cursor-default" (click)="toggleFilter()">
           <div class="flex items-center gap-2 min-w-0">
             <i class="fa-solid fa-filter text-blue-600 dark:text-blue-400 text-xs sm:text-sm"></i>
             <h3 class="font-semibold text-xs sm:text-base text-gray-900 dark:text-white">Filters</h3>
             <span *ngIf="statusFilter !== 'ALL' || searchTerm || range !== 'ALL'" class="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">
               Active
             </span>
           </div>
           
           <div class="flex items-center gap-2 shrink-0" (click)="$event.stopPropagation()">
             <button *ngIf="statusFilter !== 'ALL' || searchTerm || range !== 'ALL'" 
                     (click)="statusFilter='ALL'; range='ALL'; searchTerm=''; refresh()" 
                     class="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium hover:underline transition-all">
               Clear All
             </button>
             <button (click)="toggleFilter()" class="sm:hidden text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold transition-all shrink-0">
               <i class="fa-solid fa-sliders text-[10px]"></i>
               <span>{{ isFilterExpanded ? 'Hide' : 'Filter' }}</span>
               <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-300" [class.rotate-180]="isFilterExpanded"></i>
             </button>
           </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5 transition-all duration-300"
             [ngClass]="{ 'hidden sm:grid': !isFilterExpanded, 'grid pt-2': isFilterExpanded }">
          <!-- Status Filter -->
          <div class="space-y-1">
            <label class="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</label>
              <app-select-dropdown
                [(ngModel)]="statusFilter"
                [options]="statusOptions"
                (ngModelChange)="onFilterChange()"
                placeholder="All Statuses">
              </app-select-dropdown>
          </div>

          <!-- Search Filter -->
          <div class="space-y-1">
            <label class="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Search</label>
            <div class="relative">
              <input type="text" class="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white" [(ngModel)]="searchTerm" (input)="onFilterChange()" placeholder="Search patient name or ID..." />
            </div>
          </div>

          <!-- Time Range Filter -->
          <div class="space-y-1">
            <label class="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Range</label>
            <div class="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl gap-1">
              <button class="flex-1 py-1 px-1.5 text-xs font-medium rounded-lg transition-all" [class.bg-white]="range==='TODAY'" [class.dark:bg-gray-800]="range==='TODAY'" [class.shadow-sm]="range==='TODAY'" [class.text-blue-600]="range==='TODAY'" (click)="setRange('TODAY')">Today</button>
              <button class="flex-1 py-1 px-1.5 text-xs font-medium rounded-lg transition-all" [class.bg-white]="range==='UPCOMING'" [class.dark:bg-gray-800]="range==='UPCOMING'" [class.shadow-sm]="range==='UPCOMING'" [class.text-blue-600]="range==='UPCOMING'" (click)="setRange('UPCOMING')">Upcoming</button>
              <button class="flex-1 py-1 px-1.5 text-xs font-medium rounded-lg transition-all" [class.bg-white]="range==='PAST'" [class.dark:bg-gray-800]="range==='PAST'" [class.shadow-sm]="range==='PAST'" [class.text-blue-600]="range==='PAST'" (click)="setRange('PAST')">Past</button>
              <button class="flex-1 py-1 px-1.5 text-xs font-medium rounded-lg transition-all" [class.bg-white]="range==='ALL'" [class.dark:bg-gray-800]="range==='ALL'" [class.shadow-sm]="range==='ALL'" [class.text-blue-600]="range==='ALL'" (click)="setRange('ALL')">All</button>
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
          (start)="startConsultation($event)"
          (complete)="changeStatus($event, 'COMPLETED')"
          (cancel)="changeStatus($event, 'CANCELLED')"
          (joinVideo)="joinConsultation($event)"
          (statusChange)="changeStatus($event.appointment, $event.status)"
          (openChat)="openChat($event)"
        ></doctor-appointment-card>
      </div>

      <!-- Fixed Bottom Pagination Bar -->
      <div *ngIf="!loading && totalAppointmentsCount > 0"
        class="fixed bottom-16 md:bottom-0 left-0 md:left-64 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-2xl px-4 sm:px-8 py-2 flex items-center justify-between transition-all">
        
        <div class="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <span class="font-medium">
            Showing <span class="font-bold text-gray-900 dark:text-gray-100">{{ startItemIndex }}–{{ endItemIndex }}</span> of <span class="font-bold text-blue-600 dark:text-blue-400">{{ totalAppointmentsCount }}</span> appointments
          </span>
          <span class="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
          <span class="hidden sm:inline font-medium">
            Page <span class="font-semibold text-gray-900 dark:text-gray-100">{{ page + 1 }}</span> of {{ totalPages }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button class="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
            [disabled]="page === 0" (click)="prevPage()">
            <i class="fa-solid fa-chevron-left text-[10px]"></i> Prev
          </button>

          <span class="sm:hidden text-xs font-semibold text-gray-700 dark:text-gray-300 px-1">
            {{ page + 1 }}/{{ totalPages }}
          </span>

          <button class="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
            [disabled]="page >= totalPages - 1" (click)="nextPage()">
            Next <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>

      <!-- Details Modal (Shared) -->
      <app-patient-details-modal
        [open]="detailsOpen"
        [patient]="patient"
        [history]="history"
        [documents]="documents"
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

      <!-- Shared Chat Modal -->
      <app-shared-chat-modal
        [isOpen]="chatOpen"
        [appointmentId]="chatAppointmentId"
        [participantName]="chatParticipantName"
        [participantImage]="chatParticipantImage"
        (close)="closeChat()"
      ></app-shared-chat-modal>
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
  statusFilter: string = 'ALL';
  statuses: string[] = [];
  isFilterExpanded = false;

  toggleFilter() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

  get statusOptions(): SelectOption[] {
    return [
      { value: 'ALL', label: 'All Statuses' },
      ...this.statuses.map(s => ({ value: s, label: s }))
    ];
  }
  range: TimeRange = 'UPCOMING';
  searchTerm = '';

  // Pagination state
  page = 0;
  size = 10;
  totalAppointmentsCount = 0;

  get startItemIndex(): number {
    if (this.totalAppointmentsCount === 0) return 0;
    return this.page * this.size + 1;
  }

  get endItemIndex(): number {
    return Math.min((this.page + 1) * this.size, this.totalAppointmentsCount);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalAppointmentsCount / this.size));
  }

  // Modal state
  detailsOpen = false;
  patient: PatientDto | null = null;
  history: MedicalHistoryWithDoctorItem[] = [];
  documents: any[] = [];
  selectedAppointment: DoctorAppointmentItem | null = null;

  // History detail modal state
  historyDetailModalOpen = false;
  selectedHistoryDetail: any | null = null;
  selectedHistoryDoctorInfo: { doctorName: string; doctorSpecialization?: string; doctorContactInfo?: string } | null = null;

  constructor(
    private appts: AppointmentService,
    private patients: PatientProfileService,
    private router: Router,
    private masterDataService: MasterDataService
  ) {
    this.refresh();
    this.masterDataService.getStatuses().subscribe({
      next: (s) => this.statuses = s || []
    });
  }

  refresh() {
    this.page = 0;
    this.loadAppointments();
  }

  setRange(r: TimeRange) {
    this.range = r;
    this.page = 0;
    this.loadAppointments();
  }

  onFilterChange() {
    this.page = 0;
    this.loadAppointments();
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadAppointments();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadAppointments();
    }
  }

  private loadAppointments() {
    this.loading = true;

    this.appts.getDoctorPaginatedAppointments(this.page, this.size, this.statusFilter, this.range, this.searchTerm).subscribe({
      next: (items) => {
        this.appointments = items || [];
        this.loading = false;
      },
      error: () => {
        this.appointments = [];
        this.loading = false;
      }
    });

    this.appts.countDoctorAppointments(this.statusFilter, this.range, this.searchTerm).subscribe({
      next: (count) => {
        this.totalAppointmentsCount = count || 0;
      },
      error: () => {
        this.totalAppointmentsCount = 0;
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

  startConsultation(a: DoctorAppointmentItem) {
    this.appts.updateAppointmentStatus(a.appointmentId, 'IN_PROGRESS').subscribe({
      next: (updated) => {
        this.refresh();
        this.joinConsultation(updated);
      },
      error: (err: any) => console.error('Error starting consultation:', err)
    });
  }

  joinConsultation(a: DoctorAppointmentItem) {
    this.router.navigate(['/doctor/consultation', a.appointmentId]);
  }

  openDetails(a: DoctorAppointmentItem) {
    this.selectedAppointment = a;
    this.detailsOpen = true;
    this.patient = null;
    this.history = [];
    this.documents = [];
    this.patients.getCompleteData(a.patientId).subscribe({
      next: (resp) => {
        this.patient = resp?.patient ?? null;
        this.history = (resp?.medicalHistory as any) || [];
        this.documents = resp?.documents || [];
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
    this.documents = [];
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
    const now = Date.now();
    const upcoming = items.filter(a => getDoctorAppointmentEpochMs(a) >= now);
    const past = items.filter(a => getDoctorAppointmentEpochMs(a) < now);

    // Sort upcoming by nearest date (Ascending)
    upcoming.sort((a, b) => getDoctorAppointmentEpochMs(a) - getDoctorAppointmentEpochMs(b));

    // Sort past by most recent date (Descending)
    past.sort((a, b) => getDoctorAppointmentEpochMs(b) - getDoctorAppointmentEpochMs(a));

    return [...upcoming, ...past];
  }

  // Chat Logic
  chatOpen = false;
  chatAppointmentId: number | null = null;
  chatParticipantName: string | null = null;
  chatParticipantImage: string | null = null;

  openChat(a: DoctorAppointmentItem) {
    this.chatAppointmentId = a.appointmentId;
    this.chatParticipantName = a.patientName || 'Patient';
    this.chatParticipantImage = a.patientProfileImageUrl || null;
    this.chatOpen = true;
  }

  closeChat() {
    this.chatOpen = false;
    this.chatAppointmentId = null;
    this.chatParticipantName = null;
    this.chatParticipantImage = null;
  }
}
