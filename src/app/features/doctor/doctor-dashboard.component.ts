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
      <div class="panel p-6 space-y-6">
      <!-- Header with profile picture (like patient dashboard) -->
      <div class="flex flex-wrap items-center gap-4 justify-between">
        <div class="flex items-center gap-4">
          <img
            *ngIf="profile?.profileImageUrl; else docAvatar"
            [src]="profile?.profileImageUrl"
            alt="Profile"
            class="w-16 h-16 rounded-full ring-2 ring-blue-600/40 object-cover"
          />
          <ng-template #docAvatar>
            <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-700">
              {{ (doctorName || 'D').charAt(0) }}
            </div>
          </ng-template>
          <div>
            <div class="text-lg">Welcome back,</div>
            <div class="text-2xl font-semibold" *ngIf="doctorName; else loadingName">
              {{ doctorName === 'Doctor' ? 'Doctor' : ('Dr. ' + doctorName) }}
            </div>
            <ng-template #loadingName>
              <div class="text-2xl font-semibold inline-flex items-center gap-2 text-gray-300">
                <i class="fa-solid fa-spinner animate-spin"></i>
              </div>
            </ng-template>
            <div class="text-gray-400" *ngIf="profile?.specialization"> {{ profile.specialization }}</div>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <app-doctor-notification></app-doctor-notification>
          <a class="btn-primary" routerLink="/doctor/profile">View Profile</a>
          <a class="btn-secondary" routerLink="/doctor">Refresh</a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border rounded">
          <h3 class="font-semibold mb-2">Profile Summary</h3>
          <ul class="text-sm text-gray-300 space-y-1" *ngIf="profile">
            <li>Email: {{ profile.email || '—' }}</li>
            <li>Phone: {{ profile.contactInfo || '—' }}</li>
            <li>Active: {{ profile.isActive ? 'Yes' : 'No' }}</li>
          </ul>
          <div class="text-sm text-gray-400" *ngIf="!profile">
            <span class="inline-flex items-center gap-2">
              <i class="fa-solid fa-spinner animate-spin"></i>
              <span>Loading profile…</span>
            </span>
          </div>
        </div>

        <div class="p-4 border rounded md:col-span-2">

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="panel p-4">
              <div class="text-sm text-gray-400">Today</div>
              <div class="text-2xl font-semibold">{{ (todayAppointments || []).length }}</div>
              <div class="text-xs text-gray-500 mt-1" *ngIf="loadingUpcoming">
                <span class="inline-flex items-center gap-1">
                  <i class="fa-solid fa-spinner animate-spin"></i>
                  <span>Loading today…</span>
                </span>
              </div>
            </div>
            <div class="panel p-4">
              <div class="text-sm text-gray-400">Upcoming</div>
              <div class="text-2xl font-semibold">{{ (upcomingAppointments || []).length }}</div>
              <div class="text-xs text-gray-500 mt-1" *ngIf="loadingUpcoming">
                <span class="inline-flex items-center gap-1">
                  <i class="fa-solid fa-spinner animate-spin"></i>
                  <span>Loading upcoming…</span>
                </span>
              </div>
            </div>
            <div class="panel p-4">
              <div class="text-sm text-gray-400">Confirmed</div>
              <div class="text-2xl font-semibold">{{ todayStats().CONFIRMED }}</div>
              <div class="text-xs text-gray-500 mt-1" *ngIf="loadingUpcoming">
                <span class="inline-flex items-center gap-1">
                  <i class="fa-solid fa-spinner animate-spin"></i>
                  <span>Loading…</span>
                </span>
              </div>
            </div>
            <div class="panel p-4">
              <div class="text-sm text-gray-400">Completed</div>
              <div class="text-2xl font-semibold">{{ todayStats().COMPLETED }}</div>
              <div class="text-xs text-gray-500 mt-1" *ngIf="loadingUpcoming">
                <span class="inline-flex items-center gap-1">
                  <i class="fa-solid fa-spinner animate-spin"></i>
                  <span>Loading…</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Today's Appointments -->
      <section class="p-4 border rounded">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">Today's Appointments</h3>
          <div class="flex items-center gap-2">
            <input
              type="text"
              class="input text-sm w-40"
              placeholder="Search patient"
              [(ngModel)]="searchTerm"
            />
            <select class="input text-sm" [(ngModel)]="filterStatus">
              <option *ngFor="let s of statusFilterOptions" [value]="s">{{ s }}</option>
            </select>
            <button class="btn-secondary" (click)="refreshToday()">Refresh</button>
          </div>
        </div>
        <div class="text-xs text-gray-400 mb-2" *ngIf="!loadingAppointments && todayAppointments.length > 0">
          Total: {{ todayAppointments.length }} • Scheduled: {{ todayStats().SCHEDULED }} • Confirmed: {{ todayStats().CONFIRMED }} • In Progress: {{ todayStats().IN_PROGRESS }} • Completed: {{ todayStats().COMPLETED }} • Cancelled: {{ todayStats().CANCELLED }}
        </div>
        <div *ngIf="loadingAppointments" class="text-gray-400">
          <span class="inline-flex items-center gap-2">
            <i class="fa-solid fa-spinner animate-spin"></i>
            <span>Loading appointments…</span>
          </span>
        </div>
        <div *ngIf="!loadingAppointments && todayAppointments.length === 0" class="text-gray-400">No appointments today.</div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" *ngIf="!loadingAppointments">
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
      </section>

      <!-- See All Appointments Button -->
      <!-- <div class="mt-3">
        <button class="btn-secondary" [routerLink]="['/doctor/appointments']">See All Appointments</button>
      </div> -->

      

      <app-patient-details-modal
        [open]="patientModalOpen"
        [patient]="selectedPatient?.patient || null"
        [history]="medicalHistoryWithDoctor"
        (close)="closePatientModal()"
        (historyClick)="viewHistoryDetail($event)"
      ></app-patient-details-modal>

      <!-- History Detail Modal (Shared) -->
      <app-medical-history-detail-modal
        [open]="historyDetailModalOpen"
        [detail]="selectedHistoryDetail"
        [doctorInfo]="selectedHistoryDoctorInfo"
        (close)="closeHistoryDetail()"
      ></app-medical-history-detail-modal>

      <!-- Create Medical Description Modal (Shared) -->
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
      if (stats[a.status] != null) stats[a.status]++;
    }
    return stats as any;
  }

  statusOptionsFor(a: DoctorAppointmentItem): string[] {
    const s = (a.status || '').toUpperCase();
    if (s === 'BOOKED') return ['SCHEDULED', 'CANCELLED'];
    if (s === 'SCHEDULED') return ['CONFIRMED', 'CANCELLED'];
    if (s === 'CONFIRMED') return ['IN_PROGRESS'];
    if (s === 'IN_PROGRESS') return ['COMPLETED'];
    return [s];
  }

  statusLabel(a: DoctorAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    if (s === 'CANCELLED') {
      const me = (this.username || '').toLowerCase();
      const by = (a.statusChangedBy || '').toLowerCase();
      return me && by && me === by ? 'CANCELLED_BY_DOCTOR' : 'CANCELLED_BY_PATIENT';
    }
    return s;
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

  statusBadgeClass(status: string) {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-yellow-900/40 text-yellow-300 border border-yellow-800/50';
      case 'CONFIRMED':
        return 'bg-green-900/40 text-green-300 border border-green-800/50';
      case 'IN_PROGRESS':
        return 'bg-blue-900/40 text-blue-300 border border-blue-800/50';
      case 'COMPLETED':
        return 'bg-gray-800 text-gray-300 border border-gray-700';
      case 'CANCELLED':
        return 'bg-red-900/40 text-red-300 border border-red-800/50';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  }
  private todayISO() {
    return new Date().toISOString().slice(0, 10);
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
        const order = ['January','February','March','April','May','June','July','August','September','October','November','December'];
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
