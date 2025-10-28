import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { PaymentService, PaymentRequest } from '../core/services/payment.service';
import { PaymentSuccessModalComponent } from './payment-success-modal.component';
import { LabTest, LabTestService } from '../core/services/lab-test.service';

export interface PaymentDetails {
  method: 'upi' | 'card' | 'qr';
  amount: number;
  upiId?: string;
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
  transactionId?: string;
  patientId?: number;
  bookingId?: number;
}

@Component({
  selector: 'app-payment-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentSuccessModalComponent],
  template: `
    <div *ngIf="isVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="px-6 py-4 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-100">Payment</h2>
          <button 
            (click)="closePayment()"
            class="text-gray-400 hover:text-gray-200 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Amount Display -->
          <div class="bg-gray-700 rounded-lg p-4 mb-6">
            <div class="text-center">
              <p class="text-gray-400 text-sm">Total Amount</p>
              <p class="text-2xl font-bold text-green-400">₹{{ amount }}</p>
            </div>
          </div>

          <!-- Payment Recipient Info -->
          <div class="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
            <div class="flex items-center">
              <i class="fas fa-info-circle text-blue-400 mr-3"></i>
              <div>
                <p class="text-blue-300 font-medium">Payment will be sent to:</p>
                <p class="text-blue-100 font-semibold">{{ merchantUpiId }}</p>
                <p class="text-blue-300 text-sm">CareSync Healthcare Services</p>
              </div>
            </div>
          </div>

          <!-- Payment Method Selection -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-100 mb-4">Select Payment Method</h3>
            <div class="space-y-3">
              <!-- UPI Payment -->
              <div class="border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                   [class.border-blue-500]="selectedMethod() === 'upi'"
                   (click)="selectPaymentMethod('upi')">
                <div class="flex items-center">
                  <input type="radio" 
                         [checked]="selectedMethod() === 'upi'"
                         class="text-blue-500 focus:ring-blue-500">
                  <div class="ml-3">
                    <p class="text-gray-100 font-medium">UPI Payment</p>
                    <p class="text-gray-400 text-sm">Pay using UPI ID or scan QR code</p>
                  </div>
                  <i class="fas fa-mobile-alt text-blue-400 ml-auto text-xl"></i>
                </div>
              </div>

              <!-- QR Code Payment -->
              <div class="border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                   [class.border-blue-500]="selectedMethod() === 'qr'"
                   (click)="selectPaymentMethod('qr')">
                <div class="flex items-center">
                  <input type="radio" 
                         [checked]="selectedMethod() === 'qr'"
                         class="text-blue-500 focus:ring-blue-500">
                  <div class="ml-3">
                    <p class="text-gray-100 font-medium">QR Code</p>
                    <p class="text-gray-400 text-sm">Scan QR code to pay</p>
                  </div>
                  <i class="fas fa-qrcode text-green-400 ml-auto text-xl"></i>
                </div>
              </div>

              <!-- Card Payment -->
              <div class="border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                   [class.border-blue-500]="selectedMethod() === 'card'"
                   (click)="selectPaymentMethod('card')">
                <div class="flex items-center">
                  <input type="radio" 
                         [checked]="selectedMethod() === 'card'"
                         class="text-blue-500 focus:ring-blue-500">
                  <div class="ml-3">
                    <p class="text-gray-100 font-medium">Credit/Debit Card</p>
                    <p class="text-gray-400 text-sm">Pay using your card</p>
                  </div>
                  <i class="fas fa-credit-card text-purple-400 ml-auto text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Details Section -->
          <div *ngIf="selectedMethod()" class="mb-6">
            
            <!-- UPI Payment Details -->
            <div *ngIf="selectedMethod() === 'upi'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Enter UPI ID</label>
                <input 
                  type="text" 
                  [(ngModel)]="upiId"
                  placeholder="example@upi"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <!-- QR Code Payment -->
            <div *ngIf="selectedMethod() === 'qr'" class="text-center">
              <div class="bg-white p-4 rounded-lg inline-block mb-4">
                <div class="w-48 h-48 bg-gray-200 flex items-center justify-center">
                  <!-- QR Code would be generated here -->
                  <div class="text-center">
                    <i class="fas fa-qrcode text-6xl text-gray-600 mb-2"></i>
                    <p class="text-gray-600 text-sm">QR Code</p>
                    <p class="text-gray-600 text-xs">₹{{ amount }}</p>
                    <p class="text-gray-600 text-xs">{{ merchantUpiId }}</p>
                  </div>
                </div>
              </div>
              <p class="text-gray-400 text-sm mb-2">Scan this QR code with any UPI app to pay ₹{{ amount }}</p>
            </div>

            <!-- Card Payment Details -->
            <div *ngIf="selectedMethod() === 'card'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Card Number</label>
                <input 
                  type="text" 
                  [(ngModel)]="cardDetails.cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Expiry Date</label>
                  <input 
                    type="text" 
                    [(ngModel)]="cardDetails.expiryDate"
                    placeholder="MM/YY"
                    maxlength="5"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">CVV</label>
                  <input 
                    type="text" 
                    [(ngModel)]="cardDetails.cvv"
                    placeholder="123"
                    maxlength="3"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Cardholder Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="cardDetails.cardholderName"
                  placeholder="John Doe"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="isProcessing()" class="text-center py-4">
            <div class="inline-flex items-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              <span class="text-gray-300">Processing payment...</span>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage()" class="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
            {{ errorMessage() }}
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3">
            <button 
              (click)="closePayment()"
              [disabled]="isProcessing()"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button 
              (click)="processPayment()"
              [disabled]="!canProcessPayment() || isProcessing()"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {{ selectedMethod() === 'card' ? 'Pay Now' : 'Confirm Payment' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Success Modal -->
    <app-payment-success-modal
      [isVisible]="showSuccessModal()"
      [paymentDetails]="successPaymentDetails"
      [recipientUpiId]="merchantUpiId"
      (modalClose)="closeSuccessModal()">
    </app-payment-success-modal>
  `
})
export class PaymentPopupComponent {
  @Input() isVisible = false;
  @Input() amount = 0;
  @Input() title = 'Payment';
  @Input() patientId?: number; // Required for backend API
  @Input() bookingId?: number; // Optional booking reference
  @Input() selectedTests: LabTest[] = []; // Selected tests for dynamic PDF generation
  @Input() prescribedBy?: string; // Doctor who prescribed the tests
  @Input() isExistingBooking = false; // Flag to differentiate between new booking and existing booking payment
  
