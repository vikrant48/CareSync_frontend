import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { PaymentService, PaymentRequest } from '../core/services/payment.service';
import { ToastService } from '../core/services/toast.service';
import { PaymentSuccessModalComponent } from './payment-success-modal.component';

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
    <div *ngIf="isVisible" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" (click)="closePayment()"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="relative px-6 py-5 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-b border-white/5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white tracking-tight">{{ title }}</h2>
              <p class="text-sm text-indigo-200 mt-0.5" *ngIf="additionalInfo">{{ additionalInfo }}</p>
            </div>
            <button 
              (click)="closePayment()"
              class="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            >
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          
          <!-- Amount Badge -->
          <div class="absolute top-5 right-14 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-sm font-semibold shadow-inner">
            ₹{{ amount | number:'1.2-2' }}
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          
          <!-- Method Selection -->
          <div *ngIf="!selectedMethod()">
             <div class="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Select Payment Method</div>
             <div class="grid gap-3">
               <!-- UPI Option -->
               <button 
                 (click)="selectPaymentMethod('upi')"
                 class="group relative flex items-center p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-indigo-500/50 transition-all duration-200 text-left"
               >
                 <div class="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                   <i class="fa-solid fa-mobile-screen-button text-lg"></i>
                 </div>
                 <div class="ml-4 flex-1">
                   <h3 class="font-semibold text-gray-200 group-hover:text-white">UPI Payment</h3>
                   <p class="text-xs text-gray-400">Google Pay, PhonePe, Paytm</p>
                 </div>
                 <i class="fa-solid fa-chevron-right text-gray-600 group-hover:text-indigo-400"></i>
               </button>
 
               <!-- Card Option -->
               <button 
                 (click)="selectPaymentMethod('card')"
                 class="group relative flex items-center p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-purple-500/50 transition-all duration-200 text-left"
               >
                 <div class="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                   <i class="fa-regular fa-credit-card text-lg"></i>
                 </div>
                 <div class="ml-4 flex-1">
                   <h3 class="font-semibold text-gray-200 group-hover:text-white">Card Payment</h3>
                   <p class="text-xs text-gray-400">Credit & Debit Cards</p>
                 </div>
                 <i class="fa-solid fa-chevron-right text-gray-600 group-hover:text-purple-400"></i>
               </button>
 
               <!-- QR Option -->
               <button 
                 (click)="selectPaymentMethod('qr')"
                 class="group relative flex items-center p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-emerald-500/50 transition-all duration-200 text-left"
               >
                 <div class="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                   <i class="fa-solid fa-qrcode text-lg"></i>
                 </div>
                 <div class="ml-4 flex-1">
                   <h3 class="font-semibold text-gray-200 group-hover:text-white">Scan QR</h3>
                   <p class="text-xs text-gray-400">Scan to pay instantly</p>
                 </div>
                 <i class="fa-solid fa-chevron-right text-gray-600 group-hover:text-emerald-400"></i>
               </button>
             </div>
          </div>
 
          <!-- Selected Method Details -->
          <div *ngIf="selectedMethod()" class="animate-in slide-in-from-right-4 duration-300">
             
             <!-- Back Button -->
             <button (click)="resetForm()" class="flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors">
               <i class="fa-solid fa-arrow-left mr-2"></i> Back to options
             </button>
 
             <!-- UPI Flow -->
             <div *ngIf="selectedMethod() === 'upi'" class="space-y-4">
                <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 text-center mb-4">
                  <div class="text-gray-400 text-sm mb-1">Total Payable</div>
                  <div class="text-2xl font-bold text-white">₹{{ amount }}</div>
                </div>
 
                <div class="relative group">
                  <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 ml-0.5">UPI ID</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <i class="fa-solid fa-at"></i>
                    </div>
                    <input 
                      type="text" 
                      [(ngModel)]="upiId"
                      (input)="onUpiInput($event)"
                      placeholder="username@bank"
                      class="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      [class.border-red-500_50]="errorMessage()"
                    >
                  </div>
 
                  <!-- Autocomplete Dropdown -->
                  <div *ngIf="showUpiSuggestions() && upiSuggestions.length > 0" 
                       class="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in duration-200">
                     <button 
                       *ngFor="let suggestion of upiSuggestions"
                       (click)="selectUpiSuggestion(suggestion)"
                       class="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-between group/item"
                     >
                       <span>{{ suggestion }}</span>
                       <span class="text-xs text-gray-500 group-hover/item:text-indigo-400">Select</span>
                     </button>
                  </div>
                  <p *ngIf="errorMessage()" class="text-red-400 text-xs mt-1 ml-0.5 animate-in slide-in-from-top-1">{{ errorMessage() }}</p>
                </div>
                
                <div class="flex gap-2 justify-center mt-2">
                   <!-- UPI Apps Icons (Visual only placeholders) -->
                   <div class="text-xs text-gray-500 italic">Supports Google Pay, PhonePe, Paytm, etc.</div>
                </div>
             </div>
 
             <!-- Card Flow -->
             <div *ngIf="selectedMethod() === 'card'" class="space-y-4">
                <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 relative overflow-hidden shadow-lg group">
                   <!-- Card Shine Effect -->
                   <div class="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                   
                   <div class="relative z-10">
                       <div class="flex justify-between items-start mb-6">
                          <div class="text-xs text-gray-400 font-semibold tracking-widest uppercase">Debit / Credit Card</div>
                          <i class="fa-brands fa-cc-visa text-2xl text-gray-500"></i>
                       </div>
                       
                       <div class="space-y-4">
                          <div>
                            <input 
                              type="text" 
                              [(ngModel)]="cardDetails.cardNumber"
                              placeholder="0000 0000 0000 0000"
                              maxlength="19"
                              class="w-full bg-transparent border-b border-gray-600 text-xl text-white font-mono tracking-wider focus:outline-none focus:border-purple-500 placeholder-gray-600 px-1 py-1 transition-colors"
                            >
                          </div>
                          <div class="flex gap-6">
                             <div class="flex-1">
                               <input 
                                 type="text" 
                                 [(ngModel)]="cardDetails.cardholderName"
                                 placeholder="CARD HOLDER NAME"
                                 class="w-full bg-transparent border-b border-gray-600 text-sm text-white font-medium uppercase tracking-wide focus:outline-none focus:border-purple-500 placeholder-gray-600 px-1 py-1 transition-colors"
                               >
                             </div>
                             <div class="w-16">
                               <input 
                                 type="text" 
                                 [(ngModel)]="cardDetails.expiryDate"
                                 placeholder="MM/YY"
                                 maxlength="5"
                                 class="w-full bg-transparent border-b border-gray-600 text-sm text-white font-mono text-center focus:outline-none focus:border-purple-500 placeholder-gray-600 px-1 py-1 transition-colors"
                               >
                             </div>
                          </div>
                       </div>
                   </div>
                </div>
                
                <div class="flex justify-end">
                   <div class="w-20">
                     <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 text-center">CVV</label>
                     <input 
                       type="password" 
                       [(ngModel)]="cardDetails.cvv"
                       placeholder="123"
                       maxlength="3"
                       class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                     >
                   </div>
                </div>
             </div>
 
             <!-- QR Flow -->
             <div *ngIf="selectedMethod() === 'qr'" class="flex flex-col items-center justify-center space-y-4 py-4">
                <div class="relative bg-white p-4 rounded-xl shadow-lg border-4 border-emerald-500/20">
                  <!-- Simulated QR -->
                  <div class="w-48 h-48 bg-gray-100 flex flex-col items-center justify-center text-gray-300 relative overflow-hidden">
                     <i class="fa-solid fa-qrcode text-8xl opacity-20"></i>
                     <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-800 animate-pulse">
                        <span class="text-xs font-bold uppercase tracking-widest text-emerald-600">Scan to Pay</span>
                        <span class="text-lg font-bold">₹{{ amount }}</span>
                     </div>
                  </div>
                  <div class="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                     <i class="fa-solid fa-check mr-1"></i> Verified
                  </div>
                </div>
                <div class="text-center space-y-1">
                  <p class="text-sm text-gray-300 font-medium">Scan with any UPI App</p>
                  <p class="text-xs text-gray-500">{{ merchantUpiId }}</p>
                </div>
             </div>
 
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-6 pt-4 border-t border-white/5 bg-gray-900/50 flex flex-col sm:flex-row gap-3 items-center" *ngIf="selectedMethod()">
           <button 
             *ngIf="selectedMethod() !== 'qr'"
             (click)="processPayment()"
             [disabled]="!canProcessPayment() || isProcessing()"
             class="w-full btn-primary py-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <span class="relative z-10 flex items-center justify-center gap-2">
               <i *ngIf="isProcessing()" class="fa-solid fa-circle-notch fa-spin"></i>
               <span *ngIf="!isProcessing()">Pay ₹{{ amount }}</span>
             </span>
           </button>
           <button 
             *ngIf="selectedMethod() === 'qr'"
             (click)="processPayment()"
             [disabled]="isProcessing()"
             class="w-full btn-secondary py-3 flex items-center justify-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
           >
             <i class="fa-solid fa-check"></i> I have made the payment
           </button>
        </div>
        
        <!-- Processing Overlay -->
        <div *ngIf="isProcessing()" class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div class="relative w-16 h-16 mb-4">
             <div class="absolute inset-0 border-4 border-gray-700/50 rounded-full"></div>
             <div class="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
             <i class="fa-solid fa-lock absolute inset-0 flex items-center justify-center text-gray-500 text-lg"></i>
           </div>
           <h3 class="text-lg font-bold text-white mb-1">Processing Secure Payment</h3>
           <p class="text-sm text-gray-400">Please do not close this window...</p>
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
  @Input() title = 'Payment Details';
  @Input() patientId?: number;
  @Input() bookingId?: number;
  @Input() paymentType?: 'APPOINTMENT' | 'CONSULTATION' | 'LAB_TEST';
  @Input() additionalInfo?: string;

  @Output() paymentSuccess = new EventEmitter<PaymentDetails>();
  @Output() paymentCancel = new EventEmitter<void>();
  @Output() paymentError = new EventEmitter<string>();

  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);

  selectedMethod = signal<'upi' | 'card' | 'qr' | null>(null);
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string>('');

  showSuccessModal = signal<boolean>(false);
  successPaymentDetails: PaymentDetails | null = null;

  merchantUpiId = environment.merchantUpiId || 'careSync@business';

  // UPI Form
  upiId = '';
  upiSuggestions: string[] = [];
  showUpiSuggestions = signal<boolean>(false);

  // Card Form
  cardDetails = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  };

  private readonly UPI_HANDLES = ['@okicici', '@oksbi', '@okhdfcbank', '@okaxis', '@paytm', '@ybl', '@upi', '@ibl', '@axl'];

  selectPaymentMethod(method: 'upi' | 'card' | 'qr') {
    this.selectedMethod.set(method);
    this.errorMessage.set('');
    this.upiSuggestions = [];
  }

  onUpiInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.upiId = input;

    if (input.includes('@')) {
      const parts = input.split('@');
      const username = parts[0];
      const partialHandle = parts.length > 1 ? '@' + parts[1] : '@';

      this.upiSuggestions = this.UPI_HANDLES
        .filter(h => h.startsWith(partialHandle))
        .map(h => username + h);

      this.showUpiSuggestions.set(this.upiSuggestions.length > 0);
    } else {
      this.showUpiSuggestions.set(false);
    }
  }

  selectUpiSuggestion(suggestion: string) {
    this.upiId = suggestion;
    this.showUpiSuggestions.set(false);
    this.errorMessage.set('');
  }

  canProcessPayment(): boolean {
    const method = this.selectedMethod();
    if (!method) return false;

    switch (method) {
      case 'upi':
        // Basic validation: user@domain
        const validFormat = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(this.upiId);
        if (this.upiId && !validFormat && this.upiId.includes('@')) {
          return true; // Weak validation to allow typing flow
        }
        return validFormat;
      case 'qr':
        return true;
      case 'card':
        return this.cardDetails.cardNumber.length >= 12 &&
          this.cardDetails.expiryDate.length === 5 &&
          this.cardDetails.cvv.length >= 3 &&
          this.cardDetails.cardholderName.length > 2;
      default:
        return false;
    }
  }

  processPayment() {
    if (!this.canProcessPayment()) {
      if (this.selectedMethod() === 'upi') this.errorMessage.set('Please enter a valid UPI ID (e.g. user@bank)');
      else this.toast.showError('Please check your payment details');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set('');

    const paymentRequest: PaymentRequest = {
      amount: this.amount,
      paymentMethod: this.selectedMethod()!.toUpperCase() as 'UPI' | 'CARD' | 'QR_CODE',
      patientId: this.patientId!,
      currency: 'INR',
      paymentType: this.paymentType || 'APPOINTMENT',
      additionalInfo: this.additionalInfo,
      description: this.title
    };

    if (this.selectedMethod() === 'upi') paymentRequest.upiId = this.upiId;
    if (this.selectedMethod() === 'card') {
      const parts = this.cardDetails.expiryDate.split('/');
      paymentRequest.cardDetails = {
        cardNumber: this.cardDetails.cardNumber.replace(/\s/g, ''),
        expiryMonth: parts[0] || '',
        expiryYear: parts[1] || '',
        cvv: this.cardDetails.cvv,
        cardholderName: this.cardDetails.cardholderName
      };
    }

    const request$ = this.bookingId
      ? this.paymentService.payForBooking(this.bookingId, paymentRequest)
      : this.paymentService.initiatePayment(paymentRequest);

    request$.subscribe({
      next: (response) => this.handleSuccess(response),
      error: (error) => this.handleError(error)
    });
  }

  private handleSuccess(response: any) {
    setTimeout(() => {
      this.isProcessing.set(false);
      if (response.success || response.transactionId) {
        this.successPaymentDetails = {
          method: this.selectedMethod()!,
          amount: this.amount,
          transactionId: response.transactionId || 'TXN-' + Date.now(),
          patientId: this.patientId,
          upiId: this.upiId
        };
        this.showSuccessModal.set(true);
        this.isVisible = false;
        this.paymentSuccess.emit(this.successPaymentDetails);
        this.resetForm();
      } else {
        this.errorMessage.set(response.message || 'Payment initiation failed');
        this.toast.showError(response.message || 'Payment initiation failed');
      }
    }, 1500);
  }

  private handleError(error: any) {
    this.isProcessing.set(false);
    this.errorMessage.set(error?.error?.message || 'Payment failed. Please try again.');
    this.toast.showError('Payment failed');
  }

  closeSuccessModal() {
    this.showSuccessModal.set(false);
    this.successPaymentDetails = null;
  }

  closePayment() {
    if (this.isProcessing()) return;
    this.paymentCancel.emit();
    this.isVisible = false;
    this.resetForm();
  }

  resetForm() {
    this.selectedMethod.set(null);
    this.isProcessing.set(false);
    this.errorMessage.set('');
    this.upiId = '';
    this.upiSuggestions = [];
    this.cardDetails = { cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' };
  }
}
