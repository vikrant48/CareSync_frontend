import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { EmergencyAppointmentModalComponent } from '../../shared/emergency-appointment-modal.component';
import { SpecializationAutocompleteComponent } from '../../shared/specialization-autocomplete.component';
import { SelectDropdownComponent, SelectOption } from '../../shared/select-dropdown.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { FilterBarComponent } from '../../shared/ui/filter-bar.component';

@Component({
  selector: 'app-patient-book-appointment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, EmergencyAppointmentModalComponent, SpecializationAutocompleteComponent, SelectDropdownComponent, SkeletonComponent, EmptyStateComponent, FilterBarComponent],
  templateUrl: './patient-book-appointment.component.html',
  styleUrl: './patient-book-appointment.component.css'
})
export class PatientBookAppointmentComponent {
  specializationFilter = '';
  nameFilter = '';
  genderFilter = '';
  addressFilter = '';
  loadingDoctors = false;
  showEmergencyModal = false;
  genders: string[] = [];

  // Pagination & Search state
  page = 0;
  size = 50;
  totalDoctorsCount = 0;

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
      next: (g) => this.genders = g || this.genders
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
      size: this.size
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

  onFilterChange() {
    this.page = 0;
    this.searchDoctors();
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
    return hasPrefix ? base : `Dr ${base}`;
  }

  doctorInitial(d: Doctor) {
    const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
    const stripped = base.replace(/^dr\.?\s+/i, '');
    return stripped.charAt(0) || '?';
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
    this.page = 0;
    this.searchDoctors();
  }

  onEmergencyAppointmentBooked(appointment: any) {
    console.log('Emergency appointment booked:', appointment);
    this.router.navigate(['/patient/appointments']);
  }
}
