import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientAppointmentItem } from '../core/services/appointment.service';

@Component({
  standalone: true,
  selector: 'patient-appointment-card',
  imports: [CommonModule],
  template: `
    <div class="panel rounded-xl p-4 hover:shadow-md transition" [class.opacity-70]="disabled">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div class="min-w-0">
          <div class="text-xs sm:text-sm text-gray-300">{{ appointment.appointmentDate }} at {{ appointment.appointmentTime }}</div>
          <div class="mt-1 font-semibold truncate">{{ appointment.doctorName }}</div>
          <div class="text-xs sm:text-sm text-gray-300 truncate">{{ appointment.doctorSpecialization || 'General' }}</div>
          <div class="text-xs sm:text-sm mt-2 text-gray-300 break-words" *ngIf="appointment.reason">Notes: {{ appointment.reason }}</div>
        </div>
        <span class="px-2 py-1 text-xs rounded-full sm:self-auto self-start sm:mt-0 mt-2" [ngClass]="statusClass(appointment.status)">{{ statusLabel(appointment) }}</span>
      </div>
      <div class="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
        <button class="btn-secondary w-full sm:w-auto" (click)="onReschedule()" [disabled]="!canPatientReschedule(appointment) || disabled">Reschedule</button>
        <button class="btn-danger w-full sm:w-auto" (click)="onCancel()" [disabled]="!canPatientCancel(appointment) || disabled">Cancel</button>
        <button class="btn-primary w-full sm:w-auto" (click)="onViewDoctor()" [disabled]="disabled">View Doctor Details</button>
      </div>
    </div>
  `,
})
export class PatientAppointmentCardComponent {
  @Input() appointment!: PatientAppointmentItem;
  @Input() disabled = false;

  @Output() reschedule = new EventEmitter<PatientAppointmentItem>();
  @Output() cancel = new EventEmitter<PatientAppointmentItem>();
  @Output() viewDoctor = new EventEmitter<PatientAppointmentItem>();

  onReschedule() { this.reschedule.emit(this.appointment); }
  onCancel() { this.cancel.emit(this.appointment); }
  onViewDoctor() { this.viewDoctor.emit(this.appointment); }

  statusClass(status: string) {
    const s = (status || '').toUpperCase();
    return {
      'bg-green-700 text-white': s === 'CONFIRMED' || s === 'COMPLETED',
      'bg-yellow-700 text-white': s === 'BOOKED' || s === 'SCHEDULED',
      'bg-red-700 text-white': s === 'CANCELLED',
      'bg-gray-700 text-white': !s,
    } as any;
  }

  statusLabel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    if (s === 'CANCELLED') {
      const by = (a.statusChangedBy || '').toLowerCase();
      // We don't have current username here; show generic mapping
      return by === 'patient' ? 'CANCELLED_BY_PATIENT' : (by ? 'CANCELLED_BY_DOCTOR' : 'CANCELLED');
    }
    return s;
  }

  canPatientReschedule(a: PatientAppointmentItem) {
    return (a.status || '').toUpperCase() === 'BOOKED';
  }

  canPatientCancel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'CONFIRMED';
  }
}