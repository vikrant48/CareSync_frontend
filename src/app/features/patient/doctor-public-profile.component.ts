import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorDetailsPanelComponent } from '../../shared/doctor-details-panel.component';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PaymentPopupComponent, PaymentDetails } from '../../shared/payment-popup.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-doctor-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, DoctorDetailsPanelComponent, PaymentPopupComponent],
  template: `
    <app-patient-layout>
    <doctor-details-panel
      *ngIf="doctor; else loadingTpl"
      [doctor]="doctor"
      [avgRating]="avgRating"
      [age]="age"
      [educations]="educations"
      [experiences]="experiences"
      [certificates]="certificates"
      [enableBooking]="true"
      (openBooking)="startBooking()"
    ></doctor-details-panel>
    
    <!-- Booking Modal -->
    <div *ngIf="bookingOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="panel p-6 w-full max-w-xl relative">
        <button class="absolute top-2 right-2 btn-secondary" (click)="closeBooking()">Close</button>
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
              [disabled]="!selectedSlot || booking" 
              (click)="book()"
            >
              {{ booking ? 'Booking…' : 'Book Selected Slot' }}
            </button>

          </div>
        </div>
      </div>
    </div>
    
    <!-- Payment Modal -->
    <app-payment-popup
      [isVisible]="paymentModalOpen"
      [amount]="doctor?.consultationFees || 0"
      [title]="'Appointment Booking Payment'"
      [patientId]="getCurrentPatientId()"
      [paymentType]="'APPOINTMENT'"
      [additionalInfo]="getAppointmentInfo()"
      (paymentSuccess)="onPaymentSuccess($event)"
      (paymentCancel)="closePaymentModal()"
      (paymentError)="onPaymentError($event)"
    ></app-payment-popup>
    
    <ng-template #loadingTpl>
      <div class="p-6 text-center text-gray-400">Loading doctor profile…</div>
    </ng-template>
    </app-patient-layout>
  `,
})
export class DoctorPublicProfileComponent {
  username: string | null = null;
  doctor: Doctor | null = null;
  avgRating: number | null = null;
  age: number | null = null;

  educations: any[] = [];
  experiences: any[] = [];
  certificates: any[] = [];
  loadingDetails = false;

  selectedDate = ''; // YYYY-MM-DD
  slots: string[] = [];
  selectedSlot: string | null = null;
  reason = '';
  loadingSlots = false;
  booking = false;

  bookError: string | null = null;
  bookingOpen = false;
  experienceYears: number | null = null;
  autoBookOnLoad = false;
  
  // Add properties for date validation and slot filtering
  minDate = '';
  currentTime = '';
  
  // Payment related properties
  paymentModalOpen = false;
  paymentCompleted = false;
  paymentDetails: PaymentDetails | null = null;

  constructor(
    private route: ActivatedRoute,
    private doctors: DoctorService,
    private appts: AppointmentService,
    private doctorProfiles: DoctorProfileService,
    private toast: ToastService
  ) {
    this.username = this.route.snapshot.paramMap.get('username');
    this.autoBookOnLoad = this.route.snapshot.queryParamMap.get('book') === '1';
    if (this.username) {
      this.loadDoctor(this.username);
    }
  }

  loadDoctor(username: string) {
    this.doctors.getByUsername(username).subscribe({
      next: (d) => {
        this.doctor = d;
        this.age = this.computeAge(d?.dateOfBirth);
        // Ratings
        this.doctors.getAverageRating(d.id).subscribe({
          next: (r) => (this.avgRating = r?.averageRating ?? null),
        });
        // Details
        this.loadDetails(username);
        if (this.autoBookOnLoad) {
          // Open booking modal immediately on arrival when requested
          this.startBooking();
        }
      },
    });
  }

  loadDetails(username: string) {
    this.loadingDetails = true;
    this.doctorProfiles.getEducations(username).subscribe({
      next: (eds) => (this.educations = eds || []),
      error: () => {},
    });
    this.doctorProfiles.getExperiences(username).subscribe({
      next: (exps) => {
        this.experiences = exps || [];
        // Keep experience years in sync if booking modal is open
        if (this.bookingOpen) {
          this.experienceYears = (this.experiences || []).reduce((acc: number, ex: any) => acc + (ex?.yearsOfService || 0), 0);
        }
      },
      error: () => {},
    });
    this.doctorProfiles.getCertificates(username).subscribe({
      next: (certs) => {
        this.certificates = certs || [];
        this.loadingDetails = false;
      },
      error: () => (this.loadingDetails = false),
    });
  }

