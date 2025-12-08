import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DoctorAppointmentCardComponent } from '../../shared/doctor-appointment-card.component';
import { getDoctorAppointmentEpochMs } from '../../shared/doctor-appointment-utils';
import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { PatientProfileService, PatientDto, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { firstValueFrom } from 'rxjs';

type TimeRange = 'UPCOMING' | 'TODAY' | 'PAST' | 'ALL';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DoctorAppointmentCardComponent, PatientDetailsModalComponent, MedicalHistoryDetailModalComponent, DoctorLayoutComponent],
  template: `
    <app-doctor-layout>
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">All Appointments</h2>
        <button class="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 text-sm font-medium px-0 py-0" (click)="refresh()">Refresh</button>
      </div>

      <!-- Filters -->
      <div class="panel p-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label class="block text-sm">
            <span class="block mb-1">Status</span>
            <select class="input w-full" [(ngModel)]="statusFilter" (change)="onFilterChange()">
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="block mb-1">Search (Patient Name or ID)</span>
            <input type="text" class="input w-full" [(ngModel)]="searchTerm" (input)="onFilterChange()" placeholder="e.g., John or 123" />
          </label>
          <div class="block text-sm">
            <span class="block mb-1">Time Range</span>
            <div class="flex gap-2">
              <button class="btn-secondary" [ngClass]="{ 'btn-primary': range==='TODAY' }" (click)="setRange('TODAY')">Today</button>
              <button class="btn-secondary" [ngClass]="{ 'btn-primary': range==='UPCOMING' }" (click)="setRange('UPCOMING')">Upcoming</button>
              <button class="btn-secondary" [ngClass]="{ 'btn-primary': range==='PAST' }" (click)="setRange('PAST')">Past</button>
              <button class="btn-secondary" [ngClass]="{ 'btn-primary': range==='ALL' }" (click)="setRange('ALL')">All</button>
            </div>
          </div>
        </div>
      </div>

      <!-- List -->
      <div *ngIf="loading" class="text-gray-400">
        <span class="inline-flex items-center gap-2">
          <i class="fa-solid fa-spinner animate-spin"></i>
          <span>Loading appointments…</span>
        </span>
      </div>
      <div *ngIf="!loading && filteredAppointments().length === 0" class="text-gray-400">No appointments found.</div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" *ngIf="!loading">
        <doctor-appointment-card
          *ngFor="let a of filteredAppointments()"
          [appointment]="a"
          [showStatusSelect]="true"
          (viewPatient)="openDetails($event)"
          (openHistoryForm)="openDetails($event)"
          (schedule)="changeStatus($event, 'SCHEDULED')"
          (confirm)="changeStatus($event, 'CONFIRMED')"
          (start)="changeStatus($event, 'IN_PROGRESS')"
          (complete)="changeStatus($event, 'COMPLETED')"
          (cancel)="changeStatus($event, 'CANCELLED')"
          (statusChange)="changeStatus($event.appointment, $event.status)"
        ></doctor-appointment-card>
      </div>

      <!-- Details Modal (Shared) -->
      <app-patient-details-modal
        [open]="detailsOpen"
        [patient]="patient"
        [history]="history"
        (close)="closeDetails()"
        (historyClick)="viewHistoryDetail($event)"
      ></app-patient-details-modal>

      <!-- History Detail Modal (Shared) -->
      <app-medical-history-detail-modal
        [open]="historyDetailModalOpen"
        [detail]="selectedHistoryDetail"
        [doctorInfo]="selectedHistoryDoctorInfo"
        (close)="closeHistoryDetail()"
      ></app-medical-history-detail-modal>
    </div>
    </app-doctor-layout>
  `,
  styles: [`
    .panel { border: 1px solid #1f2937; border-radius: 0.5rem; background: rgba(17,24,39,0.6); }
    .badge { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; }
    .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #111827; border: 1px solid #1f2937; border-radius: 0.5rem; width: 90%; max-width: 800px; }
  `]
})
export class DoctorAppointmentsComponent {
  loading = false;
  appointments: DoctorAppointmentItem[] = [];
  statusFilter: 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' = 'ALL';
  range: TimeRange = 'UPCOMING';
  searchTerm = '';

  // Modal state
  detailsOpen = false;
  patient: PatientDto | null = null;
  history: MedicalHistoryWithDoctorItem[] = [];
  selectedAppointment: DoctorAppointmentItem | null = null;

  // History detail modal state
  historyDetailModalOpen = false;
  selectedHistoryDetail: any | null = null;
  selectedHistoryDoctorInfo: { doctorName: string; doctorSpecialization?: string; doctorContactInfo?: string } | null = null;

  constructor(private appts: AppointmentService, private patients: PatientProfileService) {
    this.refresh();
  }

  refresh() {
    this.loadAppointments();
  }

  setRange(r: TimeRange) {
    this.range = r;
    this.loadAppointments();
  }

  onFilterChange() {
    this.loadAppointments();
  }

  private loadAppointments() {
    this.loading = true;
    const now = Date.now();

    // If a specific status is selected, hit status endpoint first, then filter by range
    const fetchByStatus = async () => {
      try {
        const statuses = this.statusFilter === 'PENDING' ? ['BOOKED', 'SCHEDULED'] : [this.statusFilter];
        const arrays = await Promise.all(statuses.map((s) => firstValueFrom(this.appts.getDoctorAppointmentsByStatus(s))));
        const merged = ([] as DoctorAppointmentItem[]).concat(...arrays);
        const dedup = this.dedupById(merged);
        this.applyRangeFilterAndSet(dedup, now);
      } catch (e) {
        this.appointments = [];
        this.loading = false;
      }
    };

    if (this.statusFilter !== 'ALL') {
      fetchByStatus();
      return;
    }

    // Fetch based on range
    let obs;
    switch (this.range) {
      case 'TODAY':
        obs = this.appts.getDoctorTodayAppointments();
        break;
      case 'UPCOMING':
        obs = this.appts.getDoctorUpcomingAppointments();
        break;
      case 'PAST':
        obs = this.appts.getDoctorAllAppointments();
        break;
      case 'ALL':
      default:
        obs = this.appts.getDoctorAllAppointments();
        break;
    }

    obs.subscribe({
      next: (items) => {
        const list = this.range === 'PAST' ? items.filter((a) => getDoctorAppointmentEpochMs(a) < now) : items;
        this.appointments = this.sortByNearestUpcoming(list);
        this.loading = false;
      },
      error: () => {
        this.appointments = [];
        this.loading = false;
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

  openDetails(a: DoctorAppointmentItem) {
    this.selectedAppointment = a;
    this.detailsOpen = true;
    this.patient = null;
    this.history = [];
    this.patients.getCompleteData(a.patientId).subscribe({
      next: (resp) => {
        this.patient = resp?.patient ?? null;
        this.history = (resp?.medicalHistory as any) || [];
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
    return items.slice().sort((x, y) => getDoctorAppointmentEpochMs(x) - getDoctorAppointmentEpochMs(y));
  }
}
