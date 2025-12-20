import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService, Doctor } from '../../core/services/doctor.service';
import { DoctorProfileService } from '../../core/services/doctor-profile.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorDetailsPanelComponent } from '../../shared/doctor-details-panel.component';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PaymentPopupComponent, PaymentDetails } from '../../shared/payment-popup.component';
import { DoctorBookingModalComponent } from '../../shared/doctor-booking-modal.component';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-doctor-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PatientLayoutComponent, DoctorDetailsPanelComponent, PaymentPopupComponent, DoctorBookingModalComponent],
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
    
    <!-- Booking Modal (Shared) -->
    <app-doctor-booking-modal
      [open]="bookingOpen"
      [doctor]="doctor"
      [experienceYears]="experienceYears"
      (close)="closeBooking()"
      (proceedToPayment)="onProceedToPayment($event)"
    ></app-doctor-booking-modal>
    
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
      <div class="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-pulse">
        <div class="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div class="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div class="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div class="sr-only">Loading doctor profile...</div>
      </div>
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
  validating = false;

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

  private authService = inject(AuthService);

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
      error: () => { },
    });
    this.doctorProfiles.getExperiences(username).subscribe({
      next: (exps) => {
        this.experiences = exps || [];
        // Keep experience years in sync if booking modal is open
        if (this.bookingOpen) {
          this.experienceYears = (this.experiences || []).reduce((acc: number, ex: any) => acc + (ex?.yearsOfService || 0), 0);
        }
      },
      error: () => { },
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
        this.slots = slots || [];
        this.loadingSlots = false;
      },
      error: () => (this.loadingSlots = false),
    });
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
    this.validating = true;
    this.appts.getAvailableSlots(this.doctor.id, this.selectedDate).subscribe({
      next: (slots) => {
        const stillAvailable = (slots || []).includes(this.selectedSlot!);
        this.validating = false;
        if (stillAvailable) {
          this.paymentModalOpen = true;
        } else {
          this.toast.showError('Selected slot is no longer available. Please choose another.');
          this.slots = slots || [];
          this.selectedSlot = null;
        }
      },
      error: () => {
        this.validating = false;
        this.toast.showError('Unable to validate slot. Please try again.');
      }
    });
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
    const userId = this.authService.userId();
    return userId ? parseInt(userId) : 0;
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

  onProceedToPayment(evt: { date: string; slot: string; reason: string }) {
    this.selectedDate = evt.date;
    this.selectedSlot = evt.slot;
    this.reason = evt.reason || '';
    this.bookingOpen = false;
    this.paymentModalOpen = true;
  }
}
