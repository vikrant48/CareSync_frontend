import { ChangeDetectionStrategy, ChangeDetectorRef, Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ToastService } from '../../core/services/toast.service';
import { EmergencyAppointmentModalComponent } from '../../shared/emergency-appointment-modal.component';
import { SpecializationAutocompleteComponent } from '../../shared/specialization-autocomplete.component';
import { SelectOption } from '../../shared/select-dropdown.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { PaginatorComponent } from '../../shared/ui/paginator.component';
import { StickyActionBarComponent } from '../../shared/ui/sticky-action-bar.component';
import { doctorDisplayName, doctorInitial as getDoctorInitial } from '../../shared/utils/doctor-name.util';
import { InrPipe } from '../../shared/utils/inr.pipe';
import { trackById } from '../../shared/utils/track-by';
import { markForCheckOn } from '../../shared/utils/mark-for-check';

@Component({
  selector: 'app-patient-book-appointment',
  standalone: true,
  imports: [InrPipe, StickyActionBarComponent, PaginatorComponent, PageContainerComponent, CommonModule, RouterModule, FormsModule, EmergencyAppointmentModalComponent, SpecializationAutocompleteComponent, PageLoaderComponent, EmptyStateComponent, FilterBarComponent],
  // OnPush: HTTP results go through markForCheckOn; child modals/autocomplete request their own checks
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-book-appointment.component.html',
  styleUrl: './patient-book-appointment.component.css'
})
export class PatientBookAppointmentComponent {
  private cdr = inject(ChangeDetectorRef);
  readonly trackById = trackById;
  // static: resolved before the first check, so the filter bar has the template on first render (needed under OnPush)
  @ViewChild('specializationTpl', { static: true })
  set specializationTpl(tpl: TemplateRef<unknown> | undefined) {
    const spec = this.bookFilterConfigs.find((c) => c.key === 'specializationFilter');
    if (spec && tpl) spec.customTemplate = tpl;
  }

  specializationFilter = '';
  nameFilter = '';
  genderFilter = '';
  addressFilter = '';

  readonly bookFilterConfigs: FilterConfig[] = [
    {
      type: 'custom',
      key: 'specializationFilter',
      label: 'Specialization',
      icon: 'fa-solid fa-stethoscope',
      defaultValue: ''
    },
    {
      type: 'search',
      key: 'nameFilter',
      label: 'Doctor Name',
      icon: 'fa-solid fa-user-doctor',
      placeholder: 'Search doctor name...',
      defaultValue: ''
    },
    {
      type: 'select',
      key: 'genderFilter',
      label: 'Gender',
      icon: 'fa-solid fa-user-group',
      placeholder: 'All Genders',
      defaultValue: '',
      width: 'w-full sm:w-48',
      options: [{ label: 'All Genders', value: '' }]
    },
    {
      type: 'text',
      key: 'addressFilter',
      label: 'Location',
      icon: 'fa-solid fa-location-dot',
      placeholder: 'Select location...',
      defaultValue: ''
    },
    {
      type: 'button',
      key: 'search',
      buttonLabel: 'Search',
      buttonIcon: 'fa-solid fa-magnifying-glass',
      clearable: false,
      width: 'w-full sm:w-36',
      buttonClass: 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white border border-transparent',
      onClick: () => this.searchDoctors()
    }
  ];

  bookFilterValues: Record<string, string> = {
    specializationFilter: '',
    nameFilter: '',
    genderFilter: '',
    addressFilter: ''
  };
  loadingDoctors = true;
  private doctorSearchId = 0;
  showEmergencyModal = false;
  genders: string[] = [];

  // Pagination & Search state
  page = 0;
  size = 12;
  totalDoctorsCount = 0;
  sortBy = 'relevance';

