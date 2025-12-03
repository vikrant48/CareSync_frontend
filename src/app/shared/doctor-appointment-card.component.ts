import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorAppointmentItem } from '../core/services/appointment.service';

@Component({
  standalone: true,
  selector: 'doctor-appointment-card',
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="border border-gray-800 rounded-xl bg-gray-900/60 hover:bg-gray-900 transition p-4 sm:p-5 shadow-sm"
      [class.opacity-70]="disabled"
    >
      <!-- Card Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-900/40 flex items-center justify-center text-blue-300 font-semibold shrink-0">
            {{ (appointment.patientName || 'P') | slice:0:1 }}
          </div>
          <div class="min-w-0">
            <p class="font-medium leading-tight truncate">{{ appointment.patientName }}</p>
            <p class="text-xs text-gray-400">{{ appointment.appointmentTime }}</p>
          </div>
        </div>
        <span
          class="px-2 py-1 rounded text-xs font-medium self-start sm:self-auto"
          [ngClass]="statusBadgeClass(appointment.status)"
        >
          {{ statusLabel(appointment) }}
        </span>
      </div>

      <!-- Card Body -->
      <div class="mt-3 space-y-2">
        <div class="text-xs sm:text-sm text-gray-300 truncate" *ngIf="appointment.reason" [title]="appointment.reason">
          Reason: {{ appointment.reason }}
        </div>
      </div>

      <!-- Card Actions -->
      <div class="mt-3 flex flex-col sm:flex-row flex-wrap gap-2">
        <button class="btn-primary w-full sm:w-auto" (click)="onViewPatient()" [disabled]="disabled">View Patient Details</button>
        <button class="btn-secondary w-full sm:w-auto" *ngIf="appointment.status === 'IN_PROGRESS'" (click)="onCreateMedicalDescription()" [disabled]="disabled">Create Medical Description</button>
        <button class="btn-secondary w-full sm:w-auto" *ngIf="appointment.status === 'BOOKED'" (click)="onSchedule()" [disabled]="disabled">Schedule</button>
        <button class="btn-secondary w-full sm:w-auto" *ngIf="appointment.status === 'SCHEDULED'" (click)="onConfirm()" [disabled]="disabled">Confirm</button>
        <button class="btn-secondary w-full sm:w-auto" *ngIf="appointment.status === 'CONFIRMED'" (click)="onStart()" [disabled]="disabled">Start</button>
        <button class="btn-secondary w-full sm:w-auto" *ngIf="appointment.status === 'IN_PROGRESS'" (click)="onComplete()" [disabled]="disabled">Complete</button>
        <button class="btn-secondary w-full sm:w-auto" *ngIf="appointment.status === 'BOOKED' || appointment.status === 'SCHEDULED'" (click)="onCancel()" [disabled]="disabled">Cancel</button>
      </div>
    </div>
  `,
})
export class DoctorAppointmentCardComponent {
  @Input() appointment!: DoctorAppointmentItem;
  @Input() disabled = false;
  @Input() showStatusSelect = true;

  @Output() viewPatient = new EventEmitter<DoctorAppointmentItem>();
  @Output() openHistoryForm = new EventEmitter<DoctorAppointmentItem>();
  @Output() schedule = new EventEmitter<DoctorAppointmentItem>();
  @Output() confirm = new EventEmitter<DoctorAppointmentItem>();
  @Output() start = new EventEmitter<DoctorAppointmentItem>();
  @Output() complete = new EventEmitter<DoctorAppointmentItem>();
  @Output() cancel = new EventEmitter<DoctorAppointmentItem>();
  @Output() statusChange = new EventEmitter<{ appointment: DoctorAppointmentItem; status: string }>();

  onViewPatient() { this.viewPatient.emit(this.appointment); }
  onCreateMedicalDescription() { this.openHistoryForm.emit(this.appointment); }
  onSchedule() { this.schedule.emit(this.appointment); }
  onConfirm() { this.confirm.emit(this.appointment); }
  onStart() { this.start.emit(this.appointment); }
  onComplete() { this.complete.emit(this.appointment); }
  onCancel() { this.cancel.emit(this.appointment); }
  changeStatus(appointment: DoctorAppointmentItem, status: string) { this.statusChange.emit({ appointment, status }); }

  statusBadgeClass(status: string) {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') return 'bg-blue-900/40 text-blue-300';
    if (s === 'COMPLETED') return 'bg-green-900/40 text-green-300';
    if (s === 'CANCELLED') return 'bg-red-900/40 text-red-300';
    if (s === 'IN_PROGRESS') return 'bg-yellow-900/40 text-yellow-300';
    if (s === 'SCHEDULED') return 'bg-purple-900/40 text-purple-300';
    return 'bg-gray-700 text-gray-300';
  }

  statusLabel(a: DoctorAppointmentItem) {
    if (a.status === 'CANCELLED') {
      if (a.statusChangedBy === 'DOCTOR') return 'CANCELLED_BY_DOCTOR';
      if (a.statusChangedBy === 'PATIENT') return 'CANCELLED_BY_PATIENT';
      return 'CANCELLED';
    }
    return a.status;
  }

  statusOptionsFor(a: DoctorAppointmentItem) {
    const s = a.status;
    if (s === 'BOOKED') return ['SCHEDULED', 'CANCELLED'];
    if (s === 'SCHEDULED') return ['CONFIRMED', 'CANCELLED'];
    if (s === 'CONFIRMED') return ['IN_PROGRESS'];
    if (s === 'IN_PROGRESS') return ['COMPLETED'];
    return [];
  }
}