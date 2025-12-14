import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../core/services/appointment.service';
import { Doctor } from '../core/services/doctor.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-emergency-appointment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="panel p-0 w-full max-w-2xl relative max-h-[85dvh] overflow-hidden flex flex-col shadow-2xl shadow-red-900/40 border border-red-500/30 rounded-2xl">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-red-900/80 to-red-800/60 p-5 flex items-center justify-between border-b border-red-500/30">
           <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-200 animate-pulse">
                <span class="text-xl">🚨</span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white tracking-tight">Emergency Booking</h2>
                 <p class="text-red-200 text-xs">Immediate consultation scheduling</p>
              </div>
           </div>
           <button class="text-red-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-lg p-2" (click)="close()">
              <i class="fa-solid fa-xmark"></i>
           </button>
        </div>

        <div class="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <!-- Warning Notice -->
          <div class="bg-red-950/40 border border-red-500/20 rounded-xl p-4 flex gap-4">
             <i class="fa-solid fa-triangle-exclamation text-red-500 text-xl mt-0.5"></i>
             <div class="space-y-2">
                <h4 class="font-semibold text-red-200 text-sm">Vital Information</h4>
                <ul class="text-xs text-red-200/70 space-y-1 ml-4 list-disc">
                  <li>Consultations are scheduled for <strong>immediate attention</strong>.</li>
                  <li>Emergency fees may apply based on the doctor's policy.</li>
                  <li>Please ensure your medical situation strictly requires urgent care.</li>
                </ul>
             </div>
          </div>

          <!-- Doctor Selection -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-300 ml-1">
              Select Specialist <span class="text-red-400">*</span>
            </label>
            <div class="relative">
               <i class="fa-solid fa-user-doctor absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
               <select 
                 class="input w-full pl-10 bg-gray-900/50" 
                 [(ngModel)]="selectedDoctorId"
                 [class.border-red-500]="showValidation && !selectedDoctorId"
               >
                 <option [ngValue]="null">-- Select a doctor --</option>
                 <option *ngFor="let doctor of availableDoctors" [value]="doctor.id">
                   Dr. {{ doctor.firstName }} {{ doctor.lastName }} 
                   {{ doctor.specialization ? '(' + doctor.specialization + ')' : '' }}
                 </option>
               </select>
               <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none"></i>
            </div>
            <p *ngIf="showValidation && !selectedDoctorId" class="text-red-400 text-xs ml-1 animate-pulse">
               Please select a doctor to proceed.
            </p>
          </div>

          <!-- Selected Doctor Details -->
          <div *ngIf="selectedDoctor" class="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 animate-fade-in">
            <div class="flex items-start gap-4">
               <div class="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600 shrink-0">
                  <img *ngIf="selectedDoctor.profileImageUrl" [src]="selectedDoctor.profileImageUrl" class="w-full h-full object-cover" />
                  <span *ngIf="!selectedDoctor.profileImageUrl" class="text-xl font-bold text-gray-400">{{ selectedDoctor.firstName?.charAt(0) }}</span>
               </div>
               <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-gray-100">Dr. {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</h4>
                  <p class="text-blue-400 text-sm mb-2">{{ selectedDoctor.specialization || 'General Physician' }}</p>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
                     <div class="flex items-center gap-2" *ngIf="selectedDoctor.consultationFees">
                        <i class="fa-solid fa-money-bill-wave text-green-500/70 w-4"></i>
                        <span>Fee: ₹{{ selectedDoctor.consultationFees }}</span>
                     </div>
                     <div class="flex items-center gap-2" *ngIf="selectedDoctor.contactInfo">
                        <i class="fa-solid fa-phone text-blue-500/70 w-4"></i>
                        <span>{{ selectedDoctor.contactInfo }}</span>
                     </div>
                     <div class="flex items-center gap-2 col-span-full line-clamp-1" *ngIf="selectedDoctor.address">
                        <i class="fa-solid fa-location-dot text-red-400/70 w-4"></i>
                        <span class="truncate">{{ selectedDoctor.address }}</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <!-- Reason for Emergency -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-300 ml-1">
              Emergency Details <span class="text-red-400">*</span>
            </label>
            <textarea 
              class="input w-full min-h-[100px] resize-none bg-gray-900/50" 
              [(ngModel)]="reason"
              placeholder="Describe symptoms, severity, and duration..."
              [class.border-red-500]="showValidation && !reason.trim()"
            ></textarea>
            <p *ngIf="showValidation && !reason.trim()" class="text-red-400 text-xs ml-1 animate-pulse">
               Brief emergency details are required.
            </p>
          </div>

          <!-- Appointment Preview -->
          <div class="bg-blue-950/20 border border-blue-500/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                 <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Schedule For</div>
                 <div class="text-lg font-bold text-blue-100">{{ currentTime }}</div>
                 <div class="text-xs text-blue-300">{{ currentDate }} (Today)</div>
              </div>
              <div class="text-right">
                 <div class="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider animate-pulse">
                    Urgent
                 </div>
              </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-gray-800 bg-gray-900/50 flex flex-col sm:flex-row gap-3">
             <button class="btn-secondary flex-1" (click)="close()" [disabled]="booking">Cancel Request</button>
             <button class="btn-primary bg-red-600 hover:bg-red-500 border-none flex-[2] relative overflow-hidden" (click)="bookEmergencyAppointment()" [disabled]="booking">
                <span class="relative z-10 flex items-center justify-center gap-2">
                   <i *ngIf="booking" class="fa-solid fa-circle-notch fa-spin"></i>
                   <i *ngIf="!booking" class="fa-solid fa-bell"></i>
                   {{ booking ? 'Processing Emergency Request...' : 'Confirm Emergency Booking' }}
                </span>
             </button>
             
             <div *ngIf="error" class="w-full text-center text-red-400 text-sm mt-2 sm:hidden animate-fade-in">
                {{ error }}
             </div>
        </div>
      </div>
    </div>
  `
})
export class EmergencyAppointmentModalComponent {
  @Input() isOpen = false;
  @Input() availableDoctors: Doctor[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() appointmentBooked = new EventEmitter<any>();

  selectedDoctorId: number | null = null;
  reason = '';
  booking = false;
  error: string | null = null;

  showValidation = false;

  currentDate = new Date().toLocaleDateString();
  currentTime = new Date().toLocaleTimeString();

  constructor(private appointmentService: AppointmentService, private toast: ToastService) { }

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
