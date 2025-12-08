import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LabTestService, BookingResponse } from '../../core/services/lab-test.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PdfService, PaymentReceiptData } from '../../core/services/pdf.service';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentPopupComponent, PaymentDetails } from '../../shared/payment-popup.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-patient-lab-bookings',
  standalone: true,
  imports: [CommonModule, PatientLayoutComponent, PaymentPopupComponent],
  template: `
    <app-patient-layout>
      <div class="p-4 sm:p-6">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
    <h1 class="text-xl sm:text-2xl font-bold text-gray-100">My Lab Test Bookings</h1>

    <div class="flex flex-wrap items-center gap-3">
      <button 
        (click)="loadBookings()"
        class="text-blue-400 hover:text-blue-500 underline-offset-2 text-sm font-medium flex items-center gap-2">
        <i class="fas fa-rotate-right"></i>
        <span>Refresh</span>
      </button>

      <button 
        (click)="navigateToBooking()"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md text-sm sm:text-base transition">
        Book New Tests
      </button>
    </div>
  </div>

  <!-- Loading State -->
  <section *ngIf="isLoading()" class="mt-2">
    <div class="flex items-center justify-center min-h-[180px] text-gray-500">
      <i class="fa-solid fa-spinner fa-spin text-3xl mr-3"></i>
      <span class="text-lg">Loading…</span>
    </div>
  </section>

  <!-- Error -->
  <div *ngIf="errorMessage()" class="bg-red-900/40 border border-red-700 rounded-lg p-4 mb-6">
    <div class="flex gap-3">
      <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 
              00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd" />
      </svg>
      <p class="text-sm text-red-300">{{ errorMessage() }}</p>
    </div>
  </div>

  <!-- Empty State -->
  <div *ngIf="!isLoading() && !errorMessage() && bookings().length === 0" 
       class="text-center py-12 px-4">
       
    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 
           01.707.293l5.414 5.414a1 1 0 
           01.293.707V19a2 2 0 01-2 2z" />
    </svg>

    <h3 class="mt-3 text-gray-100 text-lg">No lab test bookings</h3>
    <p class="mt-1 text-gray-400 text-sm">You haven't booked any lab tests yet.</p>

    <button 
      (click)="navigateToBooking()"
      class="mt-5 inline-flex items-center px-4 py-2 text-sm sm:text-base rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow">
      Book Your First Test
    </button>
  </div>

  <!-- Bookings Grid -->
  <div *ngIf="!isLoading() && !errorMessage() && bookings().length > 0"
       class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

    <div *ngFor="let booking of bookings()" 
         class="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden transition hover:shadow-2xl">

      <!-- Header -->
      <div class="px-4 sm:px-6 py-4 bg-gray-700 border-b border-gray-600">
        <div class="flex justify-between items-start">
          
          <div>
            <h3 class="text-lg font-semibold text-gray-100">Booking #{{ booking.id }}</h3>
            <p class="text-sm text-gray-300 mt-1">Booked on {{ formatDate(booking.createdAt) }}</p>

            <p *ngIf="booking.prescribedBy" 
               class="text-sm text-gray-300 mt-1">
               Prescribed by: {{ booking.prescribedBy }}
            </p>
          </div>

          <div class="flex flex-col text-right">
            <span [class]="getStatusClass(booking.status)"
                  class="px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              {{ getStatusLabel(booking.status) }}
            </span>

            <p class="text-xl text-gray-100 font-bold mt-2">₹{{ booking.totalPrice }}</p>
          </div>

        </div>
      </div>

      <!-- Summary -->
      <div class="px-4 sm:px-6 py-4 text-gray-300 text-sm">
        <p><span class="font-medium">{{ booking.selectedTests.length }}</span> test(s)</p>
      </div>

      <!-- Footer Buttons -->
      <div class="px-4 sm:px-6 py-3 bg-gray-700 border-t border-gray-600">
        <div class="flex flex-wrap justify-end gap-3 text-sm">

          <button (click)="downloadReceipt(booking)"
            class="text-green-400 hover:text-green-300 flex items-center gap-1">
            <i class="fas fa-download"></i> Receipt
          </button>

          <button 
            (click)="viewBookingDetails(booking)"
            class="text-blue-400 hover:text-blue-300">
            Details
          </button>

          <button 
            *ngIf="booking.status === 'PENDING'"
            (click)="payForBooking(booking)"
            class="text-yellow-400 hover:text-yellow-300">
            Pay Now
          </button>

          <button 
            *ngIf="canCancelBooking(booking)"
            (click)="cancelBooking(booking)"
            class="text-red-400 hover:text-red-300">
            Cancel
          </button>

        </div>
      </div>
    </div>

  </div>

  <!-- Modal -->
  <div *ngIf="showDetailsModal()" 
       class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

    <div class="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

      <!-- Modal Header -->
      <div class="px-6 py-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-100">Booking Details</h2>

        <button (click)="closeDetailsModal()"
          class="text-gray-400 hover:text-gray-200 text-xl">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-6" *ngIf="selectedBooking() as booking">

        <!-- Booking Info Box -->
        <div class="bg-gray-700 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-100 mb-3">Booking Information</h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-400">Booking Date:</p>
              <p class="font-medium text-gray-100">{{ formatDate(booking.bookingDate) }}</p>
            </div>

            <div>
              <p class="text-gray-400">Patient:</p>
              <p class="font-medium text-gray-100">{{ booking.patientName }}</p>
            </div>

            <div>
              <p class="text-gray-400">Last Updated:</p>
              <p class="font-medium text-gray-100">{{ formatDate(booking.updatedAt) }}</p>
            </div>

            <div>
              <p class="text-gray-400">Status:</p>
              <span [class]="getStatusClass(booking.status)"
                    class="text-sm px-2 py-1 rounded-full">
                {{ getStatusLabel(booking.status) }}
              </span>
            </div>
          </div>

          <div *ngIf="booking.prescribedBy" class="mt-4">
            <p class="text-gray-400">Prescribed by:</p>
            <p class="font-medium text-gray-100">{{ booking.prescribedBy }}</p>
          </div>

          <div *ngIf="booking.notes" class="mt-4">
            <p class="text-gray-400">Notes:</p>
            <p class="font-medium text-gray-100">{{ booking.notes }}</p>
          </div>
        </div>

        <!-- Tests -->
        <div class="bg-gray-700 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-100 mb-3">Tests Included</h3>

          <div class="space-y-2">
            <div *ngFor="let test of booking.selectedTests" 
                 class="flex justify-between items-center py-2 border-b border-gray-600 last:border-b-0">
              <span class="text-gray-100">{{ test.testName }}</span>
              <span class="font-medium text-gray-100">₹{{ test.price }}</span>
            </div>
          </div>

          <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
            <span class="text-lg font-semibold text-gray-100">Total:</span>
            <span class="text-xl font-bold text-green-400">₹{{ booking.totalPrice }}</span>
          </div>
        </div>

        <!-- Modal Buttons -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-600">
          <button (click)="closeDetailsModal()"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white">
            Close
          </button>

          <button *ngIf="canCancelBooking(booking)"
            (click)="cancelBooking(booking); closeDetailsModal()"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
            Cancel Booking
          </button>

          <button *ngIf="booking.status === 'PENDING'"
            (click)="payForBooking(booking); closeDetailsModal()"
            class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
            Pay Now
          </button>
        </div>

      </div>
    </div>
  </div>
</div>


      <!-- Payment Popup -->
      <app-payment-popup
        *ngIf="showPaymentPopup()"
        [isVisible]="showPaymentPopup()"
        [amount]="paymentBooking()?.totalPrice || 0"
        [title]="'Payment for Booking #' + (paymentBooking()?.id || 0)"
        [patientId]="getPatientIdForPayment()"
        [bookingId]="paymentBooking()?.id"
        [paymentType]="'LAB_TEST'"
        (paymentSuccess)="onPaymentSuccess($event)"
        (paymentCancel)="onPaymentCancelled()"
      ></app-payment-popup>
    </app-patient-layout>
  `
})
export class PatientLabBookingsComponent implements OnInit {
  private labTestService = inject(LabTestService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private pdfService = inject(PdfService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);

  bookings = signal<BookingResponse[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  selectedBooking = signal<BookingResponse | null>(null);
  showDetailsModal = signal<boolean>(false);
  showPaymentPopup = signal<boolean>(false);
  paymentBooking = signal<BookingResponse | null>(null);

  ngOnInit() {
    this.loadBookings();
  }

  /**
   * Load all bookings for the current patient
   */
  loadBookings() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.labTestService.getUserBookings().subscribe({
      next: (bookings) => {
        // Sort bookings by creation date (newest first)
        const sortedBookings = bookings.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.bookings.set(sortedBookings);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        let errorMsg = 'Failed to load your lab test bookings. Please try again.';
        
        if (error.status === 401) {
          errorMsg = 'You are not authorized. Please login again.';
          this.authService.logout();
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
        
        this.errorMessage.set(errorMsg);
        this.toast.showError(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Navigate to lab test booking page
   */
  navigateToBooking() {
    this.router.navigate(['/lab-tests']);
  }

  /**
   * View detailed information about a booking
   */
  viewBookingDetails(booking: BookingResponse) {
    this.selectedBooking.set(booking);
    this.showDetailsModal.set(true);
  }

  /**
   * Close the booking details modal
   */
  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedBooking.set(null);
  }

  /**
   * Cancel a booking (if allowed)
   */
  cancelBooking(booking: BookingResponse) {
    if (!this.canCancelBooking(booking)) {
      return;
    }

    if (confirm(`Are you sure you want to cancel booking #${booking.id}?`)) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      this.labTestService.cancelBooking(booking.id).subscribe({
        next: (response) => {
          // Update the booking status locally with the response from server
          const updatedBookings = this.bookings().map(b => 
            b.id === booking.id ? response.booking : b
          );
          this.bookings.set(updatedBookings);
          this.isLoading.set(false);
          
          // Show success message via toast
          this.toast.showSuccess(`Booking #${booking.id} cancelled successfully.`);
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          let errorMsg = 'Failed to cancel booking. Please try again.';
          
          if (error.error?.error) {
            errorMsg = error.error.error;
          } else if (error.status === 401) {
            errorMsg = 'You are not authorized. Please login again.';
            this.authService.logout();
          } else if (error.status === 403) {
            errorMsg = 'You do not have permission to cancel this booking.';
          }
          
          this.errorMessage.set(errorMsg);
          this.toast.showError(errorMsg);
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Check if a booking can be cancelled
   */
  canCancelBooking(booking: BookingResponse): boolean {
    const status = booking.status?.toUpperCase();
    return status === 'PENDING' || status === 'SCHEDULED';
  }

  /**
   * Get CSS classes for booking status
   */
  getStatusClass(status: string): string {
    const s = (status || '').toUpperCase();
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    
    switch (s) {
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'SCHEDULED':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'IN_PROGRESS':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'CANCELLED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  /**
   * Get human-readable status label
   */
  getStatusLabel(status: string): string {
    const s = (status || '').toUpperCase();
    
    switch (s) {
      case 'PENDING':
        return 'Pending';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Download receipt for a booking
   */
  downloadReceipt(booking: BookingResponse) {
    // Use the unified PDF generation method
    this.pdfService.generateReceiptByBookingId(booking.id, booking);
  }

  /**
   * Get patient ID for payment processing
   */
  getPatientIdForPayment(): number {
    return parseInt(this.authService.userId() || '0');
  }

  /**
   * Initiate payment for a pending booking
   */
  payForBooking(booking: BookingResponse) {
    this.paymentBooking.set(booking);
    this.showPaymentPopup.set(true);
  }

  /**
   * Handle successful payment
   */
  onPaymentSuccess(paymentDetails: PaymentDetails) {
    console.log('Payment successful:', paymentDetails);
    
    // Payment has already been processed by the payment popup component
    // We only need to refresh the bookings to show the updated status
    this.loadBookings();
    
    // The payment popup component will handle showing the success modal
    // and closing itself after the user acknowledges the success
  }

  /**
   * Handle payment cancellation
   */
  onPaymentCancelled() {
    console.log('Payment cancelled');
    this.showPaymentPopup.set(false);
    this.paymentBooking.set(null);
  }
}
