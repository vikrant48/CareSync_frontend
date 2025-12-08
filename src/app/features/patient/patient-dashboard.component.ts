import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { LabTestService } from '../../core/services/lab-test.service';
import { AppointmentService, PatientAppointmentItem } from '../../core/services/appointment.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { PatientProfileService, PatientDto, MedicalHistoryItem, PatientDocumentItem, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { AuthService } from '../../core/services/auth.service';
// Removed NotificationService imports; logic moved to dedicated component

import { ReportsApiService } from '../../core/services/reports.service';
import { RescheduleAppointmentModalComponent } from '../../shared/reschedule-appointment-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { PatientAppointmentCardComponent } from '../../shared/patient-appointment-card.component';
import { getAppointmentEpochMs, isAppointmentToday } from '../../shared/appointment-utils';
// ChartWidget moved into PatientReportsComponent
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PatientNotificationComponent } from './patient-notification.component';
import { PatientDashboardMetricsCardsComponent } from './patient-dashboard-metrics-cards.component';
import { PatientMyHealthComponent } from './patient-my-health.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, PatientAppointmentCardComponent, RescheduleAppointmentModalComponent, PatientNotificationComponent, MedicalHistoryDetailModalComponent, PatientDashboardMetricsCardsComponent, PatientMyHealthComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-patient-layout>
    <div class="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <!-- Welcome Banner -->
      <section class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 sm:p-6 shadow">
        <!-- Small screen top bar: avatar left, notification right -->
        <div class="sm:hidden flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <img *ngIf="profileImageUrl; else avatarSm" [src]="profileImageUrl" alt="Profile" class="w-10 h-10 rounded-full ring-2 ring-white/60 object-cover" />
            <ng-template #avatarSm>
              <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-base font-semibold">
                {{ (patientName || 'P').charAt(0) }}
              </div>
            </ng-template>
            <div class="text-sm">
              <div>Welcome back,</div>
              <div class="text-lg font-semibold">{{ patientName || 'Patient' }}!</div>
            </div>
          </div>
          <app-patient-notification></app-patient-notification>
        </div>

        <div class="flex flex-col sm:flex-row sm:flex-wrap items-center gap-4 sm:gap-6">
          <img
            *ngIf="profileImageUrl; else avatar"
            [src]="profileImageUrl"
            alt="Profile"
            class="hidden sm:block w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-2 ring-white/60 object-cover"
          />
          <ng-template #avatar>
            <div class="hidden sm:flex w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 items-center justify-center text-lg sm:text-xl font-semibold">
              {{ (patientName || 'P').charAt(0) }}
            </div>
          </ng-template>
          <div class="flex-1 w-full sm:w-auto">
            <div class="text-base sm:text-lg">Welcome back,</div>
            <ng-container *ngIf="loadingWelcome; else nameReady">
              <div class="flex items-center gap-2 text-white/80">
                <span class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Loading…
              </div>
            </ng-container>
            <ng-template #nameReady>
              <div class="text-xl sm:text-2xl font-semibold">{{ patientName || 'Patient' }}!</div>
            </ng-template>
          </div>
          <div class="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0">
            <app-patient-notification class="hidden sm:block"></app-patient-notification>
            <button class="btn-primary bg-white text-blue-700 hover:bg-white/90 w-full sm:w-auto" (click)="goToBookAppointment()">Book Appointment</button>
            <button class="btn-primary bg-white text-blue-700 hover:bg-white/90 w-full sm:w-auto" (click)="goToMyAppointments()">My Appointments</button>
          </div>
          </div>
        </section>

      <!-- Cards Row moved below Upcoming Appointments -->
       <section>
         <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
           <h3 class="text-lg font-semibold">Upcoming Appointments</h3>
           <button class="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 text-sm font-medium px-0 py-0" (click)="refreshAppointments()">Refresh</button>
         </div>
         <div *ngIf="loadingAppointments" class="flex items-center gap-2 text-gray-400">
           <span class="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span>
           Loading upcoming appointments...
         </div>
         <div *ngIf="!loadingAppointments && upcomingAppointments().length === 0" class="text-gray-400">No upcoming appointments.</div>
         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <patient-appointment-card
             *ngFor="let a of upcomingAppointments()"
             [appointment]="a"
             (reschedule)="startReschedule($event)"
             (cancel)="cancelAppointment($event)"
             (viewDoctor)="viewDoctorFromAppointment($event)"
           ></patient-appointment-card>
         </div>
       </section>

      <!-- Cards Row: extracted into presentational component -->
      <app-patient-dashboard-metrics-cards
        [loadingPending]="loadingPending"
        [pendingFeedbackCount]="pendingFeedbackCount"
        [loadingAppointments]="loadingAppointments"
        [appointments]="appointments"
        [todayAppointmentsCount]="todayAppointmentsCount"
        [loadingLabTests]="loadingLabTests"
        [labTestCount]="labTestCount"
        (openFeedback)="goToFeedbackPage()"
        (openMyAppointments)="goToMyAppointments()"
        (openTodayAppointments)="goToTodayAppointments()"
        (openLabTests)="goToLabTests()"
      ></app-patient-dashboard-metrics-cards>

      <!-- My Health extracted into reusable component -->
      <app-patient-my-health
        [medicalHistoryRecent]="medicalHistoryRecent"
        [patientLabReports]="patientLabReports"
        (openHistoryDetail)="openHistoryDetail($event)"
        (openDocument)="openDocument($event)"
      ></app-patient-my-health>

      <reschedule-appointment-modal
        [appointment]="rescheduleTarget"
        [doctors]="doctors"
        (close)="closeReschedule()"
      (confirmed)="onRescheduleConfirmed($event)"
      ></reschedule-appointment-modal>

      <!-- History Detail Modal (Shared) -->
      <app-medical-history-detail-modal
        [open]="historyDetailModalOpen"
        [detail]="selectedHistoryDetail"
        [doctorInfo]="selectedHistoryDoctorInfo"
        (close)="closeHistoryDetail()"
      ></app-medical-history-detail-modal>
    </div>
    </app-patient-layout>
  `,
})
export class PatientDashboardComponent {
  specializationFilter = '';
  loadingDoctors = false;
  loadingAppointments = false;
  loadingWelcome = true;
  patientName: string | null = null;
  profileImageUrl: string | null = null;

  doctors: Doctor[] = [];
  ratings: Record<number, { avg: number; count: number }> = {};
  appointments: PatientAppointmentItem[] = [];
  detailsOpen: Record<number, boolean> = {};

  // Pending feedback state
  loadingPending = false;
  pendingFeedbackCount = 0;
  
  // Lab tests state
  loadingLabTests = false;
  labTestCount = 0;
  
  // Today appointments count
  todayAppointmentsCount = 0;
  

  patientAnalytics: any = null;
  medicalHistoryRecent: MedicalHistoryItem[] = [];
  patientDocumentsRecent: PatientDocumentItem[] = [];

  // Chart data holders
  doctorVisitLabels: string[] = [];
  doctorVisitData: number[] = [];
  appointmentStatusLabels: string[] = ['Completed', 'Cancelled'];
  appointmentStatusData: number[] = [];

  // Patient id used across analytics/health and notification component wiring
  patientId: number | null = null;

  // Services via inject to avoid undefined DI
  private auth = inject(AuthService);
  private reportsApi = inject(ReportsApiService);
  private feedbackApi = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  // Reschedule state
  rescheduleTarget: PatientAppointmentItem | null = null;
  rescheduleDateISO: string | null = null;
  rescheduleTimeSlot: string | null = null;
  availableSlots: string[] = [];
  rescheduleError: string | null = null;

  constructor(
    private doctorApi: DoctorService,
    private apptApi: AppointmentService,
    private router: Router,
    private patientApi: PatientProfileService,
    private labTestApi: LabTestService
  ) {}

  // Notification logic removed; handled by PatientNotificationComponent

  ngOnInit(): void {
    const idStr = this.auth.userId();
    this.patientId = idStr ? Number(idStr) : null;
    // Initial data loads
    this.refreshDoctors();
    this.refreshAppointments();
    this.loadPatientWelcome();
    this.refreshPendingFeedback();
    this.refreshLabTestsCount();

    // Analytics handled by PatientReportsComponent
    this.loadPatientHealthData();
  }

  // ngOnDestroy not needed for notifications; no local polling

  refreshDoctors() {
    this.loadingDoctors = true;
    this.doctorApi.getAllForPatients().subscribe({
      next: (res) => {
        const active = (res || []).filter((d) => d.isActive !== false);
        this.doctors = active;
        this.loadingDoctors = false;
        // Load ratings for each doctor
        this.doctors.forEach((d) => this.loadRating(d));
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingDoctors = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Lab tests
  refreshLabTestsCount() {
    this.loadingLabTests = true;
    this.labTestApi.getAllLabTests().subscribe({
      next: (tests) => {
        // API returns only active lab tests; count directly
        this.labTestCount = (tests || []).length;
        this.loadingLabTests = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingLabTests = false;
        this.cdr.markForCheck();
      },
    });
  }

  goToLabTests() {
    this.router.navigate(['/lab-tests']);
  }

  filteredDoctors() {
    const q = (this.specializationFilter || '').toLowerCase().trim();
    return this.doctors.filter((d) => (d.specialization || '').toLowerCase().includes(q));
  }

  // Date helper moved to shared utils

  upcomingAppointments() {
    const now = Date.now();
    const allowed = new Set(['BOOKED', 'SCHEDULED', 'CONFIRMED']);
    return (this.appointments || [])
      .filter((a) => allowed.has((a.status || '').trim().toUpperCase()) && getAppointmentEpochMs(a) >= now)
      .sort((x, y) => getAppointmentEpochMs(x) - getAppointmentEpochMs(y))
      .slice(0, 6);
  }

  loadRating(d: Doctor) {
    this.doctorApi.getAverageRating(d.id).subscribe({
      next: (avgResp) => {
        this.doctorApi.getRatingDistribution(d.id).subscribe({
          next: (dist) => {
            const count = Object.values(dist || {}).reduce((acc, n) => acc + (n || 0), 0);
            this.ratings[d.id] = { avg: avgResp?.averageRating ?? 0, count };
            this.cdr.markForCheck();
          },
        });
      },
    });
  }

  openDoctor(d: Doctor) {
    this.router.navigate(['/patient/doctor', d.username]);
  }

  goToBookAppointment() {
    this.router.navigate(['/patient/book-appointment']);
  }

  goToMyAppointments() {
    this.router.navigate(['/patient/appointments']);
  }

  goToFeedbackPage() {
    this.router.navigate(['/patient/feedback']);
  }

  goToTodayAppointments() {
    this.router.navigate(['/patient/appointments'], { queryParams: { status: 'ALL', range: 'TODAY' } });
  }

  refreshAppointments() {
    this.loadingAppointments = true;
    this.apptApi.getMyAppointments().subscribe({
      next: (res) => {
        this.appointments = res || [];
        this.todayAppointmentsCount = (this.appointments || []).filter((a) => isAppointmentToday(a)).length;
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
    });
  }

  refreshPendingFeedback() {
    this.loadingPending = true;
    this.feedbackApi.getPendingForPatient().subscribe({
      next: (res) => {
        const list = res || [];
        this.pendingFeedbackCount = list.length;
        this.loadingPending = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingPending = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadPatientWelcome() {
    const uname = this.auth.username();
    if (!uname) return;
    this.patientApi.getProfile(uname).subscribe({
      next: (p: PatientDto) => {
        const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
        this.patientName = name || p?.username || 'Patient';
        this.profileImageUrl = p?.profileImageUrl || null;
        this.loadingWelcome = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingWelcome = false;
        this.cdr.markForCheck();
      },
    });
  }

  statusClass(status: string) {
    const s = (status || '').toUpperCase();
    return {
      'bg-green-700 text-white': s === 'CONFIRMED' || s === 'COMPLETED',
      'bg-yellow-700 text-white': s === 'BOOKED' || s === 'SCHEDULED',
      'bg-red-700 text-white': s === 'CANCELLED',
      'bg-gray-700 text-white': !s,
    } as any;
  }

  toggleDetails(a: PatientAppointmentItem) {
    this.detailsOpen[a.appointmentId] = !this.detailsOpen[a.appointmentId];
  }

  startReschedule(a: PatientAppointmentItem) {
    this.rescheduleTarget = a;
    this.rescheduleDateISO = a.appointmentDate || null;
    this.rescheduleTimeSlot = null;
    this.availableSlots = [];
    this.rescheduleError = null;
    // Slot loading handled inside shared RescheduleAppointmentModalComponent
  }

  closeReschedule() {
    this.rescheduleTarget = null;
    this.rescheduleDateISO = null;
    this.rescheduleTimeSlot = null;
    this.availableSlots = [];
    this.rescheduleError = null;
  }

  private findDoctorIdByName(name: string | undefined) {
    const d = this.doctors.find((x) => (x.name || `${x.firstName} ${x.lastName}`) === name);
    return d?.id ?? null;
  }

  onRescheduleConfirmed(iso: string) {
    if (!this.rescheduleTarget) return;
    this.apptApi.rescheduleMyAppointment(this.rescheduleTarget.appointmentId, iso).subscribe({
      next: () => {
        this.closeReschedule();
        this.refreshAppointments();
      },
      error: (err) => {
        this.rescheduleError = (err?.error?.error as string) || 'Failed to reschedule. Please try a different slot.';
      },
    });
  }

  cancelAppointment(a: PatientAppointmentItem) {
    this.apptApi.cancelMyAppointment(a.appointmentId).subscribe({
      next: () => this.refreshAppointments(),
      error: () => {},
    });
  }

  viewDoctorFromAppointment(a: PatientAppointmentItem) {
    // Attempt to find the doctor by display name to get username
    const target = this.doctors?.find((d) => {
      const display = d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim();
      return display === a.doctorName;
    });
    if (target?.username) {
      this.router.navigate(['/patient/doctor', target.username]);
    } else {
      // Fallback: go to doctor search/book page
      this.goToBookAppointment();
    }
  }

  onStatusChange(a: PatientAppointmentItem, status: string) {
    const s = (status || '').toUpperCase();
    if (s === 'CANCELLED') {
      this.cancelAppointment(a);
      return;
    }
    // Patients cannot directly set CONFIRMED/RESCHEDULED; BOOKED is default.
    // If user selects RESCHEDULED, prompt to use reschedule.
    if (s === 'RESCHEDULED') {
      this.startReschedule(a);
      return;
    }
  }

  // Label mapping to reflect who cancelled
  statusLabel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    if (s === 'CANCELLED') {
      const me = (this.auth.username() || '').toLowerCase();
      const by = (a.statusChangedBy || '').toLowerCase();
      return me && by && me === by ? 'CANCELLED_BY_PATIENT' : 'CANCELLED_BY_DOCTOR';
    }
    return s;
  }

  // Backend allows reschedule only when status is BOOKED
  canPatientReschedule(a: PatientAppointmentItem) {
    return (a.status || '').toUpperCase() === 'BOOKED';
  }

  // Backend allows cancel when status is BOOKED or CONFIRMED
  canPatientCancel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'CONFIRMED';
  }

  loadPatientAnalytics() {
    if (this.patientId == null) return;
    this.reportsApi.getPatientAnalytics(this.patientId).subscribe({
      next: (res) => {
        this.patientAnalytics = res || null;
        const visits = (this.patientAnalytics?.doctorVisitCount) || {};
        const labels = Object.keys(visits);
        this.doctorVisitLabels = labels;
        this.doctorVisitData = labels.map((k) => Number(visits[k] || 0));

        const total = Number(this.patientAnalytics?.totalAppointments || 0);
        const cancelled = Number(this.patientAnalytics?.cancelledAppointments || 0);
        const completed = Math.max(total - cancelled, 0);
        this.appointmentStatusData = [completed, cancelled];
        this.cdr.markForCheck();
      },
      error: () => {
        this.patientAnalytics = null;
        this.cdr.markForCheck();
      },
    });
  }

  loadPatientHealthData() {
    if (this.patientId == null) return;
    this.patientApi.getMedicalHistory(this.patientId).subscribe({
      next: (list) => {
        this.medicalHistoryRecent = (list || []).slice(0, 5);
        this.cdr.markForCheck();
      },
    });
    // Preload medical history with doctor info for detail modal
    this.patientApi.getMedicalHistoryWithDoctor(this.patientId).subscribe({
      next: (list) => {
        this.medicalHistoryWithDoctor = list || [];
        this.cdr.markForCheck();
      },
    });
    this.patientApi.getDocumentsByPatient(this.patientId).subscribe({
      next: (docs) => {
        const allDocs = docs || [];
        this.patientLabReports = allDocs
          .filter((d) => (d.documentType || '').toUpperCase() === 'LAB_REPORT')
          .slice(0, 6);
        this.cdr.markForCheck();
      },
    });
  }

  // History modal state and actions
  historyDetailModalOpen = false;
  selectedHistoryDetail: Partial<MedicalHistoryItem> | null = null;
  selectedHistoryDoctorInfo: { doctorName: string; doctorSpecialization?: string; doctorContactInfo?: string } | null = null;
  medicalHistoryWithDoctor: MedicalHistoryWithDoctorItem[] = [];

  openHistoryDetail(historyId: number) {
    const info = this.medicalHistoryWithDoctor.find((h) => h.id === historyId);
    this.selectedHistoryDoctorInfo = info
      ? {
          doctorName: info.doctorName,
          doctorSpecialization: info.doctorSpecialization,
          doctorContactInfo: info.doctorContactInfo,
        }
      : { doctorName: 'Unknown', doctorSpecialization: '', doctorContactInfo: '' };
    this.selectedHistoryDetail = null;
    this.historyDetailModalOpen = true;
    this.patientApi.getMedicalHistoryDetail(historyId).subscribe({
      next: (detail) => {
        this.selectedHistoryDetail = detail;
        this.cdr.markForCheck();
      },
      error: () => {
        this.selectedHistoryDetail = { id: historyId } as any;
        this.cdr.markForCheck();
      },
    });
  }

  closeHistoryDetail() {
    this.historyDetailModalOpen = false;
    this.selectedHistoryDetail = null;
    this.selectedHistoryDoctorInfo = null;
  }

  // Lab reports handling
  patientLabReports: PatientDocumentItem[] = [];
  openDocument(d: PatientDocumentItem) {
    try {
      window.open(d.filePath, '_blank');
    } catch {}
  }
}
