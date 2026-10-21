import { DocumentOpenerService } from '../../core/services/document-opener.service';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LabTestService, BookingResponse } from '../../core/services/lab-test.service';
import { AuthService } from '../../core/services/auth.service';
import { PdfService, PaymentReceiptData } from '../../core/services/pdf.service';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentPopupComponent, PaymentDetails } from '../../shared/payment-popup.component';
import { LabReportExplainerComponent } from '../../shared/lab-report-explainer.component';
import { ToastService } from '../../core/services/toast.service';
import { AiAssistantService } from '../../core/services/ai-assistant.service';
import { LabReportExplanation, VisionScanResponse } from '../../core/models/ai.models';
import { shrinkImageIfLarge } from '../../shared/utils/image-shrink.util';
import { ConfirmService } from '../../core/services/confirm.service';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';
import { PageContainerComponent } from '../../shared/ui/page-container.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { InrPipe } from '../../shared/utils/inr.pipe';
import { extractApiError } from '../../shared/utils/api-error.util';
import { trackById } from '../../shared/utils/track-by';

@Component({
  selector: 'app-patient-lab-bookings',
  standalone: true,
  imports: [InrPipe, PageHeaderComponent, PageContainerComponent, CommonModule, PaymentPopupComponent, PageLoaderComponent, StatusBadgeComponent, EmptyStateComponent, ModalShellComponent, FilterBarComponent, LabReportExplainerComponent],
  // View state is all signals (bookings, filters, upload/scan, payment), so OnPush needs no manual markForCheck
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-lab-bookings.component.html',
  styleUrl: './patient-lab-bookings.component.css'
})
export class PatientLabBookingsComponent implements OnInit {
  readonly trackById = trackById;
  private labTestService = inject(LabTestService);
  private documentOpener = inject(DocumentOpenerService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private pdfService = inject(PdfService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private ai = inject(AiAssistantService);

  bookings = signal<BookingResponse[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  selectedBooking = signal<BookingResponse | null>(null);
  showDetailsModal = signal<boolean>(false);
  showPaymentPopup = signal<boolean>(false);
  paymentBooking = signal<BookingResponse | null>(null);

  // Filter & Sort signals
  statusFilter = signal<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  sortOption = signal<'latest' | 'oldest' | 'amount-high' | 'amount-low'>('latest');

  readonly bookingFilterConfigs: FilterConfig[] = [
    {
      type: 'radio',
      key: 'statusFilter',
      label: 'Status',
      defaultValue: 'ALL',
      width: 'w-full sm:w-auto sm:flex-1 min-w-0',
      options: [
        { label: 'All', value: 'ALL' },
        { label: 'Upcoming', value: 'UPCOMING' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    {
      type: 'select',
      key: 'sortOption',
      label: 'Sort',
      defaultValue: 'latest',
      width: 'w-full sm:w-56',
      clearable: false,
      options: [
        { label: 'Latest', value: 'latest' },
        { label: 'Oldest', value: 'oldest' },
        { label: 'Price: High to Low', value: 'amount-high' },
        { label: 'Price: Low to High', value: 'amount-low' }
      ]
    }
  ];

  bookingFilterValues: Record<string, string> = {
    statusFilter: 'ALL',
    sortOption: 'latest'
  };

  // File upload signals
  isUploading = signal<boolean>(false);
  uploadBookingId = signal<number | null>(null);
  classifyingReport = signal<boolean>(false);
  extractedReport = signal<VisionScanResponse | null>(null);
  extractedBookingId = signal<number | null>(null);

  /** AI explanation shown below a booking card (one open at a time) */
  explanations = signal<Record<number, LabReportExplanation>>({});
  expandedExplanationId = signal<number | null>(null);

  /** Why a report could not be explained, shown in the same place below the card */
  explanationErrors = signal<Record<number, string>>({});

  onReportExplained(bookingId: number, explanation: LabReportExplanation) {
    this.explanations.update(all => ({ ...all, [bookingId]: explanation }));
    this.explanationErrors.update(all => ({ ...all, [bookingId]: '' }));
  }

  onExplanationFailed(bookingId: number, message: string) {
    this.explanationErrors.update(all => ({ ...all, [bookingId]: message }));
  }

  onExplanationToggled(bookingId: number, open: boolean) {
    this.expandedExplanationId.set(open ? bookingId : null);
  }

  // Computed counts
  get totalCount(): number {
    return this.bookings().length;
  }

  get upcomingCount(): number {
    return this.bookings().filter(b => {
      const s = (b.status || '').toUpperCase();
      return s === 'UPCOMING' || s === 'PENDING' || s === 'SCHEDULED';
    }).length;
  }

  get completedCount(): number {
    return this.bookings().filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length;
  }

  get cancelledCount(): number {
    return this.bookings().filter(b => (b.status || '').toUpperCase() === 'CANCELLED').length;
  }

  // Filtered & Sorted Bookings
  readonly filteredBookings = computed((): BookingResponse[] => {
    let list = [...this.bookings()];

    // Apply Status Filter
    const sf = this.statusFilter();
    if (sf === 'UPCOMING') {
      list = list.filter(b => {
        const s = (b.status || '').toUpperCase();
        return s === 'UPCOMING' || s === 'PENDING' || s === 'SCHEDULED';
      });
    } else if (sf === 'COMPLETED') {
      list = list.filter(b => (b.status || '').toUpperCase() === 'COMPLETED');
    } else if (sf === 'CANCELLED') {
      list = list.filter(b => (b.status || '').toUpperCase() === 'CANCELLED');
    }

    // Apply Sorting
    const sort = this.sortOption();
    if (sort === 'latest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === 'amount-high') {
      list.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
    } else if (sort === 'amount-low') {
      list.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
    }

    return list;
  });

  constructor() {
    effect(() => {
      const status = this.bookingFilterConfigs.find((c) => c.key === 'statusFilter');
      if (!status) return;
      status.options = [
        { label: `All (${this.totalCount})`, value: 'ALL' },
        { label: `Upcoming (${this.upcomingCount})`, value: 'UPCOMING' },
        { label: `Completed (${this.completedCount})`, value: 'COMPLETED' },
        { label: `Cancelled (${this.cancelledCount})`, value: 'CANCELLED' }
      ];
    });
  }

  onBookingFilterChange(values: Record<string, string>) {
    const status = values['statusFilter'] || 'ALL';
    if (status === 'UPCOMING' || status === 'COMPLETED' || status === 'CANCELLED' || status === 'ALL') {
      this.statusFilter.set(status);
    }
    const sort = values['sortOption'] || 'latest';
    if (sort === 'latest' || sort === 'oldest' || sort === 'amount-high' || sort === 'amount-low') {
      this.sortOption.set(sort);
    }
  }

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
        } else {
          errorMsg = extractApiError(error, errorMsg);
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
  async onFileSelected(event: any, booking: BookingResponse) {
    const picked: File | undefined = event.target.files[0];
    if (!picked) return;
    event.target.value = '';
    // Camera photos are often bigger than the limit: shrink large images first
    const file = await shrinkImageIfLarge(picked);
    if (file.size > 5 * 1024 * 1024) {
      this.toast.showError('File size exceeds 5MB limit');
      return;
    }

    this.classifyingReport.set(true);
    this.uploadBookingId.set(booking.id);
    this.extractedReport.set(null);
    this.extractedBookingId.set(booking.id);
    this.ai.scanMedicalDocument(file).subscribe({
      next: scan => {
        this.extractedReport.set(scan);
        this.classifyingReport.set(false);
        this.uploadLabReport(file, booking);
      },
      error: () => {
        this.extractedReport.set({ success: false, error: 'The report was uploaded, but its fields could not be extracted.' });
        this.classifyingReport.set(false);
        this.uploadLabReport(file, booking);
      }
    });
  }

  private uploadLabReport(file: File, booking: BookingResponse) {
    this.isUploading.set(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bookingId', booking.id.toString());
    formData.append('patientId', booking.patientId.toString());
    formData.append('description', `Lab Report for Booking #${booking.id}`);
    this.labTestService.uploadLabReport(formData).subscribe({
      next: () => {
        this.toast.showSuccess('Lab report uploaded. Review the extracted fields.');
        this.isUploading.set(false);
        this.uploadBookingId.set(null);
        this.loadBookings();
      },
      error: (error) => {
        this.toast.showError(extractApiError(error, 'Failed to upload lab report'));
        this.isUploading.set(false);
        this.uploadBookingId.set(null);
      }
    });
  }

  extractedFieldSummary(): string {
    const scan = this.extractedReport();
    if (!scan?.labResults?.length) return '';
    return scan.labResults.map(item =>
      [item.testName, item.resultValue, item.referenceRange, item.status].filter(Boolean).join(' · ')
    ).join('\n');
  }

  /** Lab reports are private files: fetch a fresh copy instead of using a link that may have expired. */
  openLabReport(booking: { labReports?: { id: number; url?: string; cloudinaryUrl?: string }[] }) {
    const report = booking.labReports?.[0];
    if (report) {
      this.documentOpener.open(report.id, report.cloudinaryUrl || report.url);
    }
  }
}