  @Output() paymentSuccess = new EventEmitter<PaymentDetails>();
  @Output() paymentCancel = new EventEmitter<void>();
  @Output() paymentError = new EventEmitter<string>();

  // Inject services
  private paymentService = inject(PaymentService);
  private labTestService = inject(LabTestService);

  // Signals for reactive state management
  selectedMethod = signal<'upi' | 'card' | 'qr' | null>(null);
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Success modal state
  showSuccessModal = signal<boolean>(false);
  successPaymentDetails: PaymentDetails | null = null;

  // Payment form data
  upiId = '';
  cardDetails = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  };

  // Merchant UPI ID from environment
  merchantUpiId = environment.merchantUpiId || 'vikrantchauhan9794@okicici';

  selectPaymentMethod(method: 'upi' | 'card' | 'qr') {
    this.selectedMethod.set(method);
    this.errorMessage.set('');
  }

  canProcessPayment(): boolean {
    const method = this.selectedMethod();
    if (!method) return false;

    switch (method) {
      case 'upi':
        return this.upiId.trim() !== '';
      case 'qr':
        return true; // QR code doesn't require additional input
      case 'card':
        return this.cardDetails.cardNumber.trim() !== '' &&
               this.cardDetails.expiryDate.trim() !== '' &&
               this.cardDetails.cvv.trim() !== '' &&
               this.cardDetails.cardholderName.trim() !== '';
      default:
        return false;
    }
  }

  processPayment() {
    if (!this.canProcessPayment()) {
      this.errorMessage.set('Please complete all required fields');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set('');

    const paymentRequest: PaymentRequest = {
      amount: this.amount,
      description: this.title || 'Lab Test Payment',
      paymentMethod: this.selectedMethod()!.toUpperCase() as 'UPI' | 'CARD' | 'QR_CODE',
      patientId: this.patientId!,
      currency: 'INR'
    };

    // Add UPI ID for UPI payments
    if (this.selectedMethod() === 'upi' && this.upiId) {
      paymentRequest.upiId = this.upiId;
    }

    // Add card details for card payments
    if (this.selectedMethod() === 'card' && this.cardDetails) {
      paymentRequest.cardDetails = {
        cardNumber: this.cardDetails.cardNumber,
        expiryMonth: this.cardDetails.expiryDate.split('/')[0],
        expiryYear: this.cardDetails.expiryDate.split('/')[1],
        cvv: this.cardDetails.cvv,
        cardholderName: this.cardDetails.cardholderName
      };
    }

    // Handle existing booking payment vs new booking creation
    if (this.bookingId) {
      // Existing booking - just process payment
      this.paymentService.payForBooking(this.bookingId, paymentRequest).subscribe({
        next: (response) => {
          this.handlePaymentSuccess(response);
        },
        error: (error) => {
          this.handlePaymentError(error);
        }
      });
    } else {
      // New booking - create booking with integrated payment
      this.createBookingWithPayment(paymentRequest);
    }
  }

  private createBookingWithPayment(paymentRequest: PaymentRequest) {
    const bookingRequest = {
      patientId: this.patientId,
      selectedTestIds: this.selectedTests?.map(test => test.id) || [],
      isFullBodyCheckup: false,
      bookingDate: new Date().toISOString(),
      notes: `Prescribed by: ${this.prescribedBy || 'Self'}`
    };

    const request = {
      bookingRequest,
      paymentRequest
    };

    this.labTestService.createPatientBookingWithPayment(request).subscribe({
      next: (response) => {
        this.handlePaymentSuccess({
          transactionId: response.paymentTransactionId || 'N/A',
          amount: response.totalPrice,
          paymentMethod: paymentRequest.paymentMethod,
          status: response.paymentStatus || 'SUCCESS',
          patientName: response.patientName,
          success: true
        });
      },
      error: (error) => {
        this.handlePaymentError(error);
      }
    });
  }

  private handlePaymentSuccess(response: any) {
    this.isProcessing.set(false);
    
    if (response.success || response.transactionId) {
      const paymentDetails: PaymentDetails = {
        method: this.selectedMethod()!,
        amount: this.amount,
        transactionId: response.transactionId,
        patientId: this.patientId,
        bookingId: this.bookingId
      };

      // Add method-specific details to payment details
      if (this.selectedMethod() === 'upi') {
        paymentDetails.upiId = this.upiId;
      } else if (this.selectedMethod() === 'card') {
        paymentDetails.cardDetails = { ...this.cardDetails };
      }

      // Store payment details and show success modal
      this.successPaymentDetails = paymentDetails;
      this.showSuccessModal.set(true);
      
      // Close the payment popup automatically when success modal is shown
      this.isVisible = false;

      // Handle QR code data if present
      if (response.qrCodeData) {
        console.log('QR Code Data:', response.qrCodeData);
      }

      this.paymentSuccess.emit(paymentDetails);
      this.resetForm();
    } else {
      this.errorMessage.set(response.message || 'Payment initiation failed. Please try again.');
      this.paymentError.emit(response.message || 'Payment failed');
    }
  }

  private handlePaymentError(error: any) {
    this.isProcessing.set(false);
    const errorMessage = error?.error?.message || 'Payment failed. Please try again.';
    this.errorMessage.set(errorMessage);
    this.paymentError.emit(errorMessage);
  }

  closeSuccessModal() {
    this.showSuccessModal.set(false);
    this.successPaymentDetails = null;
    // this.paymentCancel.emit();
  }

  closePayment() {
    this.paymentCancel.emit();
    this.resetForm();
  }

  private resetForm() {
    this.selectedMethod.set(null);
    this.isProcessing.set(false);
    this.errorMessage.set('');
    this.upiId = '';
    this.cardDetails = {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    };
  }
}