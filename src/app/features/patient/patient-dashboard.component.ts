import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { AppointmentService, PatientAppointmentItem } from '../../core/services/appointment.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { PatientProfileService, PatientDto, MedicalHistoryItem, PatientDocumentItem } from '../../core/services/patient-profile.service';
import { AuthService } from '../../core/services/auth.service';
// Removed NotificationService imports; logic moved to dedicated component

import { ReportsApiService } from '../../core/services/reports.service';
import { RescheduleAppointmentModalComponent } from '../../shared/reschedule-appointment-modal.component';
import { PatientAppointmentCardComponent } from '../../shared/patient-appointment-card.component';
import { getAppointmentEpochMs } from '../../shared/appointment-utils';
// ChartWidget moved into PatientReportsComponent
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PatientNotificationComponent } from './patient-notification.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, PatientAppointmentCardComponent, RescheduleAppointmentModalComponent, PatientNotificationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-patient-layout>
    <div class="p-6 space-y-8">
      <!-- Welcome Banner -->
      <section class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 shadow">
        <div class="flex flex-wrap items-center gap-4">
          <img
            *ngIf="profileImageUrl; else avatar"
            [src]="profileImageUrl"
            alt="Profile"
            class="w-16 h-16 rounded-full ring-2 ring-white/60 object-cover"
          />
          <ng-template #avatar>
            <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-semibold">
              {{ (patientName || 'P')?.charAt(0) }}
            </div>
          </ng-template>
          <div class="flex-1">
            <div class="text-lg">Welcome back,</div>
            <div class="text-2xl font-semibold">{{ patientName || 'Patient' }}!</div>
          </div>
          <div class="flex items-center gap-2">
            <app-patient-notification></app-patient-notification>
            <button class="btn-primary bg-white text-blue-700 hover:bg-white/90" (click)="goToBookAppointment()">Book Appointment</button>
            <button class="btn-primary bg-white text-blue-700 hover:bg-white/90" (click)="goToMyAppointments()">My Appointments</button>
          </div>
          </div>
        </section>

      <!-- Cards Row moved below Upcoming Appointments -->

      <!-- Upcoming Appointments (cards) -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">Upcoming Appointments</h3>
          <button class="btn-secondary" (click)="refreshAppointments()">Refresh</button>
        </div>
        <div *ngIf="loadingAppointments" class="text-gray-400">Loading upcoming appointments...</div>
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

      <!-- Cards Row: Pending Feedback & My Appointments (below Upcoming) -->
      <section class="mt-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Pending Feedback Card -->
          <div class="panel rounded-none p-6 w-full min-h-[280px] flex flex-col items-center justify-start">
            <div class="w-full flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-base">Pending Feedback</span>
                <span *ngIf="loadingPending" class="text-gray-400 text-sm">Loading…</span>
                <span *ngIf="!loadingPending" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ pendingFeedbackCount }}</span>
              </div>
              <button class="btn-primary" (click)="goToFeedbackPage()">View All</button>
            </div>
            <div class="text-5xl mt-6">📝</div>
          </div>

          <!-- My Appointments Card -->
          <div class="panel rounded-none p-6 w-full min-h-[280px] flex flex-col items-center justify-start">
            <div class="w-full flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-base">My Appointments</span>
                <span *ngIf="loadingAppointments" class="text-gray-400 text-sm">Loading…</span>
                <span *ngIf="!loadingAppointments" class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-blue-700 text-white">{{ (appointments?.length || 0) }}</span>
              </div>
              <button class="btn-primary" (click)="goToMyAppointments()">View All</button>
            </div>
            <div class="text-5xl mt-6">📅</div>
          </div>

          <!-- Future Card Placeholder (keeps 3-column row layout) -->
          <div class="panel rounded-none p-6 w-full min-h-[280px] flex flex-col items-center justify-start">
            <div class="w-full flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-base">Coming Soon</span>
                <span class="px-2.5 py-1.5 text-sm font-semibold rounded-full bg-gray-700 text-white">0</span>
              </div>
              <button class="btn-secondary" disabled>View All</button>
            </div>
            <div class="text-5xl mt-6 text-gray-400">⭐</div>
          </div>
        </div>
      </section>

      <!-- Removed: separate My Appointments section; merged into cards row above -->

      

      <!-- My Health -->
      <section class="mt-6">
        <h3 class="text-lg font-semibold mb-3">My Health</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="panel p-4">
            <div class="text-sm text-gray-400 mb-2">Recent Medical History</div>
            <ul class="text-sm space-y-2">
              <li *ngFor="let item of medicalHistoryRecent">
                <div class="font-medium">{{ item.diagnosis || item.symptoms || item.treatment }}</div>
                <div class="text-gray-500">{{ item.visitDate }}</div>
              </li>
              <li *ngIf="medicalHistoryRecent.length === 0" class="text-gray-500">No recent history.</li>
            </ul>
          </div>
          <div class="panel p-4">
            <div class="text-sm text-gray-400 mb-2">Test Results</div>
            <div class="grid grid-cols-2 gap-2">
              <div *ngFor="let d of patientDocumentsRecent" class="border rounded p-2 text-sm">
                <div class="font-medium truncate">{{ d.originalFilename }}</div>
                <div class="text-gray-500">{{ d.uploadDate | date:'mediumDate' }}</div>
              </div>
              <div *ngIf="patientDocumentsRecent.length === 0" class="text-gray-500">No documents uploaded.</div>
            </div>
          </div>
        </div>
      </section>

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
export class PatientDashboardComponent {
  specializationFilter = '';
  loadingDoctors = false;
  loadingAppointments = false;
  patientName: string | null = null;
  profileImageUrl: string | null = null;

  doctors: Doctor[] = [];
  ratings: Record<number, { avg: number; count: number }> = {};
  appointments: PatientAppointmentItem[] = [];
  detailsOpen: Record<number, boolean> = {};

  // Pending feedback state
  loadingPending = false;
  pendingFeedbackCount = 0;
  

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
    private patientApi: PatientProfileService
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

  refreshAppointments() {
    this.loadingAppointments = true;
    this.apptApi.getMyAppointments().subscribe({
      next: (res) => {
        this.appointments = res || [];
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
    this.patientApi.getDocumentsByPatient(this.patientId).subscribe({
      next: (docs) => {
        this.patientDocumentsRecent = (docs || []).slice(0, 6);
        this.cdr.markForCheck();
      },
    });
  }
}