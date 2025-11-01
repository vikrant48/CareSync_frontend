import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LabTestService, LabTest, BookingRequest } from '../../core/services/lab-test.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientProfileService, PatientDto } from '../../core/services/patient-profile.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PaymentService } from '../../core/services/payment.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PaymentPopupComponent, PaymentDetails } from '../../shared/payment-popup.component';

@Component({
  selector: 'app-lab-tests',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent, PatientLayoutComponent, PaymentPopupComponent],
  templateUrl: './lab-tests.component.html'
})
export class LabTestsComponent implements OnInit {
  private labTestService = inject(LabTestService);
  private authService = inject(AuthService);
  private patientService = inject(PatientProfileService);
  private appointmentService = inject(AppointmentService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);

  // Signals for reactive state management
  labTests = signal<LabTest[]>([]);
  selectedTestIds = signal<Set<number>>(new Set());
  isFullBodyCheckup = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isBooking = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Payment-related signals
  showPaymentPopup = signal<boolean>(false);
  pendingBookingRequest = signal<BookingRequest | null>(null);

  // Patient selection for doctors
  patients = signal<PatientDto[]>([]);
  selectedPatientId = signal<number | null>(null);
  isLoadingPatients = signal<boolean>(false);

  // Computed values
  selectedTests = computed(() => 
    this.labTests().filter(test => this.selectedTestIds().has(test.id))
  );

  totalPrice = computed(() => 
    this.labTestService.calculateTotalPrice(this.selectedTests())
  );

  selectedCount = computed(() => this.selectedTestIds().size);

  // Get current user role and info
  currentRole = computed(() => this.authService.role());
  currentUser = computed(() => this.authService.user());
  currentUsername = computed(() => this.authService.username());

  ngOnInit() {
    this.loadLabTests();
    // Load patients if user is a doctor
    if (this.currentRole() === 'DOCTOR') {
      this.loadPatients();
    }
  }

