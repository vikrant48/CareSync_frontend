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
      <div class="max-w-6xl mx-auto px-4 pb-24">
        <!-- Header -->
        <div class="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-100 tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              My Lab Test Bookings
            </h1>
            <p class="text-gray-400 mt-1">View and manage your diagnostic test appointments</p>
          </div>

          <div class="flex items-center gap-3 w-full md:w-auto">
            <button (click)="loadBookings()" 
                    class="btn-secondary !py-2.5 flex items-center gap-2 justify-center flex-1 md:flex-none">
              <i class="fas fa-rotate-right" [class.fa-spin]="isLoading()"></i>
              <span>Refresh</span>
            </button>

            <button (click)="navigateToBooking()" 
                    class="btn-primary !py-2.5 flex items-center gap-2 justify-center flex-1 md:flex-none shadow-lg shadow-blue-500/20">
              <i class="fas fa-plus"></i>
              <span>Book New Test</span>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
           <div class="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
           <p class="text-gray-400 animate-pulse">Loading your bookings...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="errorMessage()" class="bg-red-900/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-4">
          <div class="p-2 bg-red-500/20 rounded-lg text-red-400">
             <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <h3 class="font-bold text-red-400">Error Loading Bookings</h3>
            <p class="text-red-300/80 text-sm mt-1">{{ errorMessage() }}</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading() && !errorMessage() && bookings().length === 0" 
             class="flex flex-col items-center justify-center py-20 text-center bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-2xl border-dashed">
          <div class="w-24 h-24 bg-gray-800/80 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-gray-700">
            <i class="fas fa-file-medical text-4xl text-gray-600"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-200 mb-2">No Bookings Found</h3>
          <p class="text-gray-400 max-w-md mx-auto mb-8">You haven't booked any lab tests yet. Your upcoming and past test bookings will appear here.</p>
          <button (click)="navigateToBooking()" 
                  class="btn-primary py-3 px-8 shadow-lg shadow-blue-600/20 transform hover:-translate-y-1 transition-all duration-300">
            Book Your First Test
          </button>
        </div>

        <!-- Bookings Grid -->
        <div *ngIf="!isLoading() && !errorMessage() && bookings().length > 0" 
             class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <div *ngFor="let booking of bookings()" 
               class="group bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 flex flex-col">
            
            <!-- Card Header -->
            <div class="p-5 border-b border-gray-700/50 bg-gray-800/30">
              <div class="flex justify-between items-start mb-2">
                <div>
                   <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Booking ID</span>
                   <h3 class="text-lg font-bold text-gray-100 font-mono">#{{ booking.id }}</h3>
                </div>
                <div [class]="getStatusClass(booking.status)" class="px-3 py-1 rounded-full text-xs font-bold border border-current/20 shadow-sm">
                  {{ getStatusLabel(booking.status) }}
                </div>
              </div>
              
              <div class="flex items-center gap-2 text-sm text-gray-400 mt-3">
                <i class="far fa-calendar-alt text-blue-400"></i>
                <span>{{ formatDate(booking.createdAt) }}</span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="p-5 flex-1">
              <div class="space-y-3">
                 <div class="flex justify-between items-center text-sm">
                   <span class="text-gray-400">Tests</span>
                   <span class="text-gray-200 font-medium">{{ booking.selectedTests.length }} Test(s)</span>
                 </div>
                 
                 <div class="flex justify-between items-center text-sm" *ngIf="booking.prescribedBy">
                   <span class="text-gray-400">Prescribed By</span>
                   <span class="text-blue-300">{{ booking.prescribedBy }}</span>
                 </div>
                 
                 <div class="pt-3 mt-3 border-t border-gray-700/50 flex justify-between items-end">
                   <span class="text-gray-400 text-sm">Total Amount</span>
                   <span class="text-xl font-bold text-green-400">₹{{ booking.totalPrice }}</span>
                 </div>
              </div>
            </div>

            <!-- Card Footer (Actions) -->
            <div class="p-4 bg-gray-800/50 border-t border-gray-700/50 flex flex-wrap gap-2 justify-end">
              <button (click)="viewBookingDetails(booking)" 
                      class="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="View Details">
                 <i class="fas fa-eye"></i>
              </button>
              
              <button (click)="downloadReceipt(booking)" 
                      class="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Download Receipt">
                 <i class="fas fa-download"></i>
              </button>

              <button *ngIf="canCancelBooking(booking)" 
                      (click)="cancelBooking(booking)" 
                      class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Cancel Booking">
                 <i class="fas fa-times-circle"></i>
              </button>

              <button *ngIf="(booking.status === 'COMPLETED' || booking.status === 'IN_PROGRESS') && (!booking.labReports || booking.labReports.length === 0)" 
                      (click)="fileInput.click()" 
                      class="px-3 py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/50 rounded-lg text-sm font-medium hover:bg-blue-500 hover:text-white transition-all duration-300 flex items-center gap-2">
                 <i class="fas fa-upload" [class.fa-spinner]="isUploading() && uploadBookingId() === booking.id" [class.fa-spin]="isUploading() && uploadBookingId() === booking.id"></i>
                 <span>{{ isUploading() && uploadBookingId() === booking.id ? 'Uploading...' : 'Upload Report' }}</span>
              </button>
              
              <a *ngIf="booking.labReports && booking.labReports.length > 0" 
                 [href]="booking.labReports[0].fileUrl" 
                 target="_blank"
                 class="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/50 rounded-lg text-sm font-medium hover:bg-green-500 hover:text-white transition-all duration-300 flex items-center gap-2">
                 <i class="fas fa-eye"></i>
                 <span>View Report</span>
              </a>

              <input #fileInput type="file" class="hidden" (change)="onFileSelected($event, booking)" accept=".pdf,.jpg,.jpeg,.png">

              <button *ngIf="booking.status === 'PENDING'" 
                      (click)="payForBooking(booking)"
                      class="ml-auto px-4 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 rounded-lg text-sm font-medium hover:bg-yellow-500 text-white transition-all duration-300">
                 Pay Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Modal -->
      <div *ngIf="showDetailsModal()" class="fixed inset-0 z-50 flex items-center justify-center text-white p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" (click)="closeDetailsModal()"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
          
          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
            <div>
               <h2 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Booking Details</h2>
               <p class="text-xs text-gray-400 mt-1 font-mono">ID: #{{ selectedBooking()?.id }}</p>
            </div>
            <button (click)="closeDetailsModal()" class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <ng-container *ngIf="selectedBooking() as booking">
            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
               
               <!-- Status Banner -->
               <div class="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <div class="flex items-center gap-3">
                     <div [class]="getStatusClass(booking.status)" class="w-10 h-10 rounded-full flex items-center justify-center border border-current/30">
                        <i class="fas" [ngClass]="{
                          'fa-clock': booking.status === 'PENDING',
                          'fa-calendar-check': booking.status === 'SCHEDULED',
                          'fa-check-circle': booking.status === 'COMPLETED',
                          'fa-times-circle': booking.status === 'CANCELLED',
                          'fa-spinner fa-spin': booking.status === 'IN_PROGRESS'
                        }"></i>
                     </div>
                     <div>
                       <p class="text-xs text-gray-400 uppercase tracking-wide">Current Status</p>
                       <p class="font-bold text-lg">{{ getStatusLabel(booking.status) }}</p>
                     </div>
                  </div>
                  
                  <div class="text-right">
                     <p class="text-xs text-gray-400 uppercase tracking-wide">Last Updated</p>
                     <p class="font-medium text-sm">{{ formatDate(booking.updatedAt) }}</p>
                  </div>
               </div>

               <!-- Info Grid -->
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                     <p class="text-xs text-gray-400 uppercase mb-1">Patient</p>
                     <p class="font-semibold text-gray-200">{{ booking.patientName }}</p>
                  </div>
                  <div class="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                     <p class="text-xs text-gray-400 uppercase mb-1">Booking Date</p>
                     <p class="font-semibold text-gray-200">{{ formatDate(booking.bookingDate) }}</p>
                  </div>
                  <div class="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30" *ngIf="booking.prescribedBy">
                     <p class="text-xs text-gray-400 uppercase mb-1">Prescribed By</p>
                     <p class="font-semibold text-blue-300">{{ booking.prescribedBy }}</p>
                  </div>
                  <div class="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30" *ngIf="booking.notes">
                     <p class="text-xs text-gray-400 uppercase mb-1">Notes</p>
                     <p class="font-semibold text-gray-300 italic">"{{ booking.notes }}"</p>
                  </div>
               </div>

               <!-- Tests List -->
               <div>
                  <h3 class="text-lg font-bold text-gray-200 mb-3 flex items-center gap-2">
                     <i class="fas fa-list-ul text-blue-500"></i> Selected Tests
                  </h3>
                  <div class="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50">
                     <div *ngFor="let test of booking.selectedTests" class="p-4 border-b border-gray-700/50 last:border-0 flex justify-between items-center hover:bg-gray-800/80 transition-colors">
                        <span class="text-gray-200 font-medium">{{ test.testName }}</span>
                        <span class="text-gray-300 font-mono">₹{{ test.price }}</span>
                     </div>
                     <div class="p-4 bg-gray-800/80 flex justify-between items-center border-t border-gray-700">
                        <span class="font-bold text-gray-400">Total Amount</span>
                        <span class="text-xl font-bold text-green-400">₹{{ booking.totalPrice }}</span>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-5 border-t border-gray-800 bg-gray-800/50 flex justify-end gap-3">
               <button (click)="closeDetailsModal()" class="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 transition-all">
                  Close
               </button>

               <button *ngIf="canCancelBooking(booking)" (click)="cancelBooking(booking); closeDetailsModal()" class="px-5 py-2.5 rounded-xl bg-red-900/30 border border-red-500/50 text-red-400 font-medium hover:bg-red-900/50 hover:text-red-300 transition-all">
                  Cancel Booking
               </button>

               <button *ngIf="booking.status === 'PENDING'" (click)="payForBooking(booking); closeDetailsModal()" class="px-5 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-medium shadow-lg shadow-yellow-600/20 transition-all">
                  Proceed to Payment
               </button>
            </div>
          </ng-container>

        </div>
      </div>

      <!-- Payment Popup -->
      <app-payment-popup *ngIf="showPaymentPopup()" [isVisible]="showPaymentPopup()" [amount]="paymentBooking()?.totalPrice || 0"
            [title]="'Payment for Booking #' + (paymentBooking()?.id || 0)" [patientId]="getPatientIdForPayment()" 
            [bookingId]="paymentBooking()?.id" [paymentType]="'LAB_TEST'" (paymentSuccess)="onPaymentSuccess($event)" 
            (paymentCancel)="onPaymentCancelled()">
      </app-payment-popup>
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
        let errorMsg = 'Failed to upload lab report';
        if (error.error?.message) {
          errorMsg = error.error.message;
        }
        this.toast.showError(errorMsg);
        this.isUploading.set(false);
        this.uploadBookingId.set(null);
      }
    });
  }
}
