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
      class="group relative bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 h-full flex flex-col"
      [class.opacity-60]="disabled || appointment.isActive === false"
      [class.pointer-events-none]="disabled"
    >
      <!-- Header: Patient Info & Status -->
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="relative w-12 h-12 shrink-0">
             <img *ngIf="appointment.patientProfileImageUrl; else initials"
                  [src]="appointment.patientProfileImageUrl"
                  alt="{{appointment.patientName}}"
                  class="w-full h-full rounded-full object-cover shadow-lg shadow-blue-500/20 ring-2 ring-white dark:ring-gray-700"
             />
             <ng-template #initials>
                <div class="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
                  {{ (appointment.patientName || 'P') | slice:0:1 }}
                </div>
             </ng-template>
          </div>
          <div class="min-w-0">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 truncate text-base leading-tight">{{ appointment.patientName }}</h3>
            <div class="flex items-center gap-2 mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
               <span class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-md">
                 <i class="fa-regular fa-calendar"></i>
                 {{ appointment.appointmentDate }}
               </span>
               <span class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-md">
                 <i class="fa-regular fa-clock"></i>
                 {{ appointment.appointmentTime }}
               </span>
            </div>
          </div>
        </div>
        <span
          class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border"
          [ngClass]="statusBadgeClass(appointment.status)"
        >
          {{ statusLabel(appointment) }}
        </span>
      </div>

      <!-- Content: Reason -->
      <div class="mb-4 flex-1">
         <div class="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
           <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reason for Visit</label>
           <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2" [title]="appointment.reason || 'No reason provided'">
             {{ appointment.reason || 'No specific reason provided.' }}
           </p>
         </div>
      </div>

      <!-- Actions Footer -->
      <div class="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto grid grid-cols-1 gap-2">
        <!-- Primary Actions based on Status -->
         
        <!-- BOOKED -->
        <div class="grid grid-cols-2 gap-2" *ngIf="appointment.status === 'BOOKED'">
          <button class="btn-action btn-check" (click)="onSchedule()" [disabled]="disabled">
            <i class="fa-solid fa-calendar-check"></i> Accept
          </button>
          <button class="btn-action btn-danger" (click)="onCancel()" [disabled]="disabled">
            <i class="fa-solid fa-xmark"></i> Decline
          </button>
        </div>

        <!-- SCHEDULED -->
        <div class="grid grid-cols-2 gap-2" *ngIf="appointment.status === 'SCHEDULED'">
          <button class="btn-action btn-check" (click)="onConfirm()" [disabled]="disabled">
             <i class="fa-solid fa-check-double"></i> Confirm
          </button>
          <button class="btn-action btn-danger" (click)="onCancel()" [disabled]="disabled">
             <i class="fa-solid fa-ban"></i> Cancel
          </button>
        </div>

        <!-- CONFIRMED -->
        <div *ngIf="appointment.status === 'CONFIRMED'">
          <button class="btn-action btn-primary w-full" (click)="onStart()" [disabled]="disabled">
             <i class="fa-solid fa-stethoscope"></i> Start Consultation
          </button>
        </div>

         <div class="space-y-2" *ngIf="appointment.status === 'IN_PROGRESS'">
          <button class="btn-action btn-primary w-full py-3 shadow-indigo-500/20" (click)="onCreateMedicalDescription()" [disabled]="disabled || appointment.isActive === false">
            <i class="fa-solid fa-file-signature text-lg"></i>
            <span class="text-base font-bold">{{ hasMedicalRecord ? 'Edit' : 'Add' }} Medical Record</span>
          </button>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn-action bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20" (click)="onJoinVideo()" [disabled]="disabled || appointment.isActive === false">
               <i class="fa-solid fa-video"></i> Join Video
            </button>
            <button class="btn-action btn-success" (click)="onComplete()" [disabled]="disabled || appointment.isActive === false">
               <i class="fa-solid fa-check-circle"></i> Complete
            </button>
          </div>
        </div>

        <!-- COMPLETED: Show Read-Only Medical Record Button or No Record Label -->
        <div *ngIf="appointment.status === 'COMPLETED'">
           <div *ngIf="hasMedicalRecord; else noRecord" class="mb-2">
              <button class="btn-action btn-secondary w-full py-3 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400" (click)="onCreateMedicalDescription()" [disabled]="disabled">
                <i class="fa-solid fa-eye text-lg"></i>
                <span class="text-base font-bold">See Medical Record</span>
              </button>
           </div>
           <ng-template #noRecord>
              <div class="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 mb-2">
                 <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">No Medical Record</span>
              </div>
           </ng-template>
        </div>

        <!-- COMPLETED/CANCELLED -> View Details Only -->
        <button class="btn-action btn-secondary w-full" (click)="onViewPatient()" [disabled]="disabled">
          <i class="fa-regular fa-id-card"></i> View Patient Details
        </button>
      </div>
    </div>
  `,
  styles: [`
    .btn-action {
      @apply flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
    }
    .btn-primary {
      @apply bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40;
    }
    .btn-secondary {
      @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300;
    }
    .btn-danger {
      @apply bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20;
    }
    .btn-check {
      @apply bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/20;
    }
    .btn-success {
      @apply bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20;
    }
  `]
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
  @Output() joinVideo = new EventEmitter<DoctorAppointmentItem>();
  @Output() statusChange = new EventEmitter<{ appointment: DoctorAppointmentItem; status: string }>();

  onViewPatient() { this.viewPatient.emit(this.appointment); }
  onCreateMedicalDescription() { this.openHistoryForm.emit(this.appointment); }
  onSchedule() { this.schedule.emit(this.appointment); }
  onConfirm() { this.confirm.emit(this.appointment); }
  onStart() { this.start.emit(this.appointment); }
  onComplete() { this.complete.emit(this.appointment); }
  onCancel() { this.cancel.emit(this.appointment); }
  onJoinVideo() { this.joinVideo.emit(this.appointment); }
  changeStatus(appointment: DoctorAppointmentItem, status: string) { this.statusChange.emit({ appointment, status }); }

  statusBadgeClass(status: string) {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    if (s === 'COMPLETED') return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    if (s.startsWith('CANCELLED')) return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    if (s === 'IN_PROGRESS') return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    if (s === 'SCHEDULED') return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }

  statusLabel(a: DoctorAppointmentItem) {
    if (a.status === 'CANCELLED_BY_DOCTOR') return 'Cancelled by Me';
    if (a.status === 'CANCELLED_BY_PATIENT') return 'Cancelled by Patient';
    if (a.status === 'CANCELLED') return 'Cancelled';
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

  get hasMedicalRecord(): boolean {
    if (!this.appointment.medicalHistory) return false;

    // Primary check: Direct appointment link
    const hasExplicitLink = this.appointment.medicalHistory.some(m =>
      m.appointmentId === this.appointment.appointmentId
    );
    if (hasExplicitLink) return true;

    // Fallback check: Matching date (for legacy or unsynced records)
    const appointmentDate = this.appointment.appointmentDate;
    return this.appointment.medicalHistory.some(m =>
      m.visitDate === appointmentDate
    );
  }
}
