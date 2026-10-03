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
import { AnalyticsApiService } from '../../core/services/analytics.service';
import { RescheduleAppointmentModalComponent } from '../../shared/reschedule-appointment-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { PatientAppointmentCardComponent } from '../../shared/patient-appointment-card.component';
import { SharedChatModalComponent } from '../../shared/chat/shared-chat-modal.component';
import { getAppointmentEpochMs, isAppointmentToday } from '../../shared/appointment-utils';
// ChartWidget moved into PatientReportsComponent
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PatientNotificationComponent } from './patient-notification.component';
import { PatientDashboardMetricsCardsComponent } from './patient-dashboard-metrics-cards.component';
import { PatientMyHealthComponent } from './patient-my-health.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, PatientAppointmentCardComponent, RescheduleAppointmentModalComponent, PatientNotificationComponent, MedicalHistoryDetailModalComponent, PatientDashboardMetricsCardsComponent, PatientMyHealthComponent, SharedChatModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent {
  specializationFilter = '';
  loadingDoctors = false;
  loadingAppointments = false;
  loadingWelcome = true;
  patientName: string | null = null;
  profileImageUrl: string | null = null;
  completionPercentage: number = 0;

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
  financialStats: { totalAppointmentSpend: number, totalLabTestSpend: number, totalSpend: number } | null = null;
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
  private analyticsApi = inject(AnalyticsApiService);
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
  ) { }

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
    this.loadFinancialStats();
  }

  goToVitals() {
    this.router.navigate(['/patient/vitals']);
  }

  // ngOnDestroy not needed for notifications; no local polling

  refreshDoctors() {
    this.loadingDoctors = true;
    this.doctorApi.getAllForPatients(0, 50).subscribe({
      next: (res) => {
        const active = (res || []).filter((d) => d.isActive !== false);
        this.doctors = active;
        this.loadingDoctors = false;
        // Populate ratings from in-line data
        (res || []).forEach(d => {
          this.ratings[d.id] = { avg: d.averageRating || 0, count: d.reviewCount || 0 };
        });
        this.enrichAppointments();
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

  todayAppointments() {
    const s = (this.appointments || []).filter((a) => isAppointmentToday(a));
    return s.sort((x, y) => getAppointmentEpochMs(x) - getAppointmentEpochMs(y));
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
        this.enrichAppointments();
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
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
        this.completionPercentage = p?.completionPercentage || 0;
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
      'bg-green-100 text-green-800 dark:bg-green-700 dark:text-white': s === 'CONFIRMED' || s === 'COMPLETED',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white': s === 'BOOKED' || s === 'SCHEDULED',
      'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white': s === 'CANCELLED',
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white': !s,
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
      error: () => { },
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

  loadFinancialStats() {
    if (this.patientId == null) return;
    this.analyticsApi.getPatientFinancialStats(this.patientId).subscribe({
      next: (res) => {
        this.financialStats = res;
        this.cdr.markForCheck();
      },
      error: () => { }
    });
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
      window.open(d.cloudinaryUrl || d.url, '_blank');
    } catch { }
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
