import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AppointmentService, PatientAppointmentItem } from '../../core/services/appointment.service';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { AppointmentCardComponent } from '../../shared/components/appointment-card.component';
import { RescheduleAppointmentModalComponent } from '../../shared/reschedule-appointment-modal.component';
import { CancellationModalComponent } from '../../shared/cancellation-modal.component';
import { getAppointmentEpochMs, isAppointmentToday } from '../../shared/appointment-utils';
import { ToastService } from '../../core/services/toast.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { SelectOption } from '../../shared/select-dropdown.component';
import { SharedChatModalComponent } from '../../shared/chat/shared-chat-modal.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { memoByDeps } from '../../shared/utils/memo';
import { trackByAppointmentId } from '../../shared/utils/track-by';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [PageHeaderComponent, PageContainerComponent, CommonModule, RouterModule, FormsModule, AppointmentCardComponent, RescheduleAppointmentModalComponent, CancellationModalComponent, SharedChatModalComponent, EmptyStateComponent, PageLoaderComponent, FilterBarComponent],
  // OnPush: async callbacks below call markForCheck; children (cards, modals, chat) request their own checks
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.css'
})
export class MyAppointmentsComponent {
  private cdr = inject(ChangeDetectorRef);
  readonly trackByAppointmentId = trackByAppointmentId;
  appointments: PatientAppointmentItem[] = [];
  loading = false;
  detailsOpen: Record<number, boolean> = {};
  doctors: Doctor[] = [];

  statusFilter = '';
  specializationFilter = '';
  rangeFilter: 'upcoming' | 'today' | 'past' | '' = '';
  statuses: string[] = [];

  isFilterExpanded = false;

  get activeFilterCount(): number {
    let count = 0;
    if (this.statusFilter) count++;
    if (this.specializationFilter) count++;
    if (this.rangeFilter) count++;
    return count;
  }

