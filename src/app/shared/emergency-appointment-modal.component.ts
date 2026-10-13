import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
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
      maxWidthClass="max-w-lg"
      zIndexClass="z-[80]"
      panelClass="bg-white dark:bg-gray-900 text-[var(--text)] border border-red-200 dark:border-red-900/40 rounded-2xl relative overflow-hidden flex flex-col w-full mx-auto shadow-2xl !mb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:!mb-0 !max-h-[calc(100dvh-7.5rem)] sm:!max-h-[85dvh]"
      bodyClass="p-0 overflow-hidden flex flex-col min-h-0"
      ariaLabel="Emergency appointment confirmation"
      backdropClass="bg-black/80 backdrop-blur-sm"
      [fullScreenMobile]="true"
      (close)="close()"
    >
      <!-- Header -->
      <div modalHeader class="bg-gradient-to-r from-[#53131c] via-[#6d1825] to-[#801b2a] px-4 sm:px-5 py-3 flex items-center justify-between border-b border-red-900/40 shrink-0 relative overflow-hidden">
        <div class="flex items-center gap-2.5 z-10">
          <div class="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
            <i class="fa-solid fa-bell-exclamation text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-white tracking-tight">Emergency Booking Confirmation</h2>
            <p class="text-red-100 text-[11px] font-medium">Review and confirm immediate consultation</p>
          </div>
        </div>
        <div class="flex items-center gap-2 z-10">
          <!-- Live Time Display on Top Right Header -->
          <div class="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/30 text-red-100 text-[11px] font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
            <i class="fa-regular fa-clock text-red-400 text-[10px]"></i>
            <span>{{ currentTime }}</span>
          </div>
          <button 
            type="button" 
            aria-label="Close emergency booking" 
            class="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-100 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer" 
            (click)="close()"
          >
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Scrollable Body -->
      <div class="overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-[var(--bg)] custom-scrollbar flex-1 min-h-0">
        
        <!-- Vital Information Warning Notice Card -->
        <div class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-red-900/60 rounded-xl p-2.5 sm:p-3 flex gap-2.5 text-rose-800 dark:text-red-200 shadow-sm">
          <div class="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="space-y-0.5 min-w-0">
            <h4 class="font-bold text-[var(--text)] text-xs">Vital Information</h4>
            <ul class="text-[11px] text-red-200/80 space-y-0.5 ml-3.5 list-disc leading-tight">
              <li>Emergency fees may apply based on the doctor's policy.</li>
              <li>Please ensure your medical situation strictly requires urgent care.</li>
            </ul>
          </div>
        </div>

        <!-- If NO preselected doctor, show doctor select dropdown -->
        <div *ngIf="!preselectedDoctor" class="space-y-1">
          <label class="block text-xs font-semibold text-[var(--text)]">
            Select Specialist <span class="text-red-500">*</span>
          </label>
          <div 
            class="relative flex items-center bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1 focus-within:border-[var(--primary)] transition-colors"
            [class.border-red-500]="showValidation && !selectedDoctorId"
          >
            <div class="w-7 h-7 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[var(--primary)] flex items-center justify-center text-[11px] shrink-0 mr-2">
              <i class="fa-solid fa-user-doctor"></i>
            </div>
            <app-select-dropdown 
              label="" 
              [options]="doctorOptions" 
              placeholder="-- Select a doctor --"
              [(ngModel)]="selectedDoctorId"
              customButtonClass="w-full bg-transparent border-0 px-0 text-xs text-[var(--text)] focus:outline-none focus:ring-0 shadow-none hover:border-transparent font-medium"
              class="w-full min-w-0"
            >
            </app-select-dropdown>
          </div>
          <p *ngIf="showValidation && !selectedDoctorId" class="text-red-400 text-[11px] ml-1 animate-pulse">
            Please select a doctor to proceed.
          </p>
        </div>

        <!-- Doctor Details Bar (Short: Name, Specialization, Fees in one line) -->
        <div *ngIf="selectedDoctor" class="bg-[var(--panel)] rounded-xl px-3 py-2 border border-[var(--border)] shadow-sm flex items-center justify-between gap-2.5 text-xs">
          <div class="flex items-center gap-1.5 min-w-0">
            <i class="fa-solid fa-user-doctor text-[var(--primary)] text-[11px] shrink-0"></i>
            <span class="font-bold text-[var(--text)] truncate">
              {{ formatDoctorName(selectedDoctor) }}
            </span>
            <span class="text-[var(--border)] shrink-0">•</span>
            <span class="text-[var(--muted)] truncate text-[11px]">
              {{ selectedDoctor.specialization || 'General Physician' }}
            </span>
          </div>

          <div class="flex items-center gap-1 shrink-0 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
            <span class="text-[var(--muted)] font-normal text-[11px]">Fee:</span>
            <span>₹{{ selectedDoctor.consultationFees || '0' }}</span>
          </div>
        </div>

        <!-- Emergency Details Single-Line Input Field (Pre-filled, user can edit) -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-semibold text-[var(--text)]">
              Emergency Reason <span class="text-red-500">*</span>
            </label>
            <span class="text-[10px] text-[var(--muted)] font-medium">Editable</span>
          </div>

          <div 
            class="relative bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5 flex items-center gap-2 focus-within:border-[var(--primary)] transition-colors"
            [class.border-red-500]="showValidation && !reason.trim()"
          >
            <i class="fa-solid fa-file-lines text-[var(--primary)] text-[11px] shrink-0"></i>
            <input 
              type="text"
              class="w-full bg-transparent text-[var(--text)] text-xs placeholder-[var(--muted)] focus:outline-none font-medium truncate" 
              [(ngModel)]="reason"
              maxlength="250"
              placeholder="Enter emergency reason..."
            />
          </div>
          <p *ngIf="showValidation && !reason.trim()" class="text-red-400 text-[11px] ml-1 animate-pulse">
            Emergency reason is required.
          </p>
        </div>

        <!-- Tick Radio Confirmation Option -->
        <div 
          (click)="toggleConfirmation()"
          class="p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start sm:items-center gap-2.5 group"
          [ngClass]="isConfirmed 
            ? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500 text-[var(--text)] ring-1 ring-rose-500/30' 
            : 'bg-[var(--panel)] border-[var(--border)] text-[var(--muted)] hover:border-rose-400/50'"
        >
          <!-- Radio / Tick Circle Icon -->
          <div 
            class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-all duration-200"
            [ngClass]="isConfirmed 
              ? 'border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-500/50 scale-105' 
              : 'border-gray-400 dark:border-gray-500 bg-transparent group-hover:border-rose-400'"
          >
            <i *ngIf="isConfirmed" class="fa-solid fa-check text-[8px]"></i>
          </div>

          <!-- Label Text -->
          <div class="flex-1 min-w-0">
            <span class="text-xs font-bold text-[var(--text)] block">
              Confirm Urgent Consultation Request
            </span>
            <span class="text-[10px] text-[var(--muted)] block leading-tight mt-0.5">
              Click this radio to confirm immediate scheduling with {{ selectedDoctor ? formatDoctorName(selectedDoctor) : 'the doctor' }}.
            </span>
          </div>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div modalFooter class="p-3 sm:p-3.5 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-end gap-2.5 rounded-b-2xl shrink-0">
        <button 
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--bg)] transition-all flex items-center gap-1.5 cursor-pointer" 
          (click)="close()" 
          [disabled]="booking"
        >
          <i class="fa-solid fa-xmark text-[10px]"></i>
          <span>Cancel Request</span>
        </button>

        <button 
          type="button"
          class="px-3.5 py-1.5 rounded-xl font-bold text-xs text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          [disabled]="booking || !isConfirmed || !selectedDoctorId"
          [ngClass]="{
            'opacity-40 !cursor-not-allowed bg-gray-500': !isConfirmed || !selectedDoctorId,
            'bg-gradient-to-r from-[#63141f] to-[#7f1a28] hover:from-[#761825] hover:to-[#911e2e] active:scale-[0.98] border border-[#9b2232]/50 shadow-sm': isConfirmed && selectedDoctorId
          }"
          (click)="bookEmergencyAppointment()" 
        >
          <i *ngIf="booking" class="fa-solid fa-circle-notch fa-spin text-[10px]"></i>
          <i *ngIf="!booking" class="fa-solid fa-bell text-[10px]"></i>
          <span>{{ booking ? 'Processing Emergency Request...' : 'Confirm Emergency Booking' }}</span>
        </button>
      </div>

    </app-modal-shell>
  `
})
export class EmergencyAppointmentModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Input() preselectedDoctor: Doctor | null = null;
  @Input() availableDoctors: Doctor[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() appointmentBooked = new EventEmitter<any>();

  selectedDoctorId: number | null = null;
  reason = 'Emergency booking';
  isConfirmed = false;
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
    this.syncDoctorSelection();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.syncDoctorSelection();
      this.reason = 'Emergency booking';
      this.isConfirmed = false;
      this.showValidation = false;
    }
    if (changes['preselectedDoctor'] && this.preselectedDoctor) {
      this.selectedDoctorId = this.preselectedDoctor.id;
    }
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private syncDoctorSelection() {
    if (this.preselectedDoctor) {
      this.selectedDoctorId = this.preselectedDoctor.id;
    } else if (this.availableDoctors && this.availableDoctors.length > 0 && !this.selectedDoctorId) {
      this.selectedDoctorId = this.availableDoctors[0].id;
    }
  }

  private updateClock() {
    const now = new Date();
    this.currentDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    this.currentTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();
  }

  get doctorOptions(): SelectOption[] {
    return this.availableDoctors.filter(d => d.isActive !== false).map(d => ({
      value: d.id,
      label: `Dr. ${d.firstName} ${d.lastName} ${d.specialization ? '(' + d.specialization + ')' : ''}`
    }));
  }

  get selectedDoctor(): Doctor | null {
    if (this.preselectedDoctor) {
      return this.preselectedDoctor;
    }
    if (!this.selectedDoctorId) return null;
    return this.availableDoctors.find(d => d.id === this.selectedDoctorId) || null;
  }

  toggleConfirmation() {
    this.isConfirmed = !this.isConfirmed;
  }

  formatDoctorName(d: Doctor): string {
    if (!d) return '';
    const parts = [d.firstName, d.lastName].filter(Boolean);
    if (parts.length > 0) {
      return `Dr. ${parts.join(' ')}`;
    }
    return d.name ? `Dr. ${d.name}` : (d.username ? `Dr. ${d.username}` : 'Doctor');
  }

  doctorInitial(d: Doctor): string {
    if (!d) return 'D';
    return (d.firstName?.charAt(0) || d.name?.charAt(0) || 'D').toUpperCase();
  }

  close() {
    this.reset();
    this.closeModal.emit();
  }

  reset() {
    this.selectedDoctorId = null;
    this.reason = 'Emergency booking';
    this.isConfirmed = false;
    this.booking = false;
    this.error = null;
    this.showValidation = false;
  }

  bookEmergencyAppointment() {
    this.showValidation = true;
    this.error = null;

    if (!this.isConfirmed) {
      this.toast.showError('Please tick the confirmation radio to proceed.');
      return;
    }

    const doctorId = this.selectedDoctorId || this.preselectedDoctor?.id;
    const finalReason = (this.reason || 'Emergency booking').trim();

    if (!doctorId) {
      this.toast.showError('Please select a doctor for the emergency appointment.');
      return;
    }

    if (!finalReason) {
      this.toast.showError('Please provide a reason for the emergency appointment.');
      return;
    }

    this.booking = true;

    // Generate local ISO datetime to guarantee 100% time alignment with user's clock
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const clientLocalIso = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    this.appointmentService.bookEmergencyAppointment(doctorId, finalReason, clientLocalIso)
      .subscribe({
        next: (response) => {
          this.booking = false;
          this.toast.showSuccess('Emergency appointment booked successfully! The doctor has been notified.');
          this.appointmentBooked.emit(response);

          // Close modal
          this.close();
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
