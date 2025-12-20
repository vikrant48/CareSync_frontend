import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientAppointmentItem } from '../core/services/appointment.service';

@Component({
  standalone: true,
  selector: 'patient-appointment-card',
  imports: [CommonModule],
  template: `
    <div class="panel rounded-xl p-4 sm:p-5 transition hover:shadow-lg border border-gray-800 hover:border-blue-500/30 group" [class.opacity-60]="appointment.isActive === false">
      <div class="flex flex-col gap-4">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
             <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center font-bold text-blue-400 text-lg ring-2 ring-gray-700/50 group-hover:ring-blue-500/50 transition-all overflow-hidden relative">
               <img *ngIf="appointment.doctorProfileImageUrl" [src]="appointment.doctorProfileImageUrl" class="w-full h-full object-cover" alt="Doctor Profile">
               <span *ngIf="!appointment.doctorProfileImageUrl">{{ (appointment.doctorName || 'D') | slice:0:1 }}</span>
            </div>
            <div class="min-w-0">
              <h4 class="font-bold text-gray-100 truncate text-base leading-tight">
                {{ appointment.doctorName }}
                <i *ngIf="appointment.doctorIsVerified" class="fa-solid fa-circle-check text-blue-500 text-xs ml-1" title="Verified"></i>
              </h4>
              <p class="text-sm text-gray-400 truncate">{{ appointment.doctorSpecialization }}</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border" [ngClass]="statusClass(appointment.status)">
            {{ statusLabel(appointment) }}
          </span>
        </div>

        <!-- Details -->
        <div class="bg-gray-900/50 rounded-lg p-3 space-y-2 border border-gray-800/50">
           <div class="flex items-center gap-2 text-sm text-gray-300">
             <i class="fa-regular fa-calendar text-blue-400 w-4"></i>
             <span>{{ appointment.appointmentDate | date:'mediumDate' }}</span>
           </div>
           <div class="flex items-center gap-2 text-sm text-gray-300">
             <i class="fa-regular fa-clock text-blue-400 w-4"></i>
             <span>{{ appointment.appointmentTime }}</span>
           </div>
           <div class="flex items-start gap-2 text-sm text-gray-300" *ngIf="appointment.reason">
             <i class="fa-regular fa-note-sticky text-gray-500 w-4 mt-0.5"></i>
             <span class="italic text-gray-400 text-xs">{{ appointment.reason }}</span>
           </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
            <div class="flex flex-col gap-2 w-full" *ngIf="canJoinVideo(appointment)">
               <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 text-sm transition-all active:scale-95 flex items-center justify-center gap-2" (click)="onJoinVideo()" [disabled]="disabled || appointment.isActive === false">
                  <i class="fa-solid fa-video animate-pulse"></i> Join Video Call
               </button>
            </div>
           <button class="btn-primary flex-1 text-sm py-2" (click)="onViewDoctor()" [disabled]="disabled">
             Profile
           </button>
           <ng-container *ngIf="canPatientReschedule(appointment)">
             <button class="btn-secondary flex-1 text-sm py-2" (click)="onReschedule()" [disabled]="disabled || appointment.isActive === false">Reschedule</button>
             <button class="px-3 py-2 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-900/20 text-sm transition-colors" (click)="onCancel()" [disabled]="!canPatientCancel(appointment) || disabled || appointment.isActive === false" title="Cancel">
               <i class="fa-solid fa-ban"></i>
             </button>
           </ng-container>
        </div>
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
  @Output() joinVideo = new EventEmitter<PatientAppointmentItem>();

  onReschedule() { this.reschedule.emit(this.appointment); }
  onCancel() { this.cancel.emit(this.appointment); }
  onViewDoctor() { this.viewDoctor.emit(this.appointment); }
  onJoinVideo() { this.joinVideo.emit(this.appointment); }

  statusClass(status: string) {
    const s = (status || '').toUpperCase();
    return {
      'bg-blue-500/10 text-blue-400 border-blue-500/20': s === 'CONFIRMED',
      'bg-green-500/10 text-green-400 border-green-500/20': s === 'COMPLETED',
      'bg-red-500/10 text-red-400 border-red-500/20': s.startsWith('CANCELLED'),
      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': s === 'BOOKED',
      'bg-purple-500/10 text-purple-400 border-purple-500/20': s === 'SCHEDULED',
      'bg-orange-500/10 text-orange-400 border-orange-500/20': s === 'RESCHEDULED',
      'bg-gray-700 text-gray-300': !s,
    } as any;
  }

  statusLabel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    if (s === 'CANCELLED_BY_PATIENT') return 'Cancelled by Me';
    if (s === 'CANCELLED_BY_DOCTOR') return 'Cancelled by Doctor';
    if (s === 'CANCELLED') return 'Cancelled';
    return s;
  }

  canPatientReschedule(a: PatientAppointmentItem) {
    return (a.status || '').toUpperCase() === 'BOOKED';
  }

  canPatientCancel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'CONFIRMED';
  }

  canJoinVideo(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'CONFIRMED' || s === 'IN_PROGRESS';
  }
}
