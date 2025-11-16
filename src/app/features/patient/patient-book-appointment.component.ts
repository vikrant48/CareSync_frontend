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
    <div class="panel p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Book Appointment</h2>
        <div class="flex gap-3">
          <button 
            class="btn-primary bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
            (click)="openEmergencyModal()"
          >
            🚨 Emergency Appointment
          </button>
          <button class="btn-secondary" (click)="refreshDoctors()">Refresh</button>
        </div>
      </div>

      <div class="flex gap-3">
        <app-specialization-autocomplete
          class="flex-1"
          [(ngModel)]="specializationFilter"
          placeholder="Filter by specialization (e.g., Cardiology)"
          inputClass="input"
          [allowAddNew]="false">
        </app-specialization-autocomplete>
        <input
          type="text"
          class="input flex-1"
          placeholder="Search by doctor name"
          [(ngModel)]="nameFilter"
        />
        <select
          class="input flex-1"
          [(ngModel)]="genderFilter"
        >
          <option value="">All genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="text"
          class="input flex-1"
          placeholder="Filter by address/location"
          [(ngModel)]="addressFilter"
        />
      </div>

      <!-- Loading State -->
      <section *ngIf="loadingDoctors" class="mt-2">
        <div class="flex items-center justify-center min-h-[180px] text-gray-500">
          <i class="fa-solid fa-spinner fa-spin text-3xl mr-3"></i>
          <span>Loading doctors...</span>
        </div>
      </section>
      <div *ngIf="!loadingDoctors && filteredDoctors().length === 0" class="text-gray-400">
        No doctors match your filters.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          class="panel p-4 hover:shadow cursor-pointer relative"
          *ngFor="let d of filteredDoctors()"
          (click)="openDoctor(d)"
        >
          <div class="absolute top-2 right-2 text-sm bg-gray-800/70 rounded px-2 py-1 flex items-center gap-1" *ngIf="ratings[d.id] as r" (click)="$event.stopPropagation()">
            <span>{{ r.avg.toFixed(1) }}</span>
            <span class="text-yellow-400">★</span>
            <span>({{ r.count }})</span>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-white">
              <img *ngIf="d.profileImageUrl" [src]="d.profileImageUrl" class="w-full h-full object-cover" (error)="d.profileImageUrl = ''" />
              <span *ngIf="!d.profileImageUrl">{{ doctorInitial(d) }}</span>
            </div>
            <div>
              <div class="font-semibold">{{ formatDoctorName(d) }}</div>
              <div class="text-sm text-gray-400">{{ d.specialization || 'General' }}</div>
              <div class="text-xs text-gray-400" *ngIf="d.gender">Gender: {{ d.gender }}</div>
            </div>
          </div>
          <div class="text-sm text-gray-300" *ngIf="d.consultationFees !== undefined && d.consultationFees !== null">
            Consultation Fee: {{ d.consultationFees }}
          </div>
          <div class="text-sm text-gray-300" *ngIf="d.address">Address: {{ d.address }}</div>
          <div class="mt-3">
            <button class="btn-primary" (click)="goToDoctorAndBook(d); $event.stopPropagation()">Book Appointment</button>
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
        this.doctors.forEach((d) => this.loadRating(d));
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

  loadRating(d: Doctor) {
    this.doctorApi.getAverageRating(d.id).subscribe({
      next: (avgResp) => {
        this.doctorApi.getRatingDistribution(d.id).subscribe({
          next: (dist) => {
            const count = Object.values(dist || {}).reduce((acc, n) => acc + (n || 0), 0);
            this.ratings[d.id] = { avg: avgResp?.averageRating ?? 0, count };
          },
        });
      },
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

  onEmergencyAppointmentBooked(appointment: any) {
    console.log('Emergency appointment booked:', appointment);
    
    // Navigate to appointments page to show the newly booked appointment
    this.router.navigate(['/patient/appointments']);
  }
}