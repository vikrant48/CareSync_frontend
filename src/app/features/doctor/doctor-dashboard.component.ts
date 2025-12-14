import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DoctorAppointmentCardComponent } from '../../shared/doctor-appointment-card.component';
import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { MedicalHistoryFormModalComponent } from '../../shared/medical-history-form-modal.component';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { DoctorNotificationComponent } from './doctor-notification.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { getDoctorAppointmentEpochMs } from '../../shared/doctor-appointment-utils';
import { PatientProfileService, PatientDto, MedicalHistoryItem, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';

import { AnalyticsApiService, OverallAnalytics } from '../../core/services/analytics.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { forkJoin } from 'rxjs';
// Removed NotificationService imports; logic moved to dedicated component

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DoctorAppointmentCardComponent, PatientDetailsModalComponent, MedicalHistoryDetailModalComponent, MedicalHistoryFormModalComponent, DoctorLayoutComponent, DoctorNotificationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-doctor-layout>
      <div class="max-w-7xl mx-auto p-6 space-y-8">
        <!-- Welcome Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div class="absolute inset-0 bg-white/10 opacity-30 pattern-dots"></div>
          <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-6">
              <div class="relative">
                <div class="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                  <img *ngIf="profile?.profileImageUrl" [src]="profile?.profileImageUrl" class="w-full h-full object-cover" />
                  <span *ngIf="!profile?.profileImageUrl">{{ (doctorName || 'D').charAt(0) }}</span>
                </div>
                <div *ngIf="profile?.isVerified" class="absolute -bottom-1 -right-1 bg-green-400 text-white text-xs p-1.5 rounded-full border-2 border-indigo-700" title="Verified">
                  <i class="fa-solid fa-check"></i>
                </div>
              </div>
              <div>
                <h1 class="text-3xl font-bold mb-1">Welcome back, {{ doctorName === 'Doctor' ? 'Doctor' : 'Dr. ' + doctorName }}!</h1>
                <p class="text-blue-100 text-lg flex items-center gap-2">
                  <span>{{ profile?.specialization || 'General Practitioner' }}</span>
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                  <span class="opacity-90">{{ todayISO() | date:'fullDate' }}</span>
                </p>
              </div>
            </div>
            <div class="flex gap-3">
               <app-doctor-notification></app-doctor-notification>
               <a routerLink="/doctor/profile" class="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/40 px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center gap-2">
                 <i class="fa-regular fa-user"></i> Profile
               </a>
               <button (click)="refreshToday(); refreshUpcoming()" class="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2">
                 <i class="fa-solid fa-arrows-rotate" [class.animate-spin]="loadingAppointments || loadingUpcoming"></i>
               </button>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Today -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">Today's Appointments</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white" *ngIf="!loadingAppointments">{{ (todayAppointments || []).length }}</div>
              <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" *ngIf="loadingAppointments"></div>
            </div>
          </div>

          <!-- Upcoming -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-calendar-plus"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">Upcoming</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white" *ngIf="!loadingUpcoming">{{ (upcomingAppointments || []).length }}</div>
              <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" *ngIf="loadingUpcoming"></div>
            </div>
          </div>

          <!-- Confirmed Today -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-check-circle"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">Confirmed Today</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white" *ngIf="!loadingAppointments">{{ todayStats().CONFIRMED }}</div>
               <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" *ngIf="loadingAppointments"></div>
            </div>
          </div>

          <!-- Pending (Scheduled) -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-clock"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending Requests</div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white" *ngIf="!loadingAppointments">{{ todayStats().SCHEDULED }}</div>
               <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" *ngIf="loadingAppointments"></div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Today's Agenda (Left 2/3) -->
          <div class="lg:col-span-2 space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="fa-regular fa-calendar-check text-blue-500"></i> Today's Agenda
              </h2>
              <div class="flex gap-2">
                 <select class="input-sm text-sm rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" [(ngModel)]="filterStatus">
                   <option *ngFor="let s of statusFilterOptions" [value]="s">{{ s === 'ALL' ? 'All Statuses' : s }}</option>
                 </select>
              </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loadingAppointments" class="flex flex-col items-center justify-center py-12 text-gray-400">
               <i class="fa-solid fa-spinner animate-spin text-3xl mb-3"></i>
               <p>Loading your schedule...</p>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loadingAppointments && filteredTodayAppointments().length === 0" class="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-dashed border-gray-200 dark:border-gray-700">
               <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
                 <i class="fa-regular fa-calendar-xmark"></i>
               </div>
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">No appointments found</h3>
               <p class="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                 {{ filterStatus !== 'ALL' ? 'Try changing your status filter.' : 'You have no appointments scheduled for today yet.' }}
               </p>
               <button *ngIf="filterStatus !== 'ALL'" (click)="filterStatus='ALL'" class="mt-4 text-blue-600 font-medium hover:underline">Clear Filter</button>
            </div>

            <!-- Agenda Grid -->
            <div class="grid gap-4" *ngIf="!loadingAppointments && filteredTodayAppointments().length > 0">
              <doctor-appointment-card
                *ngFor="let a of filteredTodayAppointments()"
                [appointment]="a"
                [showStatusSelect]="true"
                (viewPatient)="openPatient($event)"
                (openHistoryForm)="openHistoryForm($event)"
                (schedule)="schedule($event)"
                (confirm)="confirm($event)"
                (start)="start($event)"
                (complete)="complete($event)"
                (cancel)="cancel($event)"
                (statusChange)="changeStatus($event.appointment, $event.status)"
              ></doctor-appointment-card>
            </div>
          </div>

          <!-- Sidebar (Right 1/3) -->
          <div class="space-y-6">
            <!-- Profile Quick View -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
               <h3 class="font-bold text-gray-900 dark:text-white mb-4">Profile Details</h3>
               <div class="space-y-3">
                 <div class="flex items-center gap-3 text-sm">
                   <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center"><i class="fa-solid fa-envelope"></i></div>
                   <div class="truncate flex-1 text-gray-600 dark:text-gray-300">{{ profile?.email || 'No email' }}</div>
                 </div>
                 <div class="flex items-center gap-3 text-sm">
                   <div class="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center"><i class="fa-solid fa-phone"></i></div>
                   <div class="truncate flex-1 text-gray-600 dark:text-gray-300">{{ profile?.contactInfo || 'No phone' }}</div>
                 </div>
                  <div class="flex items-center gap-3 text-sm">
                   <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center"><i class="fa-solid fa-user-tag"></i></div>
                   <div class="truncate flex-1 text-gray-600 dark:text-gray-300">{{ profile?.isActive ? 'Active Status' : 'Inactive' }}</div>
                 </div>
               </div>
               <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <a routerLink="/doctor/profile" class="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 justify-center">Manage Profile <i class="fa-solid fa-arrow-right"></i></a>
               </div>
            </div>

             <!-- Quick Actions (Optional placeholder for future features) -->
            <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
              <h3 class="font-bold mb-2">Need Help?</h3>
              <p class="text-indigo-100 text-sm mb-4">Check out our guide for doctors to manage appointments effectively.</p>
              <button class="bg-white text-indigo-700 text-sm font-bold py-2 px-4 rounded-lg w-full hover:bg-indigo-50 transition-colors">View Guide</button>
            </div>
          
          </div>
        </div>

        <!-- Modals -->
        <app-patient-details-modal
          [open]="patientModalOpen"
          [patient]="selectedPatient?.patient || null"
          [history]="medicalHistoryWithDoctor"
          (close)="closePatientModal()"
          (historyClick)="viewHistoryDetail($event)"
        ></app-patient-details-modal>

        <app-medical-history-detail-modal
          [open]="historyDetailModalOpen"
          [detail]="selectedHistoryDetail"
          [doctorInfo]="selectedHistoryDoctorInfo"
          (close)="closeHistoryDetail()"
        ></app-medical-history-detail-modal>

        <app-medical-history-form-modal
          [open]="historyFormModalOpen"
          [form]="mhForm"
          [disabled]="selectedAppointment?.status !== 'IN_PROGRESS'"
          [saving]="savingHistory"
          [saved]="historySaved"
          [error]="historyError"
          [infoText]="selectedAppointment?.status !== 'IN_PROGRESS' ? 'Form available only for in-progress appointments.' : null"
          (close)="closeHistoryForm()"
          (submit)="saveMedicalHistory()"
        ></app-medical-history-form-modal>
      </div>
    </app-doctor-layout>
  `,
  styles: [`
    :host { display: block; }
    .pattern-dots {
      background-image: radial-gradient(white 1.5px, transparent 1.5px);
      background-size: 24px 24px;
    }
    .input-sm {
      @apply py-1.5 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow dark:bg-gray-900/50 dark:border-gray-700 dark:text-white;
    }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private svc = inject(DoctorProfileService);
  private apptApi = inject(AppointmentService);
  private patientApi = inject(PatientProfileService);

  private analyticsApi = inject(AnalyticsApiService);
  private reportsApi = inject(ReportsApiService);
  private cdr = inject(ChangeDetectorRef);
  username: string | null = null;
  doctorId: number | null = null;
  doctorName: string | null = null;
  profile: any = null;
  documents: any[] = [];

  // Appointments
  todayAppointments: DoctorAppointmentItem[] = [];
  loadingAppointments = false;
  statusOptions: string[] = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  statusFilterOptions: string[] = ['ALL', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  filterStatus: string = 'ALL';
  searchTerm: string = '';
  upcomingAppointments: DoctorAppointmentItem[] = [];
  loadingUpcoming = false;

  // Patient modal
  patientModalOpen = false;
  selectedAppointment: DoctorAppointmentItem | null = null;
  selectedPatient: { patient: PatientDto; medicalHistory: MedicalHistoryItem[]; documents: any[] } | null = null;
  medicalHistoryWithDoctor: MedicalHistoryWithDoctorItem[] = [];
  mhForm: Partial<MedicalHistoryItem> = { visitDate: this.todayISO() };
  savingHistory = false;
  historySaved = false;
  historyError: string | null = null;
  historyDetailModalOpen = false;
  selectedHistoryDetail: MedicalHistoryItem | null = null;
  selectedHistoryDoctorInfo: MedicalHistoryWithDoctorItem | null = null;
  historyFormModalOpen = false;
  currentYear: number = new Date().getFullYear();


  // Analytics state
  overall: OverallAnalytics | null = null;
  peakHours: any = null;
  dayOfWeek: any = null;
  retention: any = null;
  feedbackSentiment: any = null;
  performance: any = null;
  appointmentDuration: any = null;
  seasonalTrends: any = null;
  cancellationPatterns: any = null;
  patientDemographics: any = null;
  appointmentTrendsDaily: any = null;
  revenueAnalysis: any = null;
  analyticsRangeText: string | null = null;

  // Chart data holders
  peakHoursLabels: string[] = [];
  peakHoursData: number[] = [];
  dayOfWeekLabels: string[] = [];
  dayOfWeekData: number[] = [];
  feedbackLabels: string[] = ['Positive', 'Neutral', 'Negative'];
  feedbackData: number[] = [];
  demographicsLabels: string[] = [];
  demographicsData: number[] = [];
  seasonalLabels: string[] = [];
  seasonalData: number[] = [];
  dailyTrendLabels: string[] = [];
  dailyTrendData: number[] = [];

  ngOnInit(): void {
    this.username = this.auth.username();
    const idStr = this.auth.userId();
    this.doctorId = idStr ? Number(idStr) : null;

    if (this.username) {
      this.svc.getProfile(this.username).subscribe({
        next: (p) => {
          this.profile = p;
          const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
          this.doctorName = name || p?.username || this.username || 'Doctor';
          this.cdr.markForCheck();
        },
      });
    }
    if (this.doctorId != null) {
      this.svc.getDocumentsByDoctor(this.doctorId).subscribe({
        next: (docs) => (this.documents = (docs || []).slice(0, 6)),
      });
      this.refreshToday();
      +     this.refreshUpcoming();
    }
  }

  refreshToday() {
    this.loadingAppointments = true;
    this.apptApi.getDoctorTodayAppointments().subscribe({
      next: (res) => {
        this.todayAppointments = res || [];
        this.loadingAppointments = false;
      },
      error: () => (this.loadingAppointments = false),
    });
  }

  confirm(a: DoctorAppointmentItem) {
    this.apptApi.confirmAppointment(a.appointmentId).subscribe({ next: () => this.refreshToday() });
  }
  schedule(a: DoctorAppointmentItem) {
    this.apptApi.updateAppointmentStatus(a.appointmentId, 'SCHEDULED').subscribe({ next: () => this.refreshToday() });
  }
  complete(a: DoctorAppointmentItem) {
    this.apptApi.completeAppointment(a.appointmentId).subscribe({ next: () => this.refreshToday() });
  }
  cancel(a: DoctorAppointmentItem) {
    this.apptApi.cancelAppointment(a.appointmentId).subscribe({ next: () => this.refreshToday() });
  }
  start(a: DoctorAppointmentItem) {
    this.apptApi.updateAppointmentStatus(a.appointmentId, 'IN_PROGRESS').subscribe({ next: () => this.refreshToday() });
  }

  refreshUpcoming() {
    this.loadingUpcoming = true;
    const now = Date.now();
    const toFuture = (list: DoctorAppointmentItem[]) => (list || []).filter((a) => getDoctorAppointmentEpochMs(a) > now);

    forkJoin([
      this.apptApi.getDoctorUpcomingAppointments(),
      this.apptApi.getDoctorAppointmentsByStatus('SCHEDULED'),
      this.apptApi.getDoctorAppointmentsByStatus('CONFIRMED'),
      this.apptApi.getDoctorAppointmentsByStatus('BOOKED'),
    ]).subscribe({
      next: ([up, sched, conf, booked]) => {
        const all = [...(up || []), ...(sched || []), ...(conf || []), ...(booked || [])];
        const dedup = new Map<number, DoctorAppointmentItem>();
        all.forEach((x) => dedup.set(x.appointmentId, x));
        this.upcomingAppointments = toFuture(Array.from(dedup.values()));
        this.loadingUpcoming = false;
      },
      error: () => (this.loadingUpcoming = false),
    });
  }

  changeStatus(a: DoctorAppointmentItem, status: string) {
    if (!status) return;
    this.apptApi.updateAppointmentStatus(a.appointmentId, status).subscribe({
      next: () => this.refreshToday(),
    });
  }

  filteredTodayAppointments(): DoctorAppointmentItem[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    return (this.todayAppointments || [])
      .filter((a) =>
        this.filterStatus === 'ALL' ? true : a.status === this.filterStatus
      )
      .filter((a) =>
        term ? (a.patientName || '').toLowerCase().includes(term) : true
      );
  }

  todayStats(): Record<'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED', number> {
    const stats = { SCHEDULED: 0, CONFIRMED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 } as Record<any, number>;
    for (const a of this.todayAppointments || []) {
      if (a.status === 'CANCELLED_BY_PATIENT' || a.status === 'CANCELLED_BY_DOCTOR' || a.status === 'CANCELLED') {
        stats['CANCELLED']++;
      } else if (stats[a.status] != null) {
        stats[a.status]++;
      }
    }
    return stats as any;
  }

  todayDate = new Date();

  // Make helper public or just use property
  public todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  filteredUpcomingAppointments(): DoctorAppointmentItem[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    return (this.upcomingAppointments || [])
      .filter((a) => (this.filterStatus === 'ALL' ? true : a.status === this.filterStatus))
      .filter((a) => (term ? (a.patientName || '').toLowerCase().includes(term) : true));
  }

  // getEpochMs moved to shared doctor-appointment-utils

  // Notifications state and logic
  // Notification logic removed; handled by DoctorNotificationComponent

  // ngOnDestroy not needed for notifications; no local polling

  openPatient(a: DoctorAppointmentItem) {
    // Ensure other modals are closed
    this.historyFormModalOpen = false;
    this.historyDetailModalOpen = false;

    this.selectedAppointment = a;
    this.patientModalOpen = true;
    this.selectedPatient = null;
    this.mhForm = { visitDate: this.todayISO() };
    this.patientApi.getCompleteData(a.patientId).subscribe({
      next: (data) => {
        this.selectedPatient = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedPatient = { patient: {} as any, medicalHistory: [], documents: [] };
        this.cdr.detectChanges();
      },
    });
    this.medicalHistoryWithDoctor = [];
    this.patientApi.getMedicalHistoryWithDoctor(a.patientId).subscribe({
      next: (list) => {
        this.medicalHistoryWithDoctor = list || [];
        this.cdr.detectChanges();
      },
    });
  }

  openHistoryForm(a: DoctorAppointmentItem) {
    // Ensure other modals are closed
    this.patientModalOpen = false;
    this.historyDetailModalOpen = false;

    this.selectedAppointment = a;
    this.mhForm = { visitDate: this.todayISO() };
    this.historyFormModalOpen = true;
    this.cdr.detectChanges();
  }

  closePatientModal() {
    this.patientModalOpen = false;
    this.selectedAppointment = null;
    this.selectedPatient = null;
  }

  viewHistoryDetail(item: MedicalHistoryWithDoctorItem) {
    this.selectedHistoryDoctorInfo = item;
    this.selectedHistoryDetail = null;
    this.historyDetailModalOpen = true;
    this.patientApi.getMedicalHistoryDetail(item.id).subscribe({
      next: (detail) => {
        this.selectedHistoryDetail = detail;
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedHistoryDetail = { id: item.id, visitDate: item.visitDate } as any;
        this.cdr.detectChanges();
      },
    });
  }

  closeHistoryDetail() {
    this.historyDetailModalOpen = false;
    this.selectedHistoryDetail = null;
    this.selectedHistoryDoctorInfo = null;
  }

  closeHistoryForm() {
    this.historyFormModalOpen = false;
    this.mhForm = { visitDate: this.todayISO() };
    this.historyError = null;
    this.historySaved = false;
    this.cdr.detectChanges();
  }

  saveMedicalHistory() {
    if (!this.selectedAppointment) return;

    if (this.savingHistory) {
      return;
    }

    this.savingHistory = true;
    this.historySaved = false;
    this.historyError = null;
    this.cdr.detectChanges();

    if (this.doctorId == null) {
      this.savingHistory = false;
      this.cdr.detectChanges();
      return;
    }

    this.patientApi
      .addMedicalHistoryWithDoctor(this.selectedAppointment.patientId, this.doctorId, this.mhForm)
      .subscribe({
        next: () => {
          this.savingHistory = false;
          this.historySaved = true;
          this.cdr.detectChanges();
          // Close form after successful save
          this.closeHistoryForm();
        },
        error: (e) => {
          console.error('Failed to save medical history', e);
          this.historyError = 'Failed to save medical history';
          this.savingHistory = false;
          this.cdr.detectChanges();
        },
      });
  }

  private isoDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  loadAnalytics() {
    if (this.doctorId == null) return;
    const end = new Date().toISOString().slice(0, 10);
    const start = this.isoDaysAgo(30);
    this.analyticsRangeText = `${start}  ${end}`;

    this.analyticsApi.getOverallAnalytics(start, end).subscribe({ next: (o) => (this.overall = o || null) });
    this.analyticsApi.getPeakHours(this.doctorId, start, end).subscribe({
      next: (res) => {
        this.peakHours = res || null;
        const dist = this.peakHours?.hourlyDistribution || {};
        const labels = Object.keys(dist).sort((a, b) => Number(a) - Number(b));
        this.peakHoursLabels = labels;
        this.peakHoursData = labels.map((k) => Number(dist[k] || 0));
      },
    });
    this.analyticsApi.getDayOfWeek(this.doctorId, start, end).subscribe({
      next: (res) => {
        this.dayOfWeek = res || null;
        const dist = this.dayOfWeek?.dayDistribution || {};
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const labels = order.filter((d) => dist.hasOwnProperty(d));
        this.dayOfWeekLabels = labels;
        this.dayOfWeekData = labels.map((k) => Number(dist[k] || 0));
      },
    });
    this.analyticsApi.getPatientRetention(this.doctorId).subscribe({ next: (res) => (this.retention = res || null) });
    this.analyticsApi.getFeedbackSentiment(this.doctorId).subscribe({
      next: (res) => {
        this.feedbackSentiment = res || null;
        const s = this.feedbackSentiment || {};
        this.feedbackData = [Number(s.positivePercentage || 0), Number(s.neutralPercentage || 0), Number(s.negativePercentage || 0)];
      },
    });
    this.analyticsApi.getAppointmentDuration(this.doctorId, start, end).subscribe({ next: (res) => (this.appointmentDuration = res || null) });
    this.analyticsApi.getSeasonalTrends(this.doctorId, new Date().getFullYear()).subscribe({
      next: (res) => {
        this.seasonalTrends = res || null;
        const dist = this.seasonalTrends?.monthlyDistribution || {};
        const order = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const labels = order.filter((m) => dist.hasOwnProperty(m));
        this.seasonalLabels = labels;
        this.seasonalData = labels.map((k) => Number(dist[k] || 0));
      },
    });
    this.analyticsApi.getCancellationPatterns(this.doctorId, start, end).subscribe({ next: (res) => (this.cancellationPatterns = res || null) });
    this.analyticsApi.getPatientDemographicsByDoctor(this.doctorId).subscribe({
      next: (res) => {
        this.patientDemographics = res || null;
        const dist = this.patientDemographics?.ageDistribution || {};
        const labels = Object.keys(dist);
        this.demographicsLabels = labels;
        this.demographicsData = labels.map((k) => Number(dist[k] || 0));
      },
    });
    this.reportsApi.getDoctorPerformance(this.doctorId, start, end).subscribe({ next: (res) => (this.performance = res || null) });
    this.reportsApi.getAppointmentTrends('daily', start, end).subscribe({
      next: (res) => {
        this.appointmentTrendsDaily = res || null;
        const dist = this.appointmentTrendsDaily?.daily || {};
        const labels = Object.keys(dist).sort((a, b) => a.localeCompare(b));
        this.dailyTrendLabels = labels;
        this.dailyTrendData = labels.map((k) => Number(dist[k] || 0));
      },
    });
    this.reportsApi.getRevenueAnalysis(start, end).subscribe({ next: (res) => (this.revenueAnalysis = res || null) });
  }
}
