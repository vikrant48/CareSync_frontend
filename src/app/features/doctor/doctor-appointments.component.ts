import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AppointmentCardComponent } from '../../shared/components/appointment-card.component';
import { getDoctorAppointmentEpochMs } from '../../shared/doctor-appointment-utils';
import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { SharedChatModalComponent } from '../../shared/chat/shared-chat-modal.component';
import { PatientProfileService, PatientDto, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { forkJoin, map, firstValueFrom } from 'rxjs';
import { SelectOption } from '../../shared/select-dropdown.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';
import { IntakeSummaryModalComponent } from './intake-summary-modal.component';
import { SoapReportEditorComponent } from './soap-report-editor.component';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { PreVisitIntakeRequest, PreVisitIntakeResponse, SoapReportDto } from '../../core/models/appointment.models';
import { ToastService } from '../../core/services/toast.service';

type TimeRange = 'UPCOMING' | 'TODAY' | 'PAST' | 'ALL';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppointmentCardComponent,
    PatientDetailsModalComponent,
    MedicalHistoryDetailModalComponent,
    DoctorLayoutComponent,
    SharedChatModalComponent,
    EmptyStateComponent,
    SkeletonComponent,
    FilterBarComponent,
    IntakeSummaryModalComponent,
    SoapReportEditorComponent
  ],
  templateUrl: './doctor-appointments.component.html',
  styleUrl: './doctor-appointments.component.css'
})
export class DoctorAppointmentsComponent {
  loading = false;
  appointments: DoctorAppointmentItem[] = [];
  statusFilter: string = 'ALL';
  statuses: string[] = [];
  range: TimeRange = 'ALL';
  searchTerm = '';
  isFilterExpanded = false;

  get statusOptions(): SelectOption[] {
    return [
      { value: 'ALL', label: 'All Statuses' },
      ...this.statuses.map(s => ({ value: s, label: s }))
    ];
  }

  get appointmentFilterActiveCount(): number {
    let count = 0;
    if (this.statusFilter !== 'ALL') count++;
    if (this.searchTerm) count++;
    if (this.range !== 'ALL') count++;
    return count;
  }

  clearAppointmentFilters() {
    this.statusFilter = 'ALL';
    this.range = 'ALL';
    this.searchTerm = '';
    this.appointmentFilterValues = {
      statusFilter: 'ALL',
      searchTerm: '',
      range: 'ALL'
    };
    this.refresh();
  }

  readonly appointmentFilterConfigs: FilterConfig[] = [
    {
      type: 'select',
      key: 'statusFilter',
      label: 'Status',
      placeholder: 'All Statuses',
      options: [{ value: 'ALL', label: 'All Statuses' }]
    },
    {
      type: 'search',
      key: 'searchTerm',
      label: 'Search',
      placeholder: 'Search patient name, phone, or appointment ID...'
    },
    {
      type: 'radio',
      key: 'range',
      label: 'Date Range',
      defaultValue: 'ALL',
      options: [
        { label: 'Today', value: 'TODAY' },
        { label: 'Upcoming', value: 'UPCOMING' },
        { label: 'Past', value: 'PAST' },
        { label: 'All', value: 'ALL' }
      ]
    }
  ];

  appointmentFilterValues: Record<string, any> = {
    statusFilter: 'ALL',
    searchTerm: '',
    range: 'ALL'
  };

  onFilterBarChange(values: Record<string, any>) {
    this.statusFilter = values['statusFilter'] || 'ALL';
    this.searchTerm = values['searchTerm'] || '';
    this.range = (values['range'] as TimeRange) || 'ALL';
    this.refresh();
  }

  // Pagination state
  page = 0;
  size = 9;
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

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  goToPage(p: number) {
    if (p >= 0 && p < this.totalPages) {
      this.page = p;
      this.loadAppointments();
    }
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

  // Pre-Visit Intake Modal State
  intakeModalOpen = false;
  selectedIntakeAppointmentId = 0;
  intakeSummaryText = '';
  intakeData: PreVisitIntakeResponse | PreVisitIntakeRequest | null = null;

  // AI SOAP Scribe Modal State
  soapModalOpen = false;
  selectedSoapAppointmentId = 0;
  soapReportData: SoapReportDto = {
    appointmentId: 0,
    patientId: 0,
    doctorId: 0,
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    isDraft: true,
    isSigned: false
  };

  constructor(
    private appts: AppointmentService,
    private appointmentApi: AppointmentApiService,
    private patients: PatientProfileService,
    private router: Router,
    private masterDataService: MasterDataService,
    private toast: ToastService
  ) {
    this.refresh();
    this.masterDataService.getStatuses().subscribe({
      next: (s) => {
        this.statuses = s || [];
        const statusFilter = this.appointmentFilterConfigs.find((c) => c.key === 'statusFilter');
        if (statusFilter) statusFilter.options = this.statusOptions;
      }
    });
  }

  openIntakeSummaryModal(a: DoctorAppointmentItem): void {
    this.selectedIntakeAppointmentId = a.appointmentId;
    this.intakeModalOpen = true;
    this.intakeSummaryText = 'Loading AI intake summary...';
    this.intakeData = null;

    this.appointmentApi.getPreVisitIntakeSummary(a.appointmentId).subscribe({
      next: (res) => {
        this.intakeSummaryText = res.aiTriageSummary || res.preVisitSummary || 'Intake summary available.';
        this.intakeData = res;
      },
      error: (err) => {
        this.intakeSummaryText = 'No pre-visit intake has been submitted for this appointment yet.';
      }
    });
  }

  closeIntakeModal(): void {
    this.intakeModalOpen = false;
  }

  openSoapEditorModal(a: DoctorAppointmentItem): void {
    this.selectedSoapAppointmentId = a.appointmentId;
    this.soapModalOpen = true;
    this.soapReportData = {
      appointmentId: a.appointmentId,
      patientId: a.patientId,
      doctorId: 0,
      subjective: a.reason || '',
      objective: '',
      assessment: '',
      plan: '',
      isDraft: true,
      isSigned: false
    };

    this.appointmentApi.getSoapDraft(a.appointmentId).subscribe({
      next: (res) => {
        if (res) {
          this.soapReportData = res;
        }
      },
      error: () => { }
    });
  }

  closeSoapModal(): void {
    this.soapModalOpen = false;
  }

  onSoapReportSigned(report: SoapReportDto): void {
    this.toast.showSuccess('Medical SOAP report signed and appointment completed!');
    this.refresh();
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
        if (!this.totalAppointmentsCount || this.totalAppointmentsCount < this.appointments.length) {
          this.totalAppointmentsCount = this.appointments.length;
        }
        this.loading = false;
      },
      error: () => {
        this.appointments = [];
        this.loading = false;
      }
    });

    this.appts.countDoctorAppointments(this.statusFilter, this.range, this.searchTerm).subscribe({
      next: (count) => {
        if (count && count > 0) {
          this.totalAppointmentsCount = count;
        } else if (!this.totalAppointmentsCount || this.totalAppointmentsCount < this.appointments.length) {
          this.totalAppointmentsCount = this.appointments.length;
        }
      },
      error: () => {
        if (!this.totalAppointmentsCount) {
          this.totalAppointmentsCount = this.appointments.length;
        }
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