  /**
   * Load patients who have booked appointments with this doctor
   */
  loadPatients() {
    this.isLoadingPatients.set(true);
    
    this.appointmentService.getDoctorUniquePatients().subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.isLoadingPatients.set(false);
      },
      error: (error) => {
        console.error('Error loading doctor patients:', error);
        this.errorMessage.set('Failed to load patients. Please try again.');
        this.isLoadingPatients.set(false);
      }
    });
  }

  /**
   * Select a patient for booking (doctors only)
   */
  selectPatient(patientId: number) {
    this.selectedPatientId.set(patientId);
  }

  /**
   * Load all available lab tests from the API
   */
  loadLabTests() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.labTestService.getAllLabTests().subscribe({
      next: (tests) => {
        this.labTests.set(tests.filter(test => test.isActive));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading lab tests:', error);
        this.errorMessage.set('Failed to load lab tests. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Toggle selection of a specific test
   */
  toggleTestSelection(testId: number) {
    const currentSelection = new Set(this.selectedTestIds());
    
    if (currentSelection.has(testId)) {
      currentSelection.delete(testId);
    } else {
      currentSelection.add(testId);
    }
    
    this.selectedTestIds.set(currentSelection);
    
    // If not all tests are selected, uncheck full body checkup
    if (currentSelection.size !== this.labTests().length) {
      this.isFullBodyCheckup.set(false);
    }
  }

  /**
   * Select all available tests
   */
  selectAllTests() {
    const allTestIds = new Set(this.labTests().map(test => test.id));
    this.selectedTestIds.set(allTestIds);
    this.isFullBodyCheckup.set(true);
  }

  /**
   * Unselect all tests
   */
  unselectAllTests() {
    this.selectedTestIds.set(new Set());
    this.isFullBodyCheckup.set(false);
  }

  /**
   * Toggle full body checkup selection
   */
  toggleFullBodyCheckup() {
    const newValue = !this.isFullBodyCheckup();
    this.isFullBodyCheckup.set(newValue);
    
    if (newValue) {
      this.selectAllTests();
    } else {
      this.unselectAllTests();
    }
  }

  /**
   * Check if a test is selected
   */
  isTestSelected(testId: number): boolean {
    return this.selectedTestIds().has(testId);
  }

  /**
   * Book the selected tests
   */
  bookTests() {
    if (this.selectedTestIds().size === 0) {
      this.errorMessage.set('Please select at least one test to book.');
      return;
    }

    // For doctors, ensure a patient is selected
    if (this.currentRole() === 'DOCTOR' && !this.selectedPatientId()) {
      this.errorMessage.set('Please select a patient for the booking.');
      return;
    }

    // Clear any previous messages
    this.errorMessage.set('');
    this.successMessage.set('');

    // Create booking request
    const bookingRequest: BookingRequest = {
      selectedTestIds: Array.from(this.selectedTestIds()),
      isFullBodyCheckup: this.isFullBodyCheckup(),
      patientId: this.currentRole() === 'DOCTOR' ? this.selectedPatientId() : null
    };

    // For patients, show payment popup before creating booking
    if (this.currentRole() === 'PATIENT') {
      this.pendingBookingRequest.set(bookingRequest);
      this.showPaymentPopup.set(true);
    } else {
      // For doctors, create booking directly (no payment required)
      this.createDoctorBooking(bookingRequest);
    }
  }

  /**
   * Get patient ID for payment processing
   * For patients: use their own ID
   * For doctors: use selected patient ID
   */
  getPatientIdForPayment(): number | undefined {
    if (this.currentRole() === 'PATIENT') {
      return this.currentUser()?.id;
    } else if (this.currentRole() === 'DOCTOR') {
      return this.selectedPatientId() || undefined;
    }
    return undefined;
  }

  /**
   * Handle successful payment
   */
  onPaymentSuccess(paymentDetails: PaymentDetails) {
    console.log('Payment successful for lab test booking:', paymentDetails);
    
    // Get the pending booking request
    const bookingRequest = this.pendingBookingRequest();
    
    if (!bookingRequest) {
      this.errorMessage.set('No pending booking request found.');
      return;
    }
    
    // Create the booking after successful payment
    this.createPatientBookingWithPayment(bookingRequest, paymentDetails);
    
    // // Close the payment popup after a delay to allow success modal to show
    // setTimeout(() => {
    //   this.closePaymentPopup();
    // }, 3000); // Give time for user to see the success modal
  }

  /**
   * Handle payment cancellation or popup closure
   */
  onPaymentCancel() {
    this.closePaymentPopup();
  }

  /**
   * Close payment popup and clear pending request
   */
  closePaymentPopup() {
    this.showPaymentPopup.set(false);
    this.pendingBookingRequest.set(null);
  }

  /**
   * Create patient booking with integrated payment
   */
  private createPatientBookingWithPayment(bookingRequest: BookingRequest, paymentDetails: PaymentDetails) {
    this.isBooking.set(true);

    // Build payment request according to PaymentRequest interface
    const paymentRequest: any = {
      amount: this.totalPrice(),
      description: `Lab tests booking - ${this.selectedTests().map(t => t.testName).join(', ')}`,
      paymentMethod: paymentDetails.method.toUpperCase() as 'UPI' | 'CARD' | 'QR_CODE',
      paymentType: 'LAB_TEST', // Required field for payment type
      patientId: parseInt(this.authService.userId() || '0'),
      currency: 'INR'
    };

    // Add method-specific details
    if (paymentDetails.method === 'upi' && paymentDetails.upiId) {
      paymentRequest.upiId = paymentDetails.upiId;
    } else if (paymentDetails.method === 'card' && paymentDetails.cardDetails) {
      // Parse expiry date (MM/YY format) to month and year
      const [month, year] = (paymentDetails.cardDetails.expiryDate || '').split('/');
      paymentRequest.cardDetails = {
        cardNumber: paymentDetails.cardDetails.cardNumber,
        expiryMonth: month || '',
        expiryYear: year ? `20${year}` : '', // Convert YY to YYYY
        cvv: paymentDetails.cardDetails.cvv || '',
        cardholderName: paymentDetails.cardDetails.cardholderName || ''
      };
    }

    const patientBookingWithPayment = {
      bookingRequest,
      paymentRequest
    };

    this.labTestService.createPatientBookingWithPayment(patientBookingWithPayment).subscribe({
      next: (response) => {
        this.successMessage.set('Booking created successfully with payment!');
        this.clearSelections();
        this.isBooking.set(false);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating booking with payment:', error);
        let errorMsg = 'Failed to create booking with payment. Please try again.';
        
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 401) {
          errorMsg = 'You are not authorized. Please login again.';
          this.authService.logout();
        } else if (error.status === 403) {
          errorMsg = 'You do not have permission to book tests.';
        }
        
        this.errorMessage.set(errorMsg);
        this.isBooking.set(false);
      }
    });
  }

  /**
   * Create doctor booking without payment
   */
  private createDoctorBooking(bookingRequest: BookingRequest) {
    this.isBooking.set(true);

    this.labTestService.createDoctorBooking(bookingRequest).subscribe({
      next: (response) => {
        this.successMessage.set('Booking created successfully! Patient can pay later.');
        this.clearSelections();
        this.isBooking.set(false);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating doctor booking:', error);
        let errorMsg = 'Failed to create booking. Please try again.';
        
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 401) {
          errorMsg = 'You are not authorized. Please login again.';
          this.authService.logout();
        } else if (error.status === 403) {
          errorMsg = 'You do not have permission to book tests.';
        }
        
        this.errorMessage.set(errorMsg);
        this.isBooking.set(false);
      }
    });
  }

  /**
   * Create booking after payment confirmation (Legacy method - now routes to appropriate method)
   */
  private createBooking(bookingRequest: BookingRequest, transactionId?: string) {
    // Route to appropriate booking method based on user role
    if (this.currentRole() === 'PATIENT') {
      // This shouldn't be called for patients anymore, but keeping for backward compatibility
      console.warn('Legacy createBooking called for patient - should use createPatientBookingWithPayment');
      this.isBooking.set(true);
      this.labTestService.createBooking(bookingRequest).subscribe({
        next: (response) => {
          this.successMessage.set('Booking created successfully!');
          this.clearSelections();
          this.isBooking.set(false);
          
          setTimeout(() => {
            this.successMessage.set('');
          }, 3000);
        },
        error: (error) => {
          console.error('Error creating booking:', error);
          this.errorMessage.set('Failed to create booking. Please try again.');
          this.isBooking.set(false);
        }
      });
    } else {
      // For doctors, use the new doctor booking method
      this.createDoctorBooking(bookingRequest);
    }
  }

  /**
   * Clear all selections
   */
  clearSelections() {
    this.selectedTestIds.set(new Set());
    this.isFullBodyCheckup.set(false);
    if (this.currentRole() === 'DOCTOR') {
      this.selectedPatientId.set(null);
    }
  }

  /**
   * Get selected patient name for display
   */
  getSelectedPatientName(): string {
    const selectedId = this.selectedPatientId();
    if (!selectedId) return '';
    
    const patient = this.patients().find(p => p.id === selectedId);
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
  }

  /**
   * Clear messages
   */
  clearMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return `₹${price.toFixed(2)}`;
  }

  /**
   * Get prescriber name based on user role
   */
  getPrescriberName(): string {
    const role = this.currentRole();
    const user = this.currentUser();
    
    if (role === 'DOCTOR' && user) {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      return `Dr. ${firstName} ${lastName}`.trim();
    } else {
      return 'Self';
    }
  }

  /**
   * Navigate to lab bookings page
   */
  navigateToBooking() {
    this.router.navigate(['/patient/lab-bookings']);
  }

  /**
   * Track function for ngFor to optimize rendering
   */
  trackByTestId(index: number, test: LabTest): number {
    return test.id;
  }
}