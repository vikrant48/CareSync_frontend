import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientAppointmentItem } from '../core/services/appointment.service';

@Component({
  standalone: true,
  selector: 'patient-appointment-card',
  imports: [CommonModule],
  template: `
    <div class="panel rounded-2xl p-4 sm:p-5 transition hover:shadow-md hover:ring-1 hover:ring-blue-600/30" [class.opacity-70]="disabled">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-800 to-blue-600 text-white flex items-center justify-center font-semibold shrink-0">
            {{ (appointment.doctorName || 'D') | slice:0:1 }}
          </div>
          <div class="min-w-0">
            <p class="font-semibold leading-tight truncate text-gray-100">{{ appointment.doctorName }}</p>
            <p class="text-xs text-gray-400 flex items-center gap-1">
              <i class="fa-regular fa-clock"></i>
              <span>{{ appointment.appointmentDate }} · {{ appointment.appointmentTime }}</span>
            </p>
            <p class="text-xs sm:text-sm text-gray-300 truncate" *ngIf="appointment.doctorSpecialization">{{ appointment.doctorSpecialization }}</p>
            <p class="text-xs sm:text-sm mt-2 text-gray-300 break-words" *ngIf="appointment.reason">Notes: {{ appointment.reason }}</p>
          </div>
        </div>
        <span class="px-2 py-1 rounded text-xs font-semibold tracking-wide" [ngClass]="statusClass(appointment.status)">{{ statusLabel(appointment) }}</span>
      </div>

      <div class="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
        <div class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-row" *ngIf="canPatientReschedule(appointment)">
          <button class="btn-secondary w-full sm:w-auto" (click)="onReschedule()" [disabled]="disabled">Reschedule</button>
          <button class="btn-danger w-full sm:w-auto" (click)="onCancel()" [disabled]="!canPatientCancel(appointment) || disabled">Cancel</button>
        </div>
        <button class="btn-primary w-full sm:w-auto" (click)="onViewDoctor()" [disabled]="disabled">
          <i class="fa-regular fa-user-doctor mr-2"></i>
          View Doctor Details
        </button>
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
      'bg-blue-900/40 text-blue-300': s === 'CONFIRMED',
      'bg-green-900/40 text-green-300': s === 'COMPLETED',
      'bg-red-900/40 text-red-300': s === 'CANCELLED',
      'bg-yellow-900/40 text-yellow-300': s === 'BOOKED',
      'bg-purple-900/40 text-purple-300': s === 'SCHEDULED',
      'bg-orange-900/40 text-orange-300': s === 'RESCHEDULED',
      'bg-gray-700 text-gray-300': !s,
    } as any;
  }

  statusLabel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    if (s === 'CANCELLED') {
      const by = (a.statusChangedBy || '').toLowerCase();
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