  computeAge(dob?: string): number | null {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  loadSlots() {
    if (!this.doctor || !this.selectedDate) return;
    this.loadingSlots = true;
    this.selectedSlot = null;
    this.bookError = null;
    this.appts.getAvailableSlots(this.doctor.id, this.selectedDate).subscribe({
      next: (slots) => {
        // Filter out past time slots if the selected date is today
        const filteredSlots = this.filterPastSlots(slots || []);
        this.slots = filteredSlots;
        this.loadingSlots = false;
      },
      error: () => (this.loadingSlots = false),
    });
  }

  // New method to filter past time slots for current day
  filterPastSlots(slots: string[]): string[] {
    const today = new Date();
    const selectedDateObj = new Date(this.selectedDate + 'T00:00:00');
    
    // Only filter if the selected date is today
    if (selectedDateObj.toDateString() === today.toDateString()) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      
      return slots.filter(slot => {
        // Parse slot time (assuming format like "09:00 AM" or "14:30")
        const timeMatch = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!timeMatch) return true; // Keep slot if we can't parse it
        
        let hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]);
        const ampm = timeMatch[3]?.toUpperCase();
        
        // Convert to 24-hour format if needed
        if (ampm === 'PM' && hour !== 12) {
          hour += 12;
        } else if (ampm === 'AM' && hour === 12) {
          hour = 0;
        }
        
        // Compare with current time
        if (hour > currentHour) {
          return true; // Future hour
        } else if (hour === currentHour) {
          return minute > currentMinute; // Same hour, but future minute
        } else {
          return false; // Past hour
        }
      });
    }
    
    return slots; // Return all slots for future dates
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
  }

  toIso(date: string, time: string) {
    // Ensure seconds present
    const t = time.length === 5 ? `${time}:00` : time;
    return `${date}T${t}`;
  }

  book() {
    if (!this.selectedSlot || !this.doctor) return;
    
    // Show payment popup first
    this.paymentModalOpen = true;
  }

  // This method will be called after successful payment
  proceedWithBooking() {
    if (!this.selectedSlot || !this.doctor) return;
    
    this.booking = true;
    this.bookError = null;
    const payload = {
      doctorId: this.doctor.id,
      appointmentDateTime: this.toIso(this.selectedDate, this.selectedSlot),
      reason: this.reason || undefined
    };
    this.appts.bookAppointment(payload).subscribe({
      next: () => {
        this.booking = false;
        this.toast.showSuccess('Appointment booked successfully.');
        // Optionally close modal after success
        // this.bookingOpen = false;
      },
      error: (err) => {
        this.booking = false;
        const msg = err?.error?.message || 'Booking failed. Please try another slot.';
        this.bookError = msg;
        this.toast.showError(msg);
      },
    });
  }

  startBooking() {
    this.bookingOpen = true;
    this.bookError = null;
    this.selectedSlot = null;
    
    // Set minimum date to today to prevent past date selection
    const today = new Date();
    this.minDate = today.toISOString().slice(0, 10);
    
    // Set default date to today with proper timezone handling
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    this.selectedDate = localToday.toISOString().slice(0, 10);
    
    // Store current time for slot filtering
    this.currentTime = today.toTimeString().slice(0, 5); // HH:MM format
    
    // Precompute experience years from loaded experiences
    this.experienceYears = (this.experiences || []).reduce((acc: number, ex: any) => acc + (ex?.yearsOfService || 0), 0);
    this.loadSlots();
  }

  closePaymentModal() {
    this.paymentModalOpen = false;
  }

  onPaymentSuccess(paymentDetails: PaymentDetails) {
    this.paymentDetails = paymentDetails;
    this.paymentCompleted = true;
    this.paymentModalOpen = false;
    
    // Automatically proceed with booking after successful payment
    this.proceedWithBooking();
  }

  onPaymentError(error: string) {
    console.error('Payment error:', error);
    this.toast.showError(error || 'Payment failed. Please try again.');
  }

  getCurrentPatientId(): number {
    // This should return the current logged-in patient's ID
    // You might need to get this from AuthService or similar
    return 1; // Placeholder - replace with actual patient ID logic
  }

  closeBooking() {
    this.bookingOpen = false;
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

  getAppointmentInfo(): string {
    if (!this.doctor) return '';
    const doctorName = this.formatDoctorName(this.doctor);
    const specialization = this.doctor.specialization || 'General';
    const date = this.selectedDate ? new Date(this.selectedDate).toLocaleDateString() : '';
    const slot = this.selectedSlot || '';
    
    return `${doctorName} (${specialization}) - ${date} ${slot}`.trim();
  }
}