import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { MedicalHistoryFormModalComponent } from '../../shared/medical-history-form-modal.component';
import { DoctorNotificationComponent } from './doctor-notification.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { AppointmentService, DoctorAppointmentItem, DoctorDashboardMetrics } from '../../core/services/appointment.service';
import { PatientProfileService, PatientDto, MedicalHistoryItem, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { DoctorDashboardScheduleComponent } from './doctor-dashboard-schedule.component';
import { DoctorDashboardPatientsComponent } from './doctor-dashboard-patients.component';

import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { toLocalDateKey } from '../../shared/utils/format.util';
import { appointmentDayKey, consultationKind, firstVisitByPatient, isCancelledStatus } from '../../shared/utils/appointment-analytics';
import { memoByDeps } from '../../shared/utils/memo';

type DashboardTrend = { text: string; direction: 'up' | 'down' | 'flat' };

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [PageContainerComponent, 
    CommonModule, RouterModule, FormsModule, PatientDetailsModalComponent,
    MedicalHistoryDetailModalComponent, MedicalHistoryFormModalComponent,
    DoctorNotificationComponent,
    DoctorDashboardScheduleComponent, DoctorDashboardPatientsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-dashboard.component.html',

  styles: [`
    :host { display: block; }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private svc = inject(DoctorProfileService);
  private apptApi = inject(AppointmentService);
  private patientApi = inject(PatientProfileService);

  private leaveApi = inject(LeaveService);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  username: string | null = null;
  doctorId: number | null = null;
  doctorName: string | null = null;
  profile: any = null;
  documents: any[] = [];

  todayDateFormatted: string = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  insightRange: 'week' | 'month' = 'week';
  loadingCalendar = true;

  // Appointments
  todayAppointments: DoctorAppointmentItem[] = [];
  loadingAppointments = false;

  // Patient modal
  showPatientModal = false;
  selectedAppointment: DoctorAppointmentItem | null = null;
  selectedPatient: PatientDto | null = null;
  selectedPatientHistory: MedicalHistoryWithDoctorItem[] = [];
  selectedPatientDocuments: any[] = [];
  editingHistoryId: number | null = null;
  mhForm: Partial<MedicalHistoryItem> = { visitDate: this.todayISO() };
  savingHistory = false;
  historySaved = false;
  historyError: string | null = null;
  historyDetailModalOpen = false;
  selectedHistoryDetail: MedicalHistoryItem | null = null;
  selectedHistoryDoctorInfo: MedicalHistoryWithDoctorItem | null = null;
  historyFormModalOpen = false;

  // Leave Management
  upcomingLeaves: any[] = [];

  metrics: DoctorDashboardMetrics | null = null;
  loadingMetrics = false;
  metricsUnavailable = false;

  private readonly _isOnLeaveToday = memoByDeps<boolean>(
    () => this.computeIsOnLeaveToday(),
    () => [this.upcomingLeaves, toLocalDateKey()],
  );

  get isOnLeaveToday(): boolean {
    return this._isOnLeaveToday();
  }

  private computeIsOnLeaveToday(): boolean {
    const today = this.todayISO();
    return this.upcomingLeaves.some(l => l.startDate <= today && l.endDate >= today);
  }

  calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  selectedCalendarDay: string | null = null;
  calendarAppointments: DoctorAppointmentItem[] = [];

  private readonly _mockOrRealAppointments = memoByDeps<any[]>(
    () => this.computeMockOrRealAppointments(),
    () => [this.todayAppointments],
  );

  get mockOrRealAppointments(): any[] {
    return this._mockOrRealAppointments();
  }

  private computeMockOrRealAppointments(): any[] {
    return (this.todayAppointments || []).map(a => ({ ...a, isReal: true }));
  }

  private readonly _recentPatientsList = memoByDeps<any[]>(
    () => this.computeRecentPatientsList(),
    () => [this.todayAppointments],
  );

  get recentPatientsList(): any[] {
    return this._recentPatientsList();
  }

  private computeRecentPatientsList(): any[] {
    return (this.todayAppointments || []).slice(0, 4).map(a => ({
      name: a.patientName,
      age: this.patientAge(a),
      condition: a.reason || '',
      lastVisit: a.appointmentDate || '',
      status: a.status || '',
      isActive: a.patientActive !== false,
      avatar: a.patientProfileImageUrl || 'assets/default-profile.png',
      appointment: a
    }));
  }

  private patientAge(appointment: DoctorAppointmentItem): number | string | null {
    const raw = (appointment as DoctorAppointmentItem & { age?: number | string; patientAge?: number | string }).age
      ?? (appointment as DoctorAppointmentItem & { patientAge?: number | string }).patientAge;
    if (raw == null || raw === '' || raw === '—') return null;
    return raw;
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  setInsightRange(value: string): void {
    this.insightRange = value === 'month' ? 'month' : 'week';
    this.cdr.markForCheck();
  }

  get consultationTotal(): number {
    return this.consultationInsights.reduce((sum, item) => sum + item.count, 0);
  }

  private readonly _consultationInsights = memoByDeps<{ label: string; count: number; percent: number; colorClass: string; dotClass: string; offset: number }[]>(
    () => this.computeConsultationInsights(),
    () => [this.calendarAppointments, this.insightRange, toLocalDateKey()],
  );

  get consultationInsights(): { label: string; count: number; percent: number; colorClass: string; dotClass: string; offset: number }[] {
    return this._consultationInsights();
  }

  private computeConsultationInsights(): { label: string; count: number; percent: number; colorClass: string; dotClass: string; offset: number }[] {
    const palette = [
      { label: 'Follow-up', colorClass: 'text-[var(--accent)]', dotClass: 'bg-[var(--accent)]' },
      { label: 'New Patient', colorClass: 'text-[var(--primary)]', dotClass: 'bg-[var(--primary)]' },
      { label: 'Lab Review', colorClass: 'text-purple-500', dotClass: 'bg-purple-500' },
      { label: 'Others', colorClass: 'text-[var(--muted)]', dotClass: 'bg-[var(--muted)]' },
    ];
    const counts = new Map(palette.map(item => [item.label, 0]));
    const firstVisits = this.firstVisitByPatient();
    for (const appointment of this.appointmentsInInsightRange()) {
      const label = this.consultationKind(appointment, firstVisits);
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
    let offset = 0;
    return palette.map(item => {
      const count = counts.get(item.label) || 0;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const segment = { ...item, count, percent, offset };
      offset += percent;
      return segment;
    });
  }

  private appointmentsInInsightRange(): DoctorAppointmentItem[] {
    const now = new Date();
    const start = new Date(now);
    if (this.insightRange === 'week') {
      start.setDate(start.getDate() - start.getDay());
    } else {
      start.setDate(1);
    }
    start.setHours(0, 0, 0, 0);
    const startKey = this.dateKey(start);
    const endKey = this.dateKey(now);
    return (this.calendarAppointments || []).filter(appointment => {
      if (this.isCancelledStatus(appointment.status)) return false;
      const day = this.appointmentDayKey(appointment.appointmentDate);
      return !!day && day >= startKey && day <= endKey;
    });
  }

  private firstVisitByPatient(): Map<number, string> {
    return firstVisitByPatient(this.calendarAppointments || []);
  }

  private consultationKind(appointment: DoctorAppointmentItem, firstVisits: Map<number, string>): string {
    return consultationKind(appointment, firstVisits);
  }

  private isCancelledStatus(status?: string): boolean {
    return isCancelledStatus(status);
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  get calendarTitle(): string {
    return this.calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  private readonly _calendarCells = memoByDeps<{ label: string; key: string; today: boolean; hasAppointment: boolean }[]>(
    () => this.computeCalendarCells(),
    () => [this.calendarMonth, this.calendarAppointments, toLocalDateKey()],
  );

  get calendarCells(): { label: string; key: string; today: boolean; hasAppointment: boolean }[] {
    return this._calendarCells();
  }

  private computeCalendarCells(): { label: string; key: string; today: boolean; hasAppointment: boolean }[] {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const dayCount = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const booked = new Set(
      (this.calendarAppointments || [])
        .filter(a => !String(a.status || '').includes('CANCELLED'))
        .map(a => this.appointmentDayKey(a.appointmentDate))
        .filter((key): key is string => !!key)
    );
    const cells: { label: string; key: string; today: boolean; hasAppointment: boolean }[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ label: '', key: '', today: false, hasAppointment: false });
    for (let day = 1; day <= dayCount; day++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        label: String(day),
        key,
        today: today.getFullYear() === year && today.getMonth() === month && today.getDate() === day,
        hasAppointment: booked.has(key),
      });
    }
    return cells;
  }

  private appointmentDayKey(value: string | undefined): string | null {
    return appointmentDayKey(value);
  }

  shiftCalendar(delta: number): void {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + delta, 1);
    this.selectedCalendarDay = null;
    this.cdr.markForCheck();
  }

  selectCalendarDay(key: string): void {
    if (!key) return;
    this.selectedCalendarDay = this.selectedCalendarDay === key ? null : key;
    this.cdr.markForCheck();
  }

  calendarDayLabel(cell: { label: string; hasAppointment: boolean }): string {
    const booked = cell.hasAppointment ? ', has appointments' : '';
    return `${this.calendarTitle} ${cell.label}${booked}`;
  }

  get selectedDayTitle(): string {
    if (!this.selectedCalendarDay) return '';
    const [year, month, day] = this.selectedCalendarDay.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private readonly _selectedDayAppointments = memoByDeps<DoctorAppointmentItem[]>(
    () => this.computeSelectedDayAppointments(),
    () => [this.selectedCalendarDay, this.calendarAppointments],
  );

  get selectedDayAppointments(): DoctorAppointmentItem[] {
    return this._selectedDayAppointments();
  }

  private computeSelectedDayAppointments(): DoctorAppointmentItem[] {
    if (!this.selectedCalendarDay) return [];
    return (this.calendarAppointments || []).filter(a =>
      this.appointmentDayKey(a.appointmentDate) === this.selectedCalendarDay
      && !String(a.status || '').includes('CANCELLED')
    );
  }

  trackCalendarCell(index: number, cell: { label: string }): string {
    return `${index}-${cell.label}`;
  }

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
      this.refreshToday();
      this.loadCalendarAppointments();
      this.refreshLeaves();
      this.loadDashboardMetrics();
    }
  }

  refreshLeaves() {
    this.leaveApi.getUpcomingLeaves().subscribe({
      next: (res: DoctorLeave[]) => {
        this.upcomingLeaves = res || [];
        this.cdr.detectChanges();
      }
    });
  }

  loadCalendarAppointments() {
    this.loadingCalendar = true;
    this.apptApi.getDoctorAllAppointments().subscribe({
      next: (res) => {
        this.calendarAppointments = res || [];
        this.loadingCalendar = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.calendarAppointments = [];
        this.loadingCalendar = false;
        this.cdr.markForCheck();
      },
    });
  }

  refreshToday() {
    this.loadingAppointments = true;
    this.cdr.markForCheck();
    this.apptApi.getDoctorTodayAppointments().subscribe({
      next: (res) => {
        this.todayAppointments = res || [];
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingAppointments = false;
        this.cdr.markForCheck();
      },
    });
  }

  private readonly _nextAppointment = memoByDeps<DoctorAppointmentItem | null>(
    () => this.computeNextAppointment(),
    () => [this.todayAppointments],
  );

  get nextAppointment(): DoctorAppointmentItem | null {
    return this._nextAppointment();
  }

  private computeNextAppointment(): DoctorAppointmentItem | null {
    if (!this.todayAppointments) return null;
    const inProgress = this.todayAppointments.find(a => a.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;

    const candidates = this.todayAppointments.filter(a =>
      ['CONFIRMED', 'SCHEDULED', 'BOOKED'].includes(a.status)
    );
    candidates.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    return candidates.length > 0 ? candidates[0] : null;
  }

  start(a: DoctorAppointmentItem) {
    if (!a) return;
    this.apptApi.updateAppointmentStatus(a.appointmentId, 'IN_PROGRESS').subscribe({
      next: () => {
        this.refreshToday();
        this.router.navigate(['/doctor/consultation', a.appointmentId]);
      },
      error: (err: any) => console.error('Error starting consultation:', err)
    });
  }

  public todayISO() {
    return toLocalDateKey();
  }

  openPatient(a: DoctorAppointmentItem | null) {
    const appointmentId = a?.appointmentId;
    if (!appointmentId) return;
    this.router.navigate(['/doctor/appointments', appointmentId]);
  }

  openHistoryForm(a: DoctorAppointmentItem) {
    if (!a) return;
    this.showPatientModal = false;
    this.historyDetailModalOpen = false;

    this.selectedAppointment = a;
    this.editingHistoryId = null;

    let record: any = a.appointmentMedicalHistory || null;
    if (!record && a.medicalHistory) {
      record = a.medicalHistory.find(m => m.appointmentId && Number(m.appointmentId) === Number(a.appointmentId));
    }

    if (record) {
      this.editingHistoryId = record.id;
      this.mhForm = {
        visitDate: record.visitDate || this.todayISO(),
        symptoms: record.symptoms || '',
        diagnosis: record.diagnosis || '',
        treatment: record.treatment || '',
        medicine: record.medicine || '',
        doses: record.doses || '',
        notes: record.notes || ''
      };
    } else {
      this.mhForm = {
        visitDate: a.appointmentDate || this.todayISO(),
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medicine: '',
        doses: '',
        notes: ''
      };
    }

    this.historyFormModalOpen = true;
    this.cdr.detectChanges();
  }

  openHistory(item: MedicalHistoryWithDoctorItem) {
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
    if (!this.selectedAppointment || this.savingHistory || this.doctorId == null) return;

    this.savingHistory = true;
    this.historySaved = false;
    this.historyError = null;
    this.cdr.detectChanges();

    const payload = {
      ...this.mhForm,
      patientId: this.selectedAppointment.patientId,
      appointmentId: this.selectedAppointment.appointmentId
    };

    const request$ = this.editingHistoryId
      ? this.patientApi.updateMedicalHistory(this.editingHistoryId, payload)
      : this.patientApi.addMedicalHistoryWithDoctor(this.selectedAppointment.patientId, this.doctorId, payload);

    request$.subscribe({
      next: () => {
        this.savingHistory = false;
        this.historySaved = true;
        this.cdr.detectChanges();
        this.refreshToday();
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

  loadDashboardMetrics() {
    this.loadingMetrics = true;
    this.metricsUnavailable = false;
    this.cdr.markForCheck();
    this.apptApi.getDoctorDashboardMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.loadingMetrics = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.metrics = null;
        this.loadingMetrics = false;
        this.metricsUnavailable = true;
        this.cdr.markForCheck();
      }
    });
  }

  appointmentTrend = memoByDeps<DashboardTrend>(
    () => this.computeAppointmentTrend(),
    () => [this.loadingMetrics, this.metricsUnavailable, this.metrics],
  );

  private computeAppointmentTrend(): DashboardTrend {
    if (this.loadingMetrics) return { text: '', direction: 'flat' };
    return this.countTrend(this.metrics?.appointmentChangeFromYesterday, 'yesterday');
  }

  patientTrend = memoByDeps<DashboardTrend>(
    () => this.computePatientTrend(),
    () => [this.loadingMetrics, this.metricsUnavailable, this.metrics],
  );

  private computePatientTrend(): DashboardTrend {
    if (this.loadingMetrics) return { text: '', direction: 'flat' };
    if (this.metricsUnavailable || !this.metrics) {
      return { text: 'Not available', direction: 'flat' };
    }
    const percent = this.metrics.patientChangePercent;
    if (percent == null) {
      const added = this.metrics.newPatientsThisMonth ?? 0;
      return added > 0
        ? { text: `${added} new this month`, direction: 'up' }
        : { text: 'No change this month', direction: 'flat' };
    }
    if (percent === 0) {
      return { text: '0% this month', direction: 'flat' };
    }
    return {
      text: `${this.formatMetric(Math.abs(percent))}% this month`,
      direction: percent > 0 ? 'up' : 'down'
    };
  }

  pendingReportTrend = memoByDeps<DashboardTrend>(
    () => this.computePendingReportTrend(),
    () => [this.loadingMetrics, this.metricsUnavailable, this.metrics],
  );

  private computePendingReportTrend(): DashboardTrend {
    if (this.loadingMetrics) return { text: '', direction: 'flat' };
    return this.countTrend(this.metrics?.pendingReportChangeFromYesterday, 'yesterday');
  }

  satisfactionLabel(): string {
    if (this.loadingMetrics) return '';
    if (this.metricsUnavailable) return 'Not available';
    if (this.metrics?.satisfactionRating == null) return 'No reviews';
    return `${this.metrics.satisfactionRating.toFixed(1)} / 5`;
  }

  satisfactionTrend = memoByDeps<DashboardTrend>(
    () => this.computeSatisfactionTrend(),
    () => [this.loadingMetrics, this.metricsUnavailable, this.metrics],
  );

  private computeSatisfactionTrend(): DashboardTrend {
    if (this.loadingMetrics) return { text: '', direction: 'flat' };
    if (this.metricsUnavailable || !this.metrics) {
      return { text: 'Not available', direction: 'flat' };
    }
    const change = this.metrics.satisfactionChangeThisMonth;
    if (change == null) {
      return { text: 'Not enough reviews', direction: 'flat' };
    }
    if (change === 0) {
      return { text: 'No change this month', direction: 'flat' };
    }
    return {
      text: `${this.formatMetric(Math.abs(change))} this month`,
      direction: change > 0 ? 'up' : 'down'
    };
  }

  trendClass(direction: DashboardTrend['direction']): string {
    if (direction === 'up') return 'text-emerald-700 dark:text-emerald-400';
    if (direction === 'down') return 'text-amber-700 dark:text-amber-400';
    return 'text-muted';
  }

  private countTrend(delta: number | null | undefined, period: string): DashboardTrend {
    if (this.metricsUnavailable || delta == null) {
      return { text: 'Not available', direction: 'flat' };
    }
    if (delta === 0) {
      return { text: `Same as ${period}`, direction: 'flat' };
    }
    return {
      text: `${Math.abs(delta)} from ${period}`,
      direction: delta > 0 ? 'up' : 'down'
    };
  }

  private formatMetric(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

}
