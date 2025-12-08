import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../core/services/appointment.service';
import { Doctor } from '../core/services/doctor.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-doctor-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="panel p-6 w-full max-w-xl relative">
        <button class="absolute top-2 right-2 btn-secondary" (click)="close.emit()">Close</button>
        <div class="flex items-center gap-3 mb-4" *ngIf="doctor as doc">
          <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-white">
            <img *ngIf="doc.profileImageUrl" [src]="doc.profileImageUrl" class="w-full h-full object-cover" (error)="doc.profileImageUrl = ''" />
            <span *ngIf="!doc.profileImageUrl">{{ doctorInitial(doc) }}</span>
          </div>
          <div>
            <div class="font-semibold">{{ formatDoctorName(doc) }}</div>
            <div class="text-sm text-gray-400">{{ doc.specialization || 'General' }}</div>
            <div class="text-sm" *ngIf="experienceYears !== null">Experience: {{ experienceYears }} years</div>
          </div>
        </div>

        <div class="space-y-3">
          <label class="block">
             <span class="text-sm">Select Date</span>
             <input type="date" class="input" [(ngModel)]="selectedDate" (change)="loadSlots()" [min]="minDate" />
           </label>

          <div *ngIf="loadingSlots" class="text-gray-400">Loading available slots…</div>

          <div *ngIf="!loadingSlots">
            <div class="text-sm mb-2">Available Slots</div>
            <div class="flex flex-wrap gap-2">
              <button
                *ngFor="let s of slots"
                [ngClass]="{ 'btn-primary': selectedSlot === s, 'btn-secondary': selectedSlot !== s }"
                (click)="selectSlot(s)"
              >
                {{ s }}
              </button>
              <div *ngIf="(slots?.length || 0) === 0" class="text-gray-400">No slots available for selected date.</div>
            </div>
          </div>

          <div class="mt-4">
            <label class="block mb-1 text-sm">Reason for visit</label>
            <textarea class="input w-full" rows="3" [(ngModel)]="reason" placeholder="e.g., persistent cough, follow-up, etc."></textarea>
          </div>

          <div class="mt-3">
            <button 
              class="btn-primary" 
              [disabled]="validating" 
              (click)="book()"
            >
              {{ validating ? 'Validating…' : 'Book Selected Slot' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DoctorBookingModalComponent implements OnChanges {
  @Input() open = false;
  @Input() doctor: Doctor | null = null;
  @Input() experienceYears: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() proceedToPayment = new EventEmitter<{ date: string; slot: string; reason: string }>();

  private appts = inject(AppointmentService);
  private toast = inject(ToastService);

  selectedDate = '';
  slots: string[] = [];
  selectedSlot: string | null = null;
  reason = '';
  loadingSlots = false;
  validating = false;
  minDate = '';

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['doctor']) && this.open && this.doctor) {
      const today = new Date();
      this.minDate = today.toISOString().slice(0, 10);
      const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      this.selectedDate = localToday.toISOString().slice(0, 10);
      this.selectedSlot = null;
      this.loadSlots();
    }
  }

  loadSlots() {
    if (!this.doctor || !this.selectedDate) return;
    this.loadingSlots = true;
    this.selectedSlot = null;
    this.appts.getAvailableSlots(this.doctor.id, this.selectedDate).subscribe({
      next: (slots) => {
        const filtered = this.filterPastSlots(slots || []);
        this.slots = filtered;
        this.loadingSlots = false;
      },
      error: () => (this.loadingSlots = false),
    });
  }

  filterPastSlots(slots: string[]): string[] {
    const today = new Date();
    const selectedDateObj = new Date(this.selectedDate + 'T00:00:00');
    if (selectedDateObj.toDateString() === today.toDateString()) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      return slots.filter((slot) => {
        const m = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!m) return true;
        let hour = parseInt(m[1]);
        const minute = parseInt(m[2]);
        const ampm = m[3]?.toUpperCase();
        if (ampm === 'PM' && hour !== 12) hour += 12;
        else if (ampm === 'AM' && hour === 12) hour = 0;
        if (hour > currentHour) return true;
        if (hour === currentHour) return minute > currentMinute;
        return false;
      });
    }
    return slots;
  }

  selectSlot(s: string) {
    this.selectedSlot = s;
  }

  book() {
    if (!this.doctor) return;
    if ((this.slots?.length || 0) === 0) {
      this.toast.showError('Please select a future date that has available slots.');
      return;
    }
    if (!this.selectedSlot) {
      this.toast.showError('Please select a slot first.');
      return;
    }
    this.validating = true;
    this.appts.getAvailableSlots(this.doctor.id, this.selectedDate).subscribe({
      next: (slots) => {
        const filtered = this.filterPastSlots(slots || []);
        const stillAvailable = filtered.includes(this.selectedSlot!);
        this.validating = false;
        if (stillAvailable) {
          this.proceedToPayment.emit({ date: this.selectedDate, slot: this.selectedSlot!, reason: this.reason });
        } else {
          this.toast.showError('Selected slot is no longer available. Please choose another.');
          this.slots = filtered;
          this.selectedSlot = null;
        }
      },
      error: () => {
        this.validating = false;
        this.toast.showError('Unable to validate slot. Please try again.');
      },
    });
  }

  doctorInitial(d: Doctor) {
    const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
    const stripped = base.replace(/^dr\.?\s+/i, '');
    return stripped.charAt(0) || '?';
  }

  formatDoctorName(d: Doctor) {
    const base = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim();
    if (!base) return '';
    return /^dr\.?\s+/i.test(base) ? base : `Dr ${base}`;
  }
}
