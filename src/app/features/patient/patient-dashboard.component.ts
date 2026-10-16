import { DocumentOpenerService } from '../../core/services/document-opener.service';
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
import { SharedChatModalComponent } from '../../shared/chat/shared-chat-modal.component';
import { getAppointmentEpochMs, isAppointmentToday, isAppointmentFuture } from '../../shared/appointment-utils';
import { PatientNotificationComponent } from './patient-notification.component';
import { PatientDashboardMetricsCardsComponent } from './patient-dashboard-metrics-cards.component';
import { PatientMyHealthComponent } from './patient-my-health.component';
import { PatientDashboardAppointmentListComponent } from './patient-dashboard-appointment-list.component';
import { ButtonComponent } from '../../shared/components';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { InrPipe } from '../../shared/utils/inr.pipe';
import { memoByDeps } from '../../shared/utils/memo';
import { toLocalDateKey } from '../../shared/utils/format.util';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [InrPipe, PageContainerComponent, CommonModule, RouterModule, FormsModule, RescheduleAppointmentModalComponent, PatientNotificationComponent, MedicalHistoryDetailModalComponent, PatientDashboardMetricsCardsComponent, PatientMyHealthComponent, PatientDashboardAppointmentListComponent, SharedChatModalComponent, ButtonComponent],
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

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

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
  private documentOpener = inject(DocumentOpenerService);
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
    this.doctorApi.getDirectory().subscribe({
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

  // Memoised: same array instance until appointments (or the day) change, so the OnPush list child doesn't re-render every cycle
  todayAppointments = memoByDeps<PatientAppointmentItem[]>(
    () => this.computeTodayAppointments(),
    () => [this.appointments, toLocalDateKey()],
  );

  private computeTodayAppointments(): PatientAppointmentItem[] {
    const s = (this.appointments || []).filter((a) => isAppointmentToday(a));
    return s.sort((x, y) => getAppointmentEpochMs(x) - getAppointmentEpochMs(y));
  }

  // Memoised: same array instance until appointments (or the day) change, so the OnPush list child doesn't re-render every cycle
  upcomingAppointments = memoByDeps<PatientAppointmentItem[]>(
    () => this.computeUpcomingAppointments(),
    () => [this.appointments, toLocalDateKey()],
  );

  private computeUpcomingAppointments(): PatientAppointmentItem[] {
    const list = (this.appointments || []).filter((a) => {
      const s = (a.status || '').toUpperCase();
      return s !== 'CANCELLED' && s !== 'COMPLETED' && isAppointmentFuture(a);
    });
    return list.sort((x, y) => getAppointmentEpochMs(x) - getAppointmentEpochMs(y)).slice(0, 4);
  }


  goToBookAppointment() {
    this.router.navigate(['/patient/book-appointment']);
  }

  goToMyAppointments() {
    this.router.navigate(['/patient/appointments']);
  }

  goToAppointmentDetail(appointmentId: number) {
    if (appointmentId) {
      this.router.navigate(['/patient/appointments', appointmentId]);
    } else {
      this.goToMyAppointments();
    }
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
    // Fetched fresh: private files are served through short-lived signed links
    this.documentOpener.open(d.id, d.cloudinaryUrl || d.url);
  }

  // Chat Logic
  chatOpen = false;
  chatAppointmentId: number | null = null;
  chatParticipantName: string | null = null;
  chatParticipantImage: string | null = null;

  closeChat() {
    this.chatOpen = false;
    this.chatAppointmentId = null;
    this.chatParticipantName = null;
    this.chatParticipantImage = null;
  }
}
