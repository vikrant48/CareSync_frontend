import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';

@Component({
  selector: 'app-patient-book-appointment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent],
  template: `
    <app-patient-layout>
    <div class="panel p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Book Appointment</h2>
        <button class="btn-secondary" (click)="refreshDoctors()">Refresh</button>
      </div>

      <div class="flex gap-3">
        <input
          type="text"
          class="input flex-1"
          placeholder="Filter by specialization (e.g., Cardiology)"
          [(ngModel)]="specializationFilter"
        />
        <input
          type="text"
          class="input flex-1"
          placeholder="Search by doctor name"
          [(ngModel)]="nameFilter"
        />
      </div>

      <div *ngIf="loadingDoctors" class="text-gray-400">Loading doctors...</div>
      <div *ngIf="!loadingDoctors && filteredDoctors().length === 0" class="text-gray-400">
        No doctors match your filters.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          class="panel p-4 hover:shadow cursor-pointer"
          *ngFor="let d of filteredDoctors()"
          (click)="openDoctor(d)"
        >
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
              {{ (d.name || (d.firstName + ' ' + d.lastName))?.charAt(0) }}
            </div>
            <div>
              <div class="font-semibold">{{ d.name || (d.firstName + ' ' + d.lastName) }}</div>
              <div class="text-sm text-gray-400">{{ d.specialization || 'General' }}</div>
            </div>
          </div>
          <div class="text-sm" *ngIf="ratings[d.id] as r">
            {{ r.avg.toFixed(1) }} ★ based on {{ r.count }} patients
          </div>
        </div>
      </div>
    </div>
    </app-patient-layout>
  `,
})
export class PatientBookAppointmentComponent {
  specializationFilter = '';
  nameFilter = '';
  loadingDoctors = false;

  doctors: Doctor[] = [];
  ratings: Record<number, { avg: number; count: number }> = {};

  constructor(private doctorApi: DoctorService, private router: Router) {
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
    return this.doctors.filter((d) => {
      const dName = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).toLowerCase();
      const dSpec = (d.specialization || '').toLowerCase();
      return dSpec.includes(spec) && dName.includes(name);
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
}