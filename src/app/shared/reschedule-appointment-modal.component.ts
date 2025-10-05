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
    <div *ngIf="appointment" class="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div class="panel rounded-xl shadow-xl w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="text-lg font-semibold">Reschedule Appointment</div>
          <button class="text-gray-300 hover:text-gray-200" (click)="onClose()">✕</button>
        </div>
        <div class="space-y-3">
          <div class="text-sm">Doctor: <span class="font-medium">{{ appointment!.doctorName }}</span></div>
          <label class="block text-sm">Select date
            <input type="date" class="input w-full" [(ngModel)]="rescheduleDateISO" (change)="loadSlotsForDate()" />
          </label>
          <label class="block text-sm">Available slots
            <select class="input w-full" [(ngModel)]="rescheduleTimeSlot">
              <option [ngValue]="null">-- Select time --</option>
              <option *ngFor="let s of availableSlots" [value]="s">{{ s }}</option>
            </select>
          </label>
          <div class="flex items-center gap-2">
            <button class="btn-primary" [disabled]="!rescheduleDateISO || !rescheduleTimeSlot" (click)="onConfirm()">Confirm</button>
            <button class="btn-secondary" (click)="onClose()">Cancel</button>
          </div>
          <div *ngIf="error" class="text-red-600 text-sm">{{ error }}</div>
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

  constructor(private apptApi: AppointmentService) {}

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