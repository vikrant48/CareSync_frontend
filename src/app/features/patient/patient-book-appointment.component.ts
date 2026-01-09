import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { EmergencyAppointmentModalComponent } from '../../shared/emergency-appointment-modal.component';
import { SpecializationAutocompleteComponent } from '../../shared/specialization-autocomplete.component';

@Component({
  selector: 'app-patient-book-appointment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, EmergencyAppointmentModalComponent, SpecializationAutocompleteComponent],
  template: `
    <app-patient-layout>
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Header Section -->
      <section class="panel p-4 sm:p-6 flex flex-col items-center justify-between gap-4 md:flex-row shadow-lg">
        <div class="flex flex-col gap-1 w-full md:w-auto text-center md:text-left">
          <h2 class="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
             Find & Book Appointments
          </h2>
          <p class="text-sm text-gray-400">Search for specialized doctors and book your slot.</p>
        </div>
        
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
           <button class="btn-primary bg-red-600/90 hover:bg-red-600 border-none shadow-lg shadow-red-900/40 text-white font-medium px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95" (click)="openEmergencyModal()">
             <div class="w-2 h-2 rounded-full bg-white animate-pulse"></div> Emergency Booking
           </button>
           <button class="text-blue-400 hover:text-white transition-colors text-sm font-medium px-3 py-2 flex items-center justify-center gap-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10" (click)="refreshDoctors()">
             <i class="fa-solid fa-rotate-right" [class.animate-spin]="loadingDoctors"></i> Refresh
           </button>
        </div>
      </section>

      <!-- Filters Section -->
      <section class="panel p-4 sm:p-6 space-y-4 shadow-lg relative z-30">
        <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
               <i class="fa-solid fa-filter text-blue-500"></i>
               <span class="font-semibold text-gray-200">Filters</span>
            </div>
            <button *ngIf="specializationFilter || nameFilter || genderFilter || addressFilter" 
                    (click)="resetFilters()" 
                    class="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 transition-colors">
               <i class="fa-solid fa-xmark"></i> Clear Filters
            </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <app-specialization-autocomplete
            class="w-full relative z-40"
            [(ngModel)]="specializationFilter"
            placeholder="Specialization..."
            inputClass="input w-full bg-gray-900/50"
            [allowAddNew]="false">
          </app-specialization-autocomplete>
          
          <div class="relative z-10">
             <input type="text" class="input w-full bg-gray-900/50" placeholder="Doctor name..." [(ngModel)]="nameFilter" />
          </div>

          <div class="relative z-10">
            <select class="input w-full appearance-none bg-gray-900/50" [(ngModel)]="genderFilter">
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i class="fa-solid fa-chevron-down text-xs text-gray-500"></i>
            </div>
         </div>

         <div class="relative z-10">
             <input type="text" class="input w-full bg-gray-900/50" placeholder="Location..." [(ngModel)]="addressFilter" />
          </div>
        </div>
      </section>

      <!-- Loading & Empty States -->
      <div *ngIf="loadingDoctors" class="flex flex-col items-center justify-center min-h-[300px] text-blue-400 animate-fade-in">
        <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-3"></i>
        <span class="text-sm tracking-wider uppercase font-semibold">Loading doctors...</span>
      </div>

      <div *ngIf="!loadingDoctors && filteredDoctors().length === 0" class="flex flex-col items-center justify-center min-h-[300px] text-gray-500 animate-fade-in">
         <i class="fa-regular fa-face-frown text-4xl mb-3 opacity-50"></i>
         <p>No doctors found matching your criteria.</p>
         <button class="mt-4 text-blue-400 hover:text-blue-300 text-sm hover:underline" (click)="resetFilters()">Clear Filters</button>
      </div>

      <!-- Doctors Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" *ngIf="!loadingDoctors && filteredDoctors().length > 0">
        <div class="panel p-5 cursor-pointer relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 border border-gray-800 hover:border-blue-500/30 flex flex-col"
          *ngFor="let d of filteredDoctors()" (click)="openDoctor(d)">
          
          <!-- Rating Badge -->
          <div class="absolute top-3 right-3 text-xs font-bold bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 border border-white/10 shadow-sm z-10" *ngIf="ratings[d.id] as r">
             <i class="fa-solid fa-star text-yellow-400 text-[10px]"></i>
             <span class="text-gray-200">{{ r.avg.toFixed(1) }}</span>
             <span class="text-gray-500 text-[10px]">({{ r.count }})</span>
          </div>

          <div class="flex items-start gap-4 mb-4">
             <div class="relative shrink-0">
                <div class="w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-700 group-hover:ring-blue-500 transition-colors bg-gray-800 flex items-center justify-center">
                  <img *ngIf="d.profileImageUrl" [src]="d.profileImageUrl" class="w-full h-full object-cover" (error)="d.profileImageUrl = ''" />
                  <span *ngIf="!d.profileImageUrl" class="text-xl font-bold text-gray-400">{{ doctorInitial(d) }}</span>
                </div>
                <div class="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900" *ngIf="d.isVerified" title="Verified">
                    <i class="fa-solid fa-check"></i>
                </div>
             </div>
             
             <div class="min-w-0 flex-1 pt-1">
                <h3 class="font-bold text-lg text-gray-100 truncate group-hover:text-blue-400 transition-colors">{{ formatDoctorName(d) }}</h3>
                <div class="text-sm text-blue-400 font-medium truncate mb-0.5">{{ d.specialization || 'General Practitioner' }}</div>
                <div class="text-xs text-gray-500 truncate" *ngIf="d.gender"><span class="capitalize">{{ d.gender }}</span> Doctor</div>
             </div>
          </div>

          <!-- Info Rows -->
          <div class="space-y-2 mb-5 flex-1">
             <div class="flex items-center gap-2 text-sm text-gray-400" *ngIf="d.consultationFees">
                <div class="w-6 flex justify-center"><i class="fa-solid fa-money-bill-wave text-green-500/70"></i></div>
                <span>Rs. {{ d.consultationFees }} / Visit</span>
             </div>
             <div class="flex items-center gap-2 text-sm text-gray-400" *ngIf="d.address">
                <div class="w-6 flex justify-center"><i class="fa-solid fa-location-dot text-red-400/70"></i></div>
                <span class="truncate">{{ d.address }}</span>
             </div>
          </div>

          <div class="mt-auto pt-4 border-t border-gray-800">
             <button class="btn-primary w-full shadow-lg shadow-blue-900/20 group-hover:shadow-blue-500/20 transition-all" (click)="goToDoctorAndBook(d); $event.stopPropagation()">
                Book Appointment
             </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Emergency Appointment Modal -->
    <app-emergency-appointment-modal
      [isOpen]="showEmergencyModal"
      [availableDoctors]="doctors"
      (closeModal)="closeEmergencyModal()"
      (appointmentBooked)="onEmergencyAppointmentBooked($event)"
    ></app-emergency-appointment-modal>
    </app-patient-layout>
  `,
})
export class PatientBookAppointmentComponent {
  specializationFilter = '';
  nameFilter = '';
  genderFilter = '';
  addressFilter = '';
  loadingDoctors = false;
  showEmergencyModal = false;

