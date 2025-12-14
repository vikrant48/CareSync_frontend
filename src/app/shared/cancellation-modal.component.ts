import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientAppointmentItem } from '../core/services/appointment.service';

@Component({
    selector: 'app-cancellation-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="appointment" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="panel rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-700/50">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mx-auto mb-4">
            <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-100 mb-2">Cancel Appointment?</h3>
          <p class="text-gray-400 text-sm">
            Are you sure you want to cancel your appointment with <span class="text-gray-200 font-semibold">{{ appointment.doctorName }}</span>?
          </p>
        </div>

        <div class="space-y-3">
          <button class="w-full btn-primary bg-red-600 hover:bg-red-700 border-red-500 text-white shadow-lg shadow-red-900/20" (click)="onConfirm()">
            Yes, Cancel Appointment
          </button>
          
          <button class="w-full btn-secondary bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-blue-500/30" (click)="onReschedule()">
            No, Reschedule Instead
          </button>
          
          <button class="w-full btn-secondary" (click)="onClose()">
            Keep Appointment
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class CancellationModalComponent {
    @Input() appointment: PatientAppointmentItem | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() confirmCancel = new EventEmitter<void>();
    @Output() requestReschedule = new EventEmitter<void>();

    onClose() { this.close.emit(); }
    onConfirm() { this.confirmCancel.emit(); }
    onReschedule() { this.requestReschedule.emit(); }
}
