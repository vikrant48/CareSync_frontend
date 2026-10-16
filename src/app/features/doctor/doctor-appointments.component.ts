import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AppointmentCardComponent } from '../../shared/components/appointment-card.component';
import { getAppointmentEpochMs } from '../../shared/appointment-utils';
import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { SharedChatModalComponent } from '../../shared/chat/shared-chat-modal.component';
import { PatientProfileService, PatientDto, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { forkJoin, map, firstValueFrom } from 'rxjs';
import { SelectOption } from '../../shared/select-dropdown.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';
import { IntakeSummaryModalComponent } from './intake-summary-modal.component';
import { SoapReportEditorComponent } from './soap-report-editor.component';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { PreVisitIntakeRequest, PreVisitIntakeResponse, SoapReportDto } from '../../core/models/appointment.models';
import { ToastService } from '../../core/services/toast.service';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { PaginatorComponent } from '../../shared/ui/paginator.component';
import { StickyActionBarComponent } from '../../shared/ui/sticky-action-bar.component';
import { memoByDeps } from '../../shared/utils/memo';
import { trackByAppointmentId } from '../../shared/utils/track-by';
import { markForCheckOn } from '../../shared/utils/mark-for-check';

type TimeRange = 'UPCOMING' | 'TODAY' | 'PAST' | 'ALL';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [StickyActionBarComponent, PaginatorComponent, PageContainerComponent, 
    CommonModule,
    FormsModule,
    RouterModule,
    AppointmentCardComponent,
    PatientDetailsModalComponent,
    MedicalHistoryDetailModalComponent,
    SharedChatModalComponent,
    EmptyStateComponent,
    PageLoaderComponent,
    FilterBarComponent,
    IntakeSummaryModalComponent,
    SoapReportEditorComponent
  ],
  // OnPush: every HTTP call below is piped through markForCheckOn so its results render
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-appointments.component.html',
  styleUrl: './doctor-appointments.component.css'
})
export class DoctorAppointmentsComponent {
  private cdr = inject(ChangeDetectorRef);
  readonly trackByAppointmentId = trackByAppointmentId;
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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalAppointmentsCount / this.size));
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
    this.masterDataService.getStatuses().pipe(markForCheckOn(this.cdr)).subscribe({
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

    this.appointmentApi.getPreVisitIntakeSummary(a.appointmentId).pipe(markForCheckOn(this.cdr)).subscribe({
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

    this.appointmentApi.getSoapDraft(a.appointmentId).pipe(markForCheckOn(this.cdr)).subscribe({
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

  // The editor already shows the "draft saved" toast; just refresh the list.
  onSoapReportSaved(): void {
    this.refresh();
  }

  refresh() {
    this.page = 0;
    this.loadAppointments();
  }

  private loadAppointments() {
    this.loading = true;

    this.appts.getDoctorPaginatedAppointments(this.page, this.size, this.statusFilter, this.range, this.searchTerm).pipe(markForCheckOn(this.cdr)).subscribe({
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

    this.appts.countDoctorAppointments(this.statusFilter, this.range, this.searchTerm).pipe(markForCheckOn(this.cdr)).subscribe({
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

  filteredAppointments = memoByDeps<DoctorAppointmentItem[]>(
    () => this.computeFilteredAppointments(),
    () => [this.appointments, this.searchTerm],
  );

  private computeFilteredAppointments(): DoctorAppointmentItem[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    return (this.appointments || [])
      .filter((a) => term ? ((a.patientName || '').toLowerCase().includes(term) || (String(a.patientId || '').includes(term))) : true);
  }

  openDetails(a: DoctorAppointmentItem) {
    this.selectedAppointment = a;
    this.detailsOpen = true;
    this.patient = null;
    this.history = [];
    this.documents = [];
    this.patients.getCompleteData(a.patientId).pipe(markForCheckOn(this.cdr)).subscribe({
      next: (resp) => {
        this.patient = resp?.patient ?? null;
        this.history = (resp?.medicalHistory as any) || [];
        this.documents = resp?.documents || [];
      }
    });
    // Also load with-doctor records if available
    this.patients.getMedicalHistoryWithDoctor(a.patientId).pipe(markForCheckOn(this.cdr)).subscribe({
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
    this.patients.getMedicalHistoryDetail(h.id).pipe(markForCheckOn(this.cdr)).subscribe({
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

  private sortByNearestUpcoming(items: DoctorAppointmentItem[]) {
    const now = Date.now();
    const upcoming = items.filter(a => getAppointmentEpochMs(a) >= now);
    const past = items.filter(a => getAppointmentEpochMs(a) < now);

    // Sort upcoming by nearest date (Ascending)
    upcoming.sort((a, b) => getAppointmentEpochMs(a) - getAppointmentEpochMs(b));

    // Sort past by most recent date (Descending)
    past.sort((a, b) => getAppointmentEpochMs(b) - getAppointmentEpochMs(a));

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
