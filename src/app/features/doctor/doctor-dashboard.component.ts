import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DoctorAppointmentCardComponent } from '../../shared/doctor-appointment-card.component';
import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { MedicalHistoryFormModalComponent } from '../../shared/medical-history-form-modal.component';
import { ChartWidgetComponent } from '../../shared/chart-widget.component';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { getDoctorAppointmentEpochMs } from '../../shared/doctor-appointment-utils';
import { PatientProfileService, PatientDto, MedicalHistoryItem, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';

import { AnalyticsApiService, OverallAnalytics } from '../../core/services/analytics.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { forkJoin } from 'rxjs';
import { NotificationService, NotificationStatus, NotificationItem } from '../../core/services/notification.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DoctorAppointmentCardComponent, PatientDetailsModalComponent, MedicalHistoryDetailModalComponent, MedicalHistoryFormModalComponent, ChartWidgetComponent, DoctorLayoutComponent],
  template: `
    <app-doctor-layout>
      <div class="panel p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">Doctor Dashboard</h2>
          <p class="text-gray-400" *ngIf="profile">
            Welcome, {{ profile.firstName }} {{ profile.lastName }}
            <span *ngIf="profile.specialization"> — {{ profile.specialization }}</span>
          </p>
          <p class="text-gray-400" *ngIf="!profile">Welcome, {{ username || 'Doctor' }}</p>
        </div>
        <div class="flex gap-2 items-center">
          <div class="relative">
            <button class="btn-secondary relative" (click)="toggleNotif()" title="Notifications" aria-label="Notifications">
              <span class="mr-1 text-lg">🔔</span>
              <span class="text-sm">Notifications</span>
              <span *ngIf="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">{{ unreadCount }}</span>
            </button>
            <div *ngIf="notifOpen" class="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
              <div class="p-2 text-sm font-semibold">Notifications</div>
              <div class="max-h-96 overflow-auto">
                <div class="px-3 py-2 text-xs text-gray-400">Service: {{ notifStatus?.service || 'Notification Service' }} • Status: {{ notifStatus?.status || 'Unknown' }}</div>
                <div *ngIf="feed.length === 0" class="px-3 py-3 text-sm text-gray-300">No notifications.</div>
                <ng-container *ngFor="let g of groupedFeed()">
                  <div class="px-3 pt-2 text-xs font-semibold text-gray-400">{{ g.label }}</div>
                  <button
                    *ngFor="let n of g.items"
                    class="w-full text-left px-3 py-2 border-t border-gray-700 hover:bg-gray-700/50"
                    (click)="onNotificationClick(n)"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="text-sm font-medium" [class.text-white]="!n.read" [class.text-gray-200]="n.read">{{ n.title }}</div>
                        <div class="text-xs text-gray-300">{{ n.message }}</div>
                      </div>
                      <div class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ n.timestamp | date:'short' }}</div>
                    </div>
                  </button>
                </ng-container>
              </div>
            </div>
          </div>
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
          <p class="text-sm text-gray-400" *ngIf="!profile">Loading profile…</p>
        </div>

        <div class="p-4 border rounded md:col-span-2">
          <h3 class="font-semibold mb-2">Recent Documents</h3>
          <div *ngIf="documents.length === 0" class="text-sm text-gray-400">No documents found.</div>
          <div class="grid md:grid-cols-2 gap-3">
            <div *ngFor="let d of documents" class="border p-3 rounded">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">{{ d.originalFilename }}</p>
                  <p class="text-xs text-gray-400">{{ d.documentType }} | {{ d.contentType }}</p>
                </div>
                <a [href]="d.filePath" target="_blank" class="link">Open</a>
              </div>
              <p class="text-xs text-gray-400 mt-2">Uploaded: {{ d.uploadDate | date:'medium' }}</p>
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
        <div *ngIf="loadingAppointments" class="text-gray-400">Loading appointments…</div>
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
      <div class="mt-3">
        <button class="btn-secondary" [routerLink]="['/doctor/appointments']">See All Appointments</button>
      </div>

      <!-- Insights & Analytics -->
      <section class="p-4 border rounded">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">Insights</h3>
          <div class="text-xs text-gray-400" *ngIf="analyticsRangeText">{{ analyticsRangeText }}</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Overall (last 30d)</div>
            <div class="mt-2 text-sm">
              <div>Total Appointments: {{ overall?.totalAppointments ?? '�' }}</div>
              <div>Average Rating: {{ overall?.avgRating ?? '�' }}</div>
              <div>Total Revenue: {{ overall?.totalRevenue ?? '�' }}</div>
            </div>
          </div>
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Peak Hours</div>
            <div class="mt-2 text-sm">
              <div>Peak Hour: {{ peakHours?.peakHour ?? '�' }}</div>
              <div>Total Appointments: {{ peakHours?.totalAppointments ?? '�' }}</div>
            </div>
            <app-chart-widget
              *ngIf="peakHours?.hourlyDistribution"
              title="Hourly Distribution"
              [type]="'bar'"
              [labels]="peakHoursLabels"
              [data]="peakHoursData"
            ></app-chart-widget>
          </div>
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Patient Retention</div>
            <div class="mt-2 text-sm">
              <div>New: {{ retention?.newPatients ?? '�' }}</div>
              <div>Returning: {{ retention?.returningPatients ?? '�' }}</div>
              <div>Retention Rate: {{ retention?.retentionRate ?? '�' }}%</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Day of Week</div>
            <div class="mt-2 text-sm">
              <div>Busiest Day: {{ dayOfWeek?.busiestDay ?? '�' }}</div>
            </div>
            <app-chart-widget
              *ngIf="dayOfWeek?.dayDistribution"
              title="Day Distribution"
              [type]="'bar'"
              [labels]="dayOfWeekLabels"
              [data]="dayOfWeekData"
            ></app-chart-widget>
          </div>
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Feedback Sentiment</div>
            <div class="mt-2 text-sm">
              <div>Positive: {{ feedbackSentiment?.positivePercentage ?? '�' }}%</div>
              <div>Neutral: {{ feedbackSentiment?.neutralPercentage ?? '�' }}%</div>
              <div>Negative: {{ feedbackSentiment?.negativePercentage ?? '�' }}%</div>
            </div>
            <app-chart-widget
              *ngIf="feedbackSentiment"
              title="Sentiment"
              [type]="'pie'"
              [labels]="feedbackLabels"
              [data]="feedbackData"
            ></app-chart-widget>
          </div>
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Performance</div>
            <div class="mt-2 text-sm">
              <div>Completed: {{ performance?.completedAppointments ?? '�' }}</div>
              <div>Cancellation Rate: {{ performance?.cancellationRate ?? '�' }}%</div>
              <div>Avg Rating: {{ performance?.averageRating ?? '�' }}</div>
            </div>
          </div>
        </div>

        <!-- More Insights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Appointment Duration</div>
            <div class="mt-2 text-sm">
              <div>Average Gap: {{ appointmentDuration?.averageGapMinutes ?? '�' }}m</div>
              <div>Min Gap: {{ appointmentDuration?.minGapMinutes ?? '�' }}m</div>
              <div>Max Gap: {{ appointmentDuration?.maxGapMinutes ?? '�' }}m</div>
            </div>
          </div>
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Cancellation Patterns</div>
            <div class="mt-2 text-sm">
              <div>Total: {{ cancellationPatterns?.totalCancellations ?? '�' }}</div>
              <div>Rate: {{ cancellationPatterns?.cancellationRate ?? '�' }}%</div>
              <div>Common Timing: {{ cancellationPatterns?.commonTiming ?? '�' }}</div>
            </div>
          </div>
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Patient Demographics</div>
            <div class="mt-2 text-sm">
              <div *ngFor="let kv of (patientDemographics?.ageDistribution | keyvalue)">{{ kv.key }}: {{ kv.value }}</div>
            </div>
            <app-chart-widget
              *ngIf="patientDemographics?.ageDistribution"
              title="Age Distribution"
              [type]="'bar'"
              [labels]="demographicsLabels"
              [data]="demographicsData"
            ></app-chart-widget>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Seasonal Trends ({{ seasonalTrends?.year || currentYear }})</div>
            <div class="mt-2 text-sm">
              <div>Busiest Season: {{ seasonalTrends?.busiestSeason ?? '�' }}</div>
              <div *ngFor="let kv of (seasonalTrends?.monthlyDistribution | keyvalue)">{{ kv.key }}: {{ kv.value }}</div>
            </div>
            <app-chart-widget
              *ngIf="seasonalTrends?.monthlyDistribution"
              title="Monthly Distribution"
              [type]="'line'"
              [labels]="seasonalLabels"
              [data]="seasonalData"
            ></app-chart-widget>
          </div>
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Appointment Trends (30d)</div>
            <div class="mt-2 text-sm">
              <div *ngFor="let kv of (appointmentTrendsDaily?.daily | keyvalue)">{{ kv.key }}: {{ kv.value }}</div>
            </div>
            <app-chart-widget
              *ngIf="appointmentTrendsDaily?.daily"
              title="Daily Appointments"
              [type]="'line'"
              [labels]="dailyTrendLabels"
              [data]="dailyTrendData"
            ></app-chart-widget>
          </div>
          <div class="p-4 border rounded">
            <div class="text-sm text-gray-400">Revenue</div>
            <div class="mt-2 text-sm">
              <div>Total: {{ revenueAnalysis?.totalRevenue ?? '�' }}</div>
              <div>Average per Appointment: {{ revenueAnalysis?.averageRevenue ?? '�' }}</div>
            </div>
          </div>
        </div>
      </section>

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
        [disabled]="selectedAppointment?.status !== 'CONFIRMED'"
        [saving]="savingHistory"
        [saved]="historySaved"
        [error]="historyError"
        [infoText]="selectedAppointment?.status !== 'CONFIRMED' ? 'Form available only for confirmed appointments.' : null"
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
  username: string | null = null;
  doctorId: number | null = null;
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
      this.svc.getProfile(this.username).subscribe({ next: (p) => (this.profile = p) });
    }
    if (this.doctorId != null) {
      this.svc.getDocumentsByDoctor(this.doctorId).subscribe({
        next: (docs) => (this.documents = (docs || []).slice(0, 6)),
      });
      this.refreshToday();
      
      this.loadAnalytics();
    }
    // Notifications: fetch feed and unread count every 30s
    this.fetchNotifications();
    this.notifPollHandle = setInterval(() => this.fetchNotifications(), 300000);
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
  notifOpen = false;
  unreadCount = 0;
  private notifPollHandle: any;
  feed: NotificationItem[] = [];

  private notifApi = inject(NotificationService);
  private router = inject(Router);

  toggleNotif() {
    this.notifOpen = !this.notifOpen;
  }

  notifStatus: NotificationStatus | null = null;

  fetchNotifications() {
    // Always update service status (debug info)
    this.notifApi.getStatus().subscribe({ next: (s) => (this.notifStatus = s) });
    if (this.doctorId == null) {
      this.feed = [];
      this.unreadCount = 0;
      return;
    }
    this.notifApi.getDoctorFeed(this.doctorId).subscribe({ next: (items) => (this.feed = items || []) });
    this.notifApi.getDoctorUnreadCount(this.doctorId).subscribe({ next: (n) => (this.unreadCount = n || 0) });
  }

  groupedFeed(): { label: 'Today' | 'Yesterday' | 'Earlier'; items: NotificationItem[] }[] {
    const groups: Record<string, NotificationItem[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const n of this.feed) {
      const label = this.notifApi.getGroupLabel(n.timestamp);
      (groups[label] ||= []).push(n);
    }
    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label: label as 'Today' | 'Yesterday' | 'Earlier', items }));
  }

  onNotificationClick(n: NotificationItem) {
    if (!n.read && n.id != null) {
      this.notifApi.markRead(Number(n.id)).subscribe({
        next: () => {
          n.read = true;
          this.unreadCount = Math.max(0, (this.unreadCount || 0) - 1);
        },
      });
    }
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  ngOnDestroy(): void {
    if (this.notifPollHandle) clearInterval(this.notifPollHandle);
  }

  openPatient(a: DoctorAppointmentItem) {
    this.selectedAppointment = a;
    this.patientModalOpen = true;
    this.selectedPatient = null;
    this.mhForm = { visitDate: this.todayISO() };
    this.patientApi.getCompleteData(a.patientId).subscribe({
      next: (data) => (this.selectedPatient = data),
      error: () => (this.selectedPatient = { patient: {} as any, medicalHistory: [], documents: [] }),
    });
    this.medicalHistoryWithDoctor = [];
    this.patientApi.getMedicalHistoryWithDoctor(a.patientId).subscribe({
      next: (list) => (this.medicalHistoryWithDoctor = list || []),
    });
  }

  openHistoryForm(a: DoctorAppointmentItem) {
    this.selectedAppointment = a;
    this.mhForm = { visitDate: this.todayISO() };
    this.historyFormModalOpen = true;
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
      next: (detail) => (this.selectedHistoryDetail = detail),
      error: () => (this.selectedHistoryDetail = { id: item.id, visitDate: item.visitDate } as any),
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
  }

  saveMedicalHistory() {
    if (!this.selectedAppointment) return;
    this.savingHistory = true;
    this.historySaved = false;
    this.historyError = null;
    if (this.doctorId == null) {
      this.savingHistory = false;
      return;
    }
    this.patientApi
      .addMedicalHistoryWithDoctor(this.selectedAppointment.patientId, this.doctorId, this.mhForm)
      .subscribe({
        next: () => {
          this.savingHistory = false;
          this.historySaved = true;
          // Close form and refresh patient data to show the new history
          this.closeHistoryForm();
          this.patientApi.getCompleteData(this.selectedAppointment!.patientId).subscribe({
            next: (data) => (this.selectedPatient = data),
          });
        },
        error: (e) => {
          console.error('Failed to save medical history', e);
          this.historyError = 'Failed to save medical history';
          this.savingHistory = false;
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