  get statusOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Statuses' },
      ...this.statuses.map(s => ({ value: s, label: s }))
    ];
  }

  get rangeOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'past', label: 'Past' }
    ];
  }

  readonly patientFilterConfigs: FilterConfig[] = [
    {
      type: 'select',
      key: 'statusFilter',
      label: 'Status',
      placeholder: 'All Statuses',
      options: [{ value: '', label: 'All Statuses' }]
    },
    {
      type: 'search',
      key: 'specializationFilter',
      label: 'Specialization',
      placeholder: 'Search specialization...'
    },
    {
      type: 'radio',
      key: 'rangeFilter',
      label: 'Date Range',
      defaultValue: '',
      options: [
        { label: 'Today', value: 'today' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Past', value: 'past' },
        { label: 'All', value: '' }
      ]
    }
  ];

  patientFilterValues: Record<string, any> = {
    statusFilter: '',
    specializationFilter: '',
    rangeFilter: ''
  };

  onFilterBarChange(values: Record<string, any>) {
    this.statusFilter = values['statusFilter'] || '';
    this.specializationFilter = values['specializationFilter'] || '';
    this.rangeFilter = values['rangeFilter'] || '';
  }

  rescheduleTarget: PatientAppointmentItem | null = null;
  cancellationTarget: PatientAppointmentItem | null = null;
  rescheduleDateISO: string | null = null; // kept for compatibility if needed
  rescheduleTimeSlot: string | null = null; // kept for compatibility if needed
  availableSlots: string[] = [];
  rescheduleError: string | null = null;

  constructor(
    private apptApi: AppointmentService,
    private router: Router,
    private doctorApi: DoctorService,
    private route: ActivatedRoute,
    private toast: ToastService,
    private masterDataService: MasterDataService
  ) {
    this.refresh();
    this.masterDataService.getStatuses().subscribe({
      next: (s) => {
        this.statuses = s || [];
        const statusFilter = this.patientFilterConfigs.find((c) => c.key === 'statusFilter');
        if (statusFilter) statusFilter.options = this.statusOptions;
        this.cdr.markForCheck();
      }
    });
    // Apply default filters from query params if provided
    const qp = this.route.snapshot.queryParamMap;
    const statusParam = (qp.get('status') || '').toUpperCase();
    const rangeParam = (qp.get('range') || '').toUpperCase();

    // Status: 'ALL' means no filter; otherwise map to specific status
    if (statusParam && statusParam !== 'ALL') {
      this.statusFilter = statusParam;
    } else {
      this.statusFilter = '';
    }

    // Range: map to component's lowercase values; 'ALL' means no filter
    if (rangeParam === 'TODAY') this.rangeFilter = 'today';
    else if (rangeParam === 'UPCOMING') this.rangeFilter = 'upcoming';
    else if (rangeParam === 'PAST') this.rangeFilter = 'past';
    else this.rangeFilter = '';
    this.patientFilterValues = {
      statusFilter: this.statusFilter,
      specializationFilter: this.specializationFilter,
      rangeFilter: this.rangeFilter
    };
    // Preload doctors list to enable navigation to doctor profile from appointments
    this.doctorApi.getDirectory().subscribe({
      next: (res) => {
        this.doctors = res || [];
        this.enrichAppointments();
        this.cdr.markForCheck();
      },
      error: () => {
        this.doctors = [];
        this.cdr.markForCheck();
      },
    });
  }

  refresh() {
    this.loading = true;
    this.apptApi.getMyAppointments().subscribe({
      next: (res) => {
        this.appointments = res || [];
        this.enrichAppointments();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
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
        if (!a.consultationFees && doc.consultationFees) {
          a.consultationFees = doc.consultationFees;
        }
      }
    });
  }

  clearFilters() {
    this.statusFilter = '';
    this.specializationFilter = '';
    this.rangeFilter = '';
    this.patientFilterValues = {
      statusFilter: '',
      specializationFilter: '',
      rangeFilter: ''
    };
  }

  // Date helpers moved to shared utils

  filtered = memoByDeps<PatientAppointmentItem[]>(
    () => this.computeFiltered(),
    () => [this.appointments, this.statusFilter, this.specializationFilter, this.rangeFilter, Math.floor(Date.now() / 60000)],
  );

  private computeFiltered(): PatientAppointmentItem[] {
    const list = [...this.appointments];
    const nowMs = new Date().getTime();

    // First apply filters
    const filteredList = list.filter((a) => {
      const statusOk = !this.statusFilter || (a.status || '').toUpperCase() === this.statusFilter.toUpperCase();
      const specOk = !this.specializationFilter || (a.doctorSpecialization || '').toLowerCase().includes(this.specializationFilter.toLowerCase());
      let rangeOk = true;
      if (this.rangeFilter === 'upcoming') rangeOk = getAppointmentEpochMs(a) > nowMs;
      if (this.rangeFilter === 'past') rangeOk = getAppointmentEpochMs(a) < nowMs && !isAppointmentToday(a);
      if (this.rangeFilter === 'today') rangeOk = isAppointmentToday(a);
      return statusOk && specOk && rangeOk;
    });

    return this.sortBySmart(filteredList);
  }

  private sortBySmart(items: PatientAppointmentItem[]) {
    const now = Date.now();
    const upcoming = items.filter(a => getAppointmentEpochMs(a) >= now);
    const past = items.filter(a => getAppointmentEpochMs(a) < now);

    // Sort upcoming by nearest date (Ascending)
    upcoming.sort((a, b) => getAppointmentEpochMs(a) - getAppointmentEpochMs(b));

    // Sort past by most recent date (Descending)
    past.sort((a, b) => getAppointmentEpochMs(b) - getAppointmentEpochMs(a));

    return [...upcoming, ...past];
  }

  // Status class moved to shared utils (cards consume it internally)

  startReschedule(a: PatientAppointmentItem) {
    this.rescheduleTarget = a;
    this.rescheduleDateISO = null;
    this.rescheduleTimeSlot = null;
    this.availableSlots = [];
    this.rescheduleError = null;
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
        this.toast.showSuccess('Appointment rescheduled successfully');
        this.closeReschedule();
        this.refresh();
        this.cdr.markForCheck();
      },
      error: () => {
        this.rescheduleError = 'Unable to reschedule';
        this.toast.showError('Failed to reschedule appointment');
        this.cdr.markForCheck();
      },
    });
  }

  cancelAppointment(a: PatientAppointmentItem) {
    this.cancellationTarget = a;
  }

  closeCancellation() {
    this.cancellationTarget = null;
  }

  confirmCancellation() {
    if (!this.cancellationTarget) return;
    this.apptApi.cancelMyAppointment(this.cancellationTarget.appointmentId).subscribe({
      next: () => {
        this.toast.showSuccess('Appointment cancelled successfully');
        this.closeCancellation();
        this.refresh();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Cancellation failed', err);
        this.toast.showError('Failed to cancel appointment. Please try again.');
        this.closeCancellation(); // modifying this to close regardless, or maybe keep open? User said "not able to cancel" so maybe good to close and let them try again.
        this.cdr.markForCheck();
      }
    });
  }

  handleRescheduleFromCancellation() {
    if (!this.cancellationTarget) return;
    const target = this.cancellationTarget;
    this.closeCancellation();
    this.startReschedule(target);
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
