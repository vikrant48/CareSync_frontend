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
import { ConfirmService } from '../../core/services/confirm.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';

@Component({
  selector: 'app-patient-lab-bookings',
  standalone: true,
  imports: [CommonModule, PatientLayoutComponent, PaymentPopupComponent, PageHeaderComponent, SkeletonComponent, StatusBadgeComponent, EmptyStateComponent, ModalShellComponent],
  templateUrl: './patient-lab-bookings.component.html',
  styleUrl: './patient-lab-bookings.component.css'
})
export class PatientLabBookingsComponent implements OnInit {
  private labTestService = inject(LabTestService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private pdfService = inject(PdfService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  bookings = signal<BookingResponse[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  selectedBooking = signal<BookingResponse | null>(null);
  showDetailsModal = signal<boolean>(false);
  showPaymentPopup = signal<boolean>(false);
  paymentBooking = signal<BookingResponse | null>(null);

  // File upload signals
  isUploading = signal<boolean>(false);
  uploadBookingId = signal<number | null>(null);

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
  async cancelBooking(booking: BookingResponse) {
    if (!this.canCancelBooking(booking)) {
      return;
    }

    const ok = await this.confirm.ask({
      title: 'Cancel booking',
      message: `Are you sure you want to cancel booking #${booking.id}?`,
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep',
      danger: true,
    });
    if (!ok) return;

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

        this.toast.showError(errorMsg);
        this.isLoading.set(false);
      }
    });
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
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium border';

    switch (s) {
      case 'PENDING':
        return `${baseClasses} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`;
      case 'SCHEDULED':
        return `${baseClasses} bg-blue-500/10 text-blue-500 border-blue-500/20`;
      case 'IN_PROGRESS':
        return `${baseClasses} bg-purple-500/10 text-purple-500 border-purple-500/20`;
      case 'COMPLETED':
        return `${baseClasses} bg-green-500/10 text-green-500 border-green-500/20`;
      case 'CANCELLED':
        return `${baseClasses} bg-red-500/10 text-red-500 border-red-500/20`;
      default:
        return `${baseClasses} bg-gray-500/10 text-gray-400 border-gray-500/20`;
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

  /**
   * Handle file selection for lab report upload
   */
  onFileSelected(event: any, booking: BookingResponse) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset file input value so change event fires again for same file
    event.target.value = '';

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.toast.showError('File size exceeds 5MB limit');
      return;
    }

    this.isUploading.set(true);
    this.uploadBookingId.set(booking.id);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bookingId', booking.id.toString());
    formData.append('patientId', booking.patientId.toString());
    formData.append('description', `Lab Report for Booking #${booking.id}`);

    this.labTestService.uploadLabReport(formData).subscribe({
      next: (response) => {
        this.toast.showSuccess('Lab report uploaded successfully');
        this.isUploading.set(false);
        this.uploadBookingId.set(null);
        // Optionally reload bookings or update the specific booking
        this.loadBookings();
      },
      error: (error) => {
        console.error('Error uploading report:', error);
        const errorMsg = typeof error.error === 'string' ? error.error : (error.error?.message || 'Failed to upload lab report');
        this.toast.showError(errorMsg);
        this.isUploading.set(false);
        this.uploadBookingId.set(null);
      }
    });
  }
}
