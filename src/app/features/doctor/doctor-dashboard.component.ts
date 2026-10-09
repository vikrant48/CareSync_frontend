import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { MedicalHistoryFormModalComponent } from '../../shared/medical-history-form-modal.component';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { DoctorNotificationComponent } from './doctor-notification.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { PatientProfileService, PatientDto, MedicalHistoryItem, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { DatePickerComponent } from '../../shared/date-picker.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { DoctorDashboardScheduleComponent } from './doctor-dashboard-schedule.component';
import { DoctorDashboardPatientsComponent } from './doctor-dashboard-patients.component';

import { AnalyticsApiService, OverallAnalytics } from '../../core/services/analytics.service';
import { ReportsApiService } from '../../core/services/reports.service';
import { LeaveService, DoctorLeave } from '../../core/services/leave.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, PatientDetailsModalComponent,
    MedicalHistoryDetailModalComponent, MedicalHistoryFormModalComponent,
    DoctorLayoutComponent, DoctorNotificationComponent, DatePickerComponent,
    ModalShellComponent, DoctorDashboardScheduleComponent, DoctorDashboardPatientsComponent
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

  private analyticsApi = inject(AnalyticsApiService);
  private reportsApi = inject(ReportsApiService);
  private leaveApi = inject(LeaveService);
  private confirm = inject(ConfirmService);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  username: string | null = null;
  doctorId: number | null = null;
  doctorName: string | null = null;
  profile: any = null;
  documents: any[] = [];

  todayDateFormatted: string = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

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
  leaveModalOpen = false;
  upcomingLeaves: any[] = [];
  leafForm: any = { startDate: '', endDate: '', reason: '' };
  savingLeave = false;
  leaveError: string | null = null;

  // Analytics state
  overall: OverallAnalytics | null = null;

  get isOnLeaveToday(): boolean {
    const today = this.todayISO();
    return this.upcomingLeaves.some(l => l.startDate <= today && l.endDate >= today);
  }

  calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  selectedCalendarDay: string | null = null;
  calendarAppointments: DoctorAppointmentItem[] = [];

  get mockOrRealAppointments(): any[] {
    return (this.todayAppointments || []).map(a => ({ ...a, isReal: true }));
  }

  get recentPatientsList(): any[] {
    return (this.todayAppointments || []).slice(0, 4).map(a => ({
      name: a.patientName,
      age: this.patientAge(a),
      condition: a.reason || '',
      lastVisit: a.appointmentDate || '',
      status: a.status || '',
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

  get calendarTitle(): string {
    return this.calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  get calendarCells(): { label: string; key: string; today: boolean; hasAppointment: boolean }[] {
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
    if (!value) return null;
    const iso = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
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

  get selectedDayAppointments(): DoctorAppointmentItem[] {
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
      this.loadAnalytics();
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

  addLeave() {
    if (!this.leafForm.startDate || !this.leafForm.endDate) return;
    this.savingLeave = true;
    this.leaveError = null;
    this.leaveApi.addLeave(this.leafForm.startDate, this.leafForm.endDate, this.leafForm.reason).subscribe({
      next: () => {
        this.savingLeave = false;
        this.leafForm = { startDate: '', endDate: '', reason: '' };
        this.refreshLeaves();
      },
      error: (e: any) => {
        this.savingLeave = false;
        this.leaveError = e.error?.error || 'Failed to add leave';
        this.cdr.detectChanges();
      }
    });
  }

  async deleteLeave(id: number) {
    const ok = await this.confirm.ask({
      title: 'Delete leave',
      message: 'Are you sure you want to delete this leave record?',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      danger: true,
    });
    if (!ok) return;
    this.leaveApi.deleteLeave(id).subscribe({
      next: () => this.refreshLeaves()
    });
  }

  loadCalendarAppointments() {
    this.apptApi.getDoctorAllAppointments().subscribe({
      next: (res) => {
        this.calendarAppointments = res || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.calendarAppointments = [];
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

  todayStats(): Record<'BOOKED' | 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED', number> {
    const stats = { BOOKED: 0, SCHEDULED: 0, CONFIRMED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 } as Record<any, number>;
    for (const a of this.todayAppointments || []) {
      if (a.status === 'CANCELLED_BY_PATIENT' || a.status === 'CANCELLED_BY_DOCTOR' || a.status === 'CANCELLED') {
        stats['CANCELLED']++;
      } else if (stats[a.status] != null) {
        stats[a.status]++;
      }
    }
    return stats as any;
  }

  get nextAppointment(): DoctorAppointmentItem | null {
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
    return new Date().toISOString().slice(0, 10);
  }

  openPatient(a: DoctorAppointmentItem | null) {
    if (!a) return;
    this.historyFormModalOpen = false;
    this.historyDetailModalOpen = false;

    this.selectedAppointment = a;
    this.showPatientModal = true;
    this.selectedPatient = null;
    this.selectedPatientHistory = [];
    this.selectedPatientDocuments = [];
    this.mhForm = { visitDate: this.todayISO() };
    this.patientApi.getCompleteData(a.patientId).subscribe({
      next: (data) => {
        this.selectedPatient = data.patient;
        this.selectedPatientHistory = data.medicalHistory;
        this.selectedPatientDocuments = data.documents || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedPatient = null;
        this.selectedPatientHistory = [];
        this.selectedPatientDocuments = [];
        this.cdr.detectChanges();
      },
    });
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

  loadAnalytics() {
    if (this.doctorId == null) return;
    const end = new Date().toISOString().slice(0, 10);
    const start = this.isoDaysAgo(30);

    this.analyticsApi.getOverallAnalytics(start, end).subscribe({
      next: (o) => {
        this.overall = o || null;
        this.cdr.markForCheck();
      }
    });
  }

  private isoDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  trackLeave(index: number, leave: { id?: number; startDate?: string }): number | string {
    return leave?.id ?? leave?.startDate ?? index;
  }
}
