import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../core/services/appointment.service';
import { Doctor } from '../core/services/doctor.service';
import { ToastService } from '../core/services/toast.service';
import { SelectDropdownComponent, SelectOption } from './select-dropdown.component';
import { ModalShellComponent } from './ui/modal-shell.component';

@Component({
  selector: 'app-emergency-appointment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectDropdownComponent, ModalShellComponent],
  template: `
    <app-modal-shell
      [open]="isOpen"
      [showHeader]="false"
      [hasFooter]="true"
      footerClass="p-0 border-0"
      maxWidthClass="max-w-xl sm:max-w-2xl"
      panelClass="panel p-0 relative max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl shadow-red-950/80 border border-red-900/40 rounded-2xl bg-[#0b0f1a] text-white w-full mx-auto"
      bodyClass="p-0 overflow-hidden flex flex-col max-h-[90dvh]"
      ariaLabel="Emergency appointment"
      backdropClass="bg-black/80 backdrop-blur-sm"
      [fullScreenMobile]="true"
      (close)="close()"
    >
      <!-- Header -->
      <div modalHeader class="bg-gradient-to-r from-[#53131c] via-[#6d1825] to-[#801b2a] px-6 py-5 flex items-center justify-between border-b border-red-900/40 shrink-0 relative overflow-hidden">
        <div class="flex items-center gap-3.5 z-10">
          <div class="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
            <i class="fa-solid fa-bell-exclamation text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Emergency Booking</h2>
            <p class="text-red-200/80 text-xs sm:text-sm font-medium">Immediate consultation scheduling</p>
          </div>
        </div>
        <div class="flex items-center gap-3 z-10">
          <!-- Live Time Display on Top Right Header -->
          <div class="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-100 text-xs font-bold tracking-wide flex items-center gap-2 shadow-sm">
            <i class="fa-regular fa-clock text-red-400 text-xs"></i>
            <span>{{ currentTime }} - {{ currentDate }}</span>
          </div>
          <button 
            type="button" 
            aria-label="Close emergency booking" 
            class="w-9 h-9 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer" 
            (click)="close()"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Scrollable Body -->
      <div class="overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#0b0f1a] custom-scrollbar flex-1 min-h-0">
        
        <!-- Vital Information Warning Notice Card -->
        <div class="bg-[#181119] border border-red-900/60 rounded-2xl p-4 sm:p-5 flex gap-4 text-red-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center text-lg shrink-0 mt-0.5">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="space-y-1.5 min-w-0">
            <h4 class="font-bold text-white text-sm sm:text-base">Vital Information</h4>
            <ul class="text-xs sm:text-sm text-red-200/80 space-y-1 ml-4 list-disc leading-relaxed">
              <li>Consultations are scheduled for <strong class="text-white font-bold">immediate attention</strong>.</li>
              <li>Emergency fees may apply based on the doctor's policy.</li>
              <li>Please ensure your medical situation strictly requires urgent care.</li>
            </ul>
          </div>
        </div>

        <!-- Select Specialist Field -->
        <div class="space-y-2">
          <label class="block text-xs sm:text-sm font-bold text-white">
            Select Specialist <span class="text-red-500">*</span>
          </label>
          <div 
            class="relative flex items-center bg-[#131826] border border-[#2a3347] rounded-xl px-3.5 py-1 focus-within:border-[#5b6cf0] transition-colors"
            [class.border-red-500]="showValidation && !selectedDoctorId"
          >
            <div class="w-8 h-8 rounded-lg bg-[#1b2338] border border-[#2a3347] text-[#5b6cf0] flex items-center justify-center text-xs shrink-0 mr-3">
              <i class="fa-solid fa-user-doctor"></i>
            </div>
            <app-select-dropdown 
              label="" 
              [options]="doctorOptions" 
              placeholder="-- Select a doctor --"
              [(ngModel)]="selectedDoctorId"
              customButtonClass="w-full bg-transparent border-0 px-0 text-xs sm:text-sm text-white focus:outline-none focus:ring-0 shadow-none hover:border-transparent font-medium"
              class="w-full min-w-0"
            >
            </app-select-dropdown>
          </div>
          <p *ngIf="showValidation && !selectedDoctorId" class="text-red-400 text-xs ml-1 animate-pulse">
            Please select a doctor to proceed.
          </p>
        </div>

        <!-- Selected Doctor Preview Card -->
        <div *ngIf="selectedDoctor" class="bg-[#131826] rounded-xl p-4 border border-[#2a3347] animate-fade-in">
          <div class="flex items-start gap-4">
            <div class="relative w-12 h-12 shrink-0">
              <div class="w-12 h-12 rounded-full bg-[#1b2338] flex items-center justify-center overflow-hidden border border-[#2a3347]">
                <img *ngIf="selectedDoctor.profileImageUrl" [src]="selectedDoctor.profileImageUrl" [alt]="'Dr. ' + (selectedDoctor.firstName || '')" class="w-full h-full object-cover" />
                <span *ngIf="!selectedDoctor.profileImageUrl" class="text-lg font-bold text-[#5b6cf0]">{{ selectedDoctor.firstName?.charAt(0) }}</span>
              </div>
              <div *ngIf="selectedDoctor.isVerified" class="absolute -bottom-1 -right-1 bg-[#5b6cf0] text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-[#0b0f1a]" title="Verified">
                <i class="fa-solid fa-check"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-white text-sm sm:text-base">Dr. {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</h4>
              <p class="text-[#5b6cf0] text-xs font-semibold mb-2">{{ selectedDoctor.specialization || 'General Physician' }}</p>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#9aa3b8]">
                <div class="flex items-center gap-2" *ngIf="selectedDoctor.consultationFees">
                  <i class="fa-solid fa-money-bill-wave text-emerald-400/80 w-4"></i>
                  <span>Fee: ₹{{ selectedDoctor.consultationFees }}</span>
                </div>
                <div class="flex items-center gap-2" *ngIf="selectedDoctor.contactInfo">
                  <i class="fa-solid fa-phone text-indigo-400/80 w-4"></i>
                  <span>{{ selectedDoctor.contactInfo }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Emergency Details Textarea Field -->
        <div class="space-y-2">
          <label class="block text-xs sm:text-sm font-bold text-white">
            Emergency Details <span class="text-red-500">*</span>
          </label>
          <div 
            class="relative bg-[#131826] border border-[#2a3347] rounded-xl p-3.5 flex gap-3 focus-within:border-[#5b6cf0] transition-colors"
            [class.border-red-500]="showValidation && !reason.trim()"
          >
            <div class="w-9 h-9 rounded-xl bg-[#1b2338] border border-[#2a3347] text-[#5b6cf0] flex items-center justify-center text-sm shrink-0 mt-0.5">
              <i class="fa-solid fa-file-lines"></i>
            </div>
            <div class="flex-1 min-w-0 relative">
              <textarea 
                class="w-full bg-transparent text-white text-xs sm:text-sm placeholder-[#64748b] focus:outline-none resize-none min-h-[90px] pr-12" 
                [(ngModel)]="reason"
                maxlength="500"
                placeholder="Describe symptoms, severity, and duration..."
              ></textarea>
              <span class="absolute bottom-0 right-0 text-[10px] sm:text-xs font-semibold text-[#64748b]">
                {{ reason.length }}/500
              </span>
            </div>
          </div>
          <p *ngIf="showValidation && !reason.trim()" class="text-red-400 text-xs ml-1 animate-pulse">
            Brief emergency details are required.
          </p>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div modalFooter class="p-4 sm:p-5 border-t border-[#2a3347] bg-[#0b0f1a] flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
        <button 
          type="button"
          class="px-5 py-2.5 rounded-xl bg-[#21293b] hover:bg-[#2b354d] border border-[#323d54] text-gray-200 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50" 
          (click)="close()" 
          [disabled]="booking"
        >
          <i class="fa-solid fa-xmark text-xs"></i>
          <span>Cancel Request</span>
        </button>
        <button 
          type="button"
          class="px-6 py-2.5 rounded-xl bg-[#4f62f0] hover:bg-[#4353d9] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50" 
          (click)="bookEmergencyAppointment()" 
          [disabled]="booking"
        >
          <i *ngIf="booking" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
          <i *ngIf="!booking" class="fa-solid fa-bell text-xs"></i>
          <span>{{ booking ? 'Processing Emergency Request...' : 'Confirm Emergency Booking' }}</span>
        </button>
      </div>

    </app-modal-shell>
  `
})
export class EmergencyAppointmentModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() availableDoctors: Doctor[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() appointmentBooked = new EventEmitter<any>();

  selectedDoctorId: number | null = null;
  reason = '';
  booking = false;
  error: string | null = null;

  showValidation = false;

  currentDate = '';
  currentTime = '';
  private timer: any;

  constructor(private appointmentService: AppointmentService, private toast: ToastService) { }

  ngOnInit() {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private updateClock() {
    const now = new Date();
    this.currentDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    this.currentTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();
  }

  get doctorOptions(): SelectOption[] {
    return this.availableDoctors.map(d => ({
      value: d.id,
      label: `Dr. ${d.firstName} ${d.lastName} ${d.specialization ? '(' + d.specialization + ')' : ''}`
    }));
  }

  get selectedDoctor(): Doctor | null {
    if (!this.selectedDoctorId) return null;
    return this.availableDoctors.find(d => d.id === this.selectedDoctorId) || null;
  }

  close() {
    this.reset();
    this.closeModal.emit();
  }

  reset() {
    this.selectedDoctorId = null;
    this.reason = '';
    this.booking = false;
    this.error = null;
    this.showValidation = false;
  }

  bookEmergencyAppointment() {
    this.showValidation = true;
    this.error = null;

    // Validation
    const missingDoctor = !this.selectedDoctorId;
    const missingReason = !this.reason.trim();
    if (missingDoctor || missingReason) {
      let msg = '';
      if (missingDoctor && missingReason) {
        msg = 'Please first select a doctor and fill the reason.';
      } else if (missingDoctor) {
        msg = 'Please select a doctor for the emergency appointment.';
      } else {
        msg = 'Please provide a reason for the emergency appointment.';
      }
      this.error = msg;
      this.toast.showError(msg);
      return;
    }

    this.booking = true;

    this.appointmentService.bookEmergencyAppointment(this.selectedDoctorId!, this.reason.trim())
      .subscribe({
        next: (response) => {
          this.booking = false;
          this.toast.showSuccess('Emergency appointment booked successfully! The doctor has been notified.');
          this.appointmentBooked.emit(response);

          // Auto-close after 2 seconds
          setTimeout(() => {
            this.close();
          }, 2000);
        },
        error: (err) => {
          this.booking = false;
          const msg = err.error?.error || 'Failed to book emergency appointment. Please try again.';
          this.error = msg;
          this.toast.showError(msg);
        }
      });
  }
}
