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
    <div *ngIf="open" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm transition-opacity">
      <div class="panel w-full max-w-xl relative flex flex-col max-h-[75vh] sm:max-h-[85vh] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
        
        <!-- Header (Fixed) -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 bg-white dark:bg-gray-900">
             <div class="flex items-center gap-3" *ngIf="doctor as doc">
               <div class="flex flex-col items-center gap-1">
                 <div class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white border-2" [ngClass]="{'border-emerald-500': doc.isVerified, 'border-transparent': !doc.isVerified, 'bg-gray-700': !doc.profileImageUrl}">
                   <img *ngIf="doc.profileImageUrl" [src]="doc.profileImageUrl" class="w-full h-full object-cover" (error)="doc.profileImageUrl = ''" />
                   <span *ngIf="!doc.profileImageUrl">{{ doctorInitial(doc) }}</span>
                 </div>
               </div>
               <div>
                 <div class="font-bold text-gray-900 dark:text-white flex items-center gap-1 text-sm sm:text-base">
                   {{ formatDoctorName(doc) }}
                   <i *ngIf="doc.isVerified" class="fa-solid fa-circle-check text-emerald-500 text-xs" title="Verified Doctor"></i>
                 </div>
                 <div class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{{ doc.specialization || 'General' }}</div>
               </div>
             </div>
             
             <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" (click)="close.emit()">
                <i class="fa-solid fa-xmark text-xl"></i>
             </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-white dark:bg-gray-900/95">
           
           <!-- Date Selection -->
           <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Date</label>
              <div class="relative">
                 <input type="date" class="input w-full" [(ngModel)]="selectedDate" (change)="loadSlots()" [min]="minDate" />
              </div>
           </div>

           <!-- Slots -->
           <div class="space-y-2">
              <div class="flex items-center justify-between">
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Available Slots</label>
                 <span *ngIf="loadingSlots" class="text-xs text-emerald-500"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Checking...</span>
              </div>
              
              <div *ngIf="!loadingSlots" class="min-h-[100px]">
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <button
                    *ngFor="let s of slots"
                    class="py-2 px-1 text-sm rounded-lg border transition-all duration-200"
                    [ngClass]="selectedSlot === s ? 'bg-emerald-500 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-500'"
                    (click)="selectSlot(s)"
                  >
                    {{ s }}
                  </button>
                </div>
                <div *ngIf="slots.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <i class="fa-regular fa-calendar-xmark text-2xl mb-2"></i>
                    <span class="text-sm">No slots available</span>
                </div>
              </div>
           </div>

           <!-- Reason -->
           <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Note for Doctor</label>
            <textarea class="input w-full min-h-[80px]" rows="3" [(ngModel)]="reason" placeholder="Briefly describe your problem..."></textarea>
          </div>
        </div>

        <!-- Sticky Footer -->
        <div class="p-4 pb-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
            <button 
              class="btn-primary w-full py-3 text-base shadow-lg shadow-emerald-500/20" 
              [disabled]="validating || !selectedSlot" 
              (click)="book()"
            >
              <span *ngIf="!validating">Confirm Booking <i class="fa-solid fa-arrow-right ml-2 opacity-80"></i></span>
              <span *ngIf="validating"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...</span>
            </button>
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
    if (this.slots.length === 0) {
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