  sortByOptions: SelectOption[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'rating', label: 'Rating' },
    { value: 'experience', label: 'Experience' },
    { value: 'feeAsc', label: 'Fee: Low to High' },
    { value: 'feeDesc', label: 'Fee: High to Low' }
  ];

  isFilterExpanded = false;

  get activeFilterCount(): number {
    let count = 0;
    if (this.specializationFilter) count++;
    if (this.nameFilter) count++;
    if (this.genderFilter) count++;
    if (this.addressFilter) count++;
    return count;
  }

  get genderOptions(): SelectOption[] {
    return [
      { value: '', label: 'All Genders' },
      ...this.genders.map(g => ({ value: g, label: g }))
    ];
  }

  doctors: Doctor[] = [];
  ratings: Record<number, { avg: number; count: number }> = {};
  bookingEmergencyDoctorId: number | null = null;

  constructor(
    private doctorApi: DoctorService,
    private router: Router,
    private masterDataService: MasterDataService,
    private appointmentService: AppointmentService,
    private toast: ToastService
  ) {
    this.searchDoctors();
    this.masterDataService.getGenders().pipe(markForCheckOn(this.cdr)).subscribe({
      next: (g) => {
        this.genders = g || [];
        const gender = this.bookFilterConfigs.find((c) => c.key === 'genderFilter');
        if (gender) gender.options = this.genderOptions;
      }
    });
  }

  searchDoctors() {
    const requestId = ++this.doctorSearchId;
    this.loadingDoctors = true;
    const searchParams = {
      query: this.nameFilter || undefined,
      specialization: this.specializationFilter || undefined,
      location: this.addressFilter || undefined,
      gender: this.genderFilter || undefined,
      page: this.page,
      size: this.size,
      sortBy: this.sortBy !== 'relevance' ? this.sortBy : undefined
    };

    // Fetch doctors for current page
    this.doctorApi.searchDoctors(searchParams).pipe(markForCheckOn(this.cdr)).subscribe({
      next: (res) => {
        if (requestId !== this.doctorSearchId) return;
        this.doctors = res || [];
        this.loadingDoctors = false;
        (res || []).forEach((d) => {
          this.ratings[d.id] = { avg: d.averageRating || 0, count: d.reviewCount || 0 };
        });
      },
      error: () => {
        if (requestId !== this.doctorSearchId) return;
        this.loadingDoctors = false;
      },
    });

    // Fetch total doctor count for filtered query
    this.doctorApi.countDoctors(searchParams).pipe(markForCheckOn(this.cdr)).subscribe({
      next: (count) => {
        this.totalDoctorsCount = count || 0;
      },
      error: () => { }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalDoctorsCount / this.size));
  }

  goToPage(p: number) {
    if (p >= 0 && p < this.totalPages) {
      this.page = p;
      this.searchDoctors();
    }
  }

  onFilterChange() {
    this.page = 0;
    this.searchDoctors();
  }

  onSpecializationChange(value: string) {
    this.specializationFilter = value || '';
    this.bookFilterValues = {
      ...this.bookFilterValues,
      specializationFilter: this.specializationFilter
    };
    this.onFilterChange();
  }

  onFilterBarChange(values: Record<string, string>) {
    this.specializationFilter = values['specializationFilter'] || '';
    this.nameFilter = values['nameFilter'] || '';
    this.genderFilter = values['genderFilter'] || '';
    this.addressFilter = values['addressFilter'] || '';
    this.onFilterChange();
  }

  openDoctor(d: Doctor) {
    this.router.navigate(['/patient/doctor', d.username]);
  }

  formatDoctorName(d: Doctor) {
    return doctorDisplayName(d);
  }

  doctorInitial(d: Doctor) {
    return getDoctorInitial(d);
  }

  formatExperience(d: Doctor): string {
    if (d.experiences && d.experiences.length > 0) {
      return `${d.experiences.length}+ years`;
    }
    const expYears = 0;
    return `${expYears}+ years`;
  }

  formatLocation(d: Doctor): string {
    if (d.address && d.address.trim()) {
      return d.address;
    }
    return 'Location not specified';
  }

  emergencyDoctor: Doctor | null = null;

  goToDoctorAndBook(d: Doctor) {
    this.router.navigate(['/patient/doctor', d.username], { queryParams: { book: 'true' } });
  }

  bookEmergencyDoctor(d: Doctor) {
    if (d.isActive === false) return;
    this.emergencyDoctor = d;
    this.showEmergencyModal = true;
  }

  openEmergencyModal() {
    this.emergencyDoctor = null;
    this.showEmergencyModal = true;
  }

  closeEmergencyModal() {
    this.showEmergencyModal = false;
    this.emergencyDoctor = null;
  }

  resetFilters() {
    this.specializationFilter = '';
    this.nameFilter = '';
    this.genderFilter = '';
    this.addressFilter = '';
    this.bookFilterValues = {
      specializationFilter: '',
      nameFilter: '',
      genderFilter: '',
      addressFilter: ''
    };
    this.sortBy = 'relevance';
    this.page = 0;
    this.searchDoctors();
  }

  onEmergencyAppointmentBooked(appointment: any) {
    console.log('Emergency appointment booked:', appointment);
    this.router.navigate(['/patient/appointments']);
  }
}