  doctors: Doctor[] = [];
  ratings: Record<number, { avg: number; count: number }> = {};


  constructor(
    private doctorApi: DoctorService,
    private router: Router,
  ) {
    this.refreshDoctors();
  }

  refreshDoctors() {
    this.loadingDoctors = true;
    this.doctorApi.getAllForPatients().subscribe({
      next: (res) => {
        const active = (res || []).filter((d) => d.isActive !== false);
        this.doctors = active;
        this.loadingDoctors = false;
        // Populate ratings from in-line data
        this.doctors.forEach((d) => {
          this.ratings[d.id] = { avg: d.averageRating || 0, count: d.reviewCount || 0 };
        });
      },
      error: () => (this.loadingDoctors = false),
    });
  }

  filteredDoctors() {
    const spec = (this.specializationFilter || '').toLowerCase().trim();
    const name = (this.nameFilter || '').toLowerCase().trim();
    const gender = (this.genderFilter || '').trim();
    const addr = (this.addressFilter || '').toLowerCase().trim();
    return this.doctors.filter((d) => {
      const dName = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).toLowerCase();
      const dSpec = (d.specialization || '').toLowerCase();
      const dGenderMatch = !gender || (d.gender || '').toLowerCase() === gender.toLowerCase();
      const dAddr = (d.address || '').toLowerCase();
      return dSpec.includes(spec) && dName.includes(name) && dGenderMatch && dAddr.includes(addr);
    });
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
  }

  onEmergencyAppointmentBooked(appointment: any) {
    console.log('Emergency appointment booked:', appointment);

    // Navigate to appointments page to show the newly booked appointment
    this.router.navigate(['/patient/appointments']);
  }
}
