import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, PatientAppointmentItem } from '../core/services/appointment.service';
import { Doctor } from '../core/services/doctor.service';

@Component({
  selector: 'reschedule-appointment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="appointment" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="panel rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-700/50">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
               <i class="fa-regular fa-calendar-check text-xl"></i>
             </div>
             <div class="text-lg font-bold text-gray-100">Reschedule Appointment</div>
          </div>
          <button class="text-gray-400 hover:text-white transition-colors p-1" (click)="onClose()">
             <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="bg-gray-800/50 rounded-lg p-3 text-sm flex items-start gap-3 border border-gray-700/50">
             <i class="fa-solid fa-user-doctor text-blue-400 mt-0.5"></i>
             <div>
                <span class="text-gray-400 block text-xs uppercase tracking-wider">With Doctor</span>
                <span class="font-semibold text-gray-200">{{ appointment!.doctorName }}</span>
             </div>
          </div>

          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-gray-300 ml-1">Select New Date</span>
            <input type="date" class="input w-full bg-gray-900/50" [(ngModel)]="rescheduleDateISO" (change)="loadSlotsForDate()" />
          </label>
          
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-gray-300 ml-1">Available Slots</span>
            <select class="input w-full bg-gray-900/50" [(ngModel)]="rescheduleTimeSlot" [disabled]="!rescheduleDateISO">
              <option [ngValue]="null">-- Select time --</option>
              <option *ngFor="let s of availableSlots" [value]="s">{{ s }}</option>
            </select>
          </label>

          <div class="pt-4 flex items-center gap-3">
            <button class="btn-secondary flex-1" (click)="onClose()">Cancel</button>
            <button class="btn-primary flex-1" [disabled]="!rescheduleDateISO || !rescheduleTimeSlot" (click)="onConfirm()">
               Confirm Change
            </button>
          </div>
          
          <div *ngIf="error" class="p-3 rounded bg-red-900/20 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
             <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RescheduleAppointmentModalComponent {
  @Input() appointment: PatientAppointmentItem | null = null;
  @Input() doctors: Doctor[] = [];
  @Input() doctorId?: number;
  @Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<string>(); // ISO datetime string "YYYY-MM-DDTHH:mm:00"

  rescheduleDateISO: string | null = null;
  rescheduleTimeSlot: string | null = null;
  availableSlots: string[] = [];
  error: string | null = null;

  constructor(private apptApi: AppointmentService) { }

  onClose() {
    this.reset();
    this.close.emit();
  }

  onConfirm() {
    if (!this.appointment || !this.rescheduleDateISO || !this.rescheduleTimeSlot) return;
    const iso = `${this.rescheduleDateISO}T${this.rescheduleTimeSlot}:00`;
    this.reset();
    this.confirmed.emit(iso);
  }

  loadSlotsForDate() {
    this.availableSlots = [];
    this.error = null;
    const date = this.rescheduleDateISO;
    if (!date || !this.appointment) return;
    const did = this.resolveDoctorId();
    if (did == null) {
      this.error = 'Unable to resolve doctor for slots';
      return;
    }
    this.apptApi.getAvailableSlots(did, date).subscribe({
      next: (slots) => (this.availableSlots = slots || []),
      error: () => (this.error = 'Unable to load slots'),
    });
  }

  private resolveDoctorId(): number | null {
    if (typeof this.doctorId === 'number') return this.doctorId;
    const name = this.appointment?.doctorName;
    if (!name) return null;
    const match = this.doctors.find((d) => {
      const display = d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim();
      return display === name;
    });
    return match?.id ?? null;
  }

  private reset() {
    this.rescheduleDateISO = null;
    this.rescheduleTimeSlot = null;
    this.availableSlots = [];
    this.error = null;
  }
}