import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { EmergencyAppointmentModalComponent } from '../../shared/emergency-appointment-modal.component';
import { SpecializationAutocompleteComponent } from '../../shared/specialization-autocomplete.component';
import { SelectOption } from '../../shared/select-dropdown.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ButtonComponent, FilterBarComponent, FilterConfig } from '../../shared/components';

@Component({
  selector: 'app-patient-book-appointment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, EmergencyAppointmentModalComponent, SpecializationAutocompleteComponent, SkeletonComponent, EmptyStateComponent, ButtonComponent, FilterBarComponent],
  templateUrl: './patient-book-appointment.component.html',
  styleUrl: './patient-book-appointment.component.css'
})
export class PatientBookAppointmentComponent {
  @ViewChild('specializationTpl')
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
  loadingDoctors = false;
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

  toggleFilter() {
    this.isFilterExpanded = !this.isFilterExpanded;
  }

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

  constructor(
    private doctorApi: DoctorService,
    private router: Router,
    private masterDataService: MasterDataService
  ) {
    this.searchDoctors();
    this.masterDataService.getGenders().subscribe({
      next: (g) => {
        this.genders = g || [];
        const gender = this.bookFilterConfigs.find((c) => c.key === 'genderFilter');
        if (gender) gender.options = this.genderOptions;
      }
    });
  }

  refreshDoctors() {
    this.page = 0;
    this.searchDoctors();
  }

  searchDoctors() {
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
    this.doctorApi.searchDoctors(searchParams).subscribe({
      next: (res) => {
        this.doctors = res || [];
        this.loadingDoctors = false;
        (res || []).forEach((d) => {
          this.ratings[d.id] = { avg: d.averageRating || 0, count: d.reviewCount || 0 };
        });
      },
      error: () => (this.loadingDoctors = false),
    });

    // Fetch total doctor count for filtered query
    this.doctorApi.countDoctors(searchParams).subscribe({
      next: (count) => {
        this.totalDoctorsCount = count || 0;
      },
      error: () => { }
    });
  }

  get startItemIndex(): number {
    if (this.totalDoctorsCount === 0) return 0;
    return this.page * this.size + 1;
  }

  get endItemIndex(): number {
    return Math.min((this.page + 1) * this.size, this.totalDoctorsCount);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalDoctorsCount / this.size));
  }

  get paginationPages(): number[] {
    const total = this.totalPages;
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
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

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.searchDoctors();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.searchDoctors();
    }
  }

  openDoctor(d: Doctor) {
    this.router.navigate(['/patient/doctor', d.username]);
  }

  formatDoctorName(d: Doctor) {
    const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
    const hasPrefix = /^dr\.?\s/i.test(base);
    return hasPrefix ? base : `Dr. ${base}`;
  }

  doctorInitial(d: Doctor) {
    const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
    const stripped = base.replace(/^dr\.?\s+/i, '');
    return stripped.charAt(0) || '?';
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

  goToDoctorAndBook(d: Doctor) {
    this.router.navigate(['/patient/doctor', d.username], { queryParams: { book: 'true' } });
  }

  openEmergencyModal() {
    this.showEmergencyModal = true;
  }

  closeEmergencyModal() {
    this.showEmergencyModal = false;
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
