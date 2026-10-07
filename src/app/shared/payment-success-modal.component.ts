import { Component, EventEmitter, Input, Output, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDetails } from './payment-popup.component';
import { ToastService } from '../core/services/toast.service';
import { PdfService, PaymentReceiptData } from '../core/services/pdf.service';

@Component({
  selector: 'app-payment-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" (click)="closeModal()"></div>

      <!-- Modal Card -->
      <div #modalContent class="relative w-full max-w-lg bg-[#121826] border border-[#2a3347] text-white rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col z-10">
        
        <!-- Top Right Close Button -->
        <button 
          type="button" 
          (click)="closeModal()"
          class="absolute top-5 right-5 text-[#9aa3b8] hover:text-white hover:bg-[#1b2333] p-2 rounded-full transition-colors focus:outline-none flex items-center justify-center cursor-pointer z-20"
          aria-label="Close modal"
        >
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>

        <!-- Top Success Icon & Glowing Particles -->
        <div class="relative flex items-center justify-center my-4">
          <div class="w-2.5 h-2.5 bg-emerald-400 rounded-sm absolute -top-2 left-1/3 animate-ping"></div>
          <div class="w-2 h-2 bg-[#5b6cf0] rounded-sm absolute -top-1 right-1/3"></div>
          <div class="w-2 h-2 bg-indigo-400 rounded-sm absolute bottom-0 left-1/4"></div>
          <div class="w-2 h-2 bg-emerald-300 rounded-sm absolute bottom-1 right-1/4"></div>

          <div class="w-20 h-20 rounded-full bg-[#0d2822] border border-[#10b981]/40 flex items-center justify-center relative shadow-lg shadow-[#10b981]/20">
            <div class="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-black shadow-inner">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
        </div>

        <!-- Header Text -->
        <div class="text-center mb-6">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">Payment Successful!</h2>
          <p class="text-xs sm:text-sm text-[#9aa3b8]">Your transaction has been processed securely.</p>
        </div>

        <!-- Summary Details Card Box -->
        <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-4 sm:p-5 mb-6 space-y-3.5 shadow-inner">
          
          <!-- Amount Paid -->
          <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-solid fa-indian-rupee-sign"></i>
              </div>
              <span class="text-[#9aa3b8] font-semibold">Amount Paid</span>
            </div>
            <span class="text-emerald-400 font-extrabold text-lg sm:text-xl">₹{{ paymentDetails?.amount | number:'1.2-2' }}</span>
          </div>

          <div class="h-px bg-[#2a3347]"></div>

          <!-- Transaction ID -->
          <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-regular fa-file-lines"></i>
              </div>
              <span class="text-[#9aa3b8] font-semibold">Transaction ID</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-white font-mono text-xs font-semibold truncate max-w-[160px] sm:max-w-[200px]" [title]="paymentDetails?.transactionId">{{ paymentDetails?.transactionId }}</span>
              <button (click)="copyTransactionId()" class="text-[#5b6cf0] hover:text-indigo-300 p-1 rounded-lg hover:bg-[#1b2333] transition-colors cursor-pointer" title="Copy ID">
                <i class="fa-regular fa-copy text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Date & Time -->
          <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-regular fa-calendar-days"></i>
              </div>
              <span class="text-[#9aa3b8] font-semibold">Date & Time</span>
            </div>
            <span class="text-white font-semibold text-xs sm:text-sm">{{ getCurrentDateTime() }}</span>
          </div>

          <!-- Payment Method -->
          <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-regular fa-credit-card"></i>
              </div>
              <span class="text-[#9aa3b8] font-semibold">Payment Method</span>
            </div>
            <span class="text-white font-semibold uppercase text-xs sm:text-sm">{{ getPaymentMethodDisplay() }}</span>
          </div>

          <!-- Paid to -->
          <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                <i class="fa-regular fa-user"></i>
              </div>
              <span class="text-[#9aa3b8] font-semibold">Paid to</span>
            </div>
            <div class="text-right">
              <div class="text-white font-bold text-xs sm:text-sm">{{ recipientUpiId }}</div>
              <span class="text-gray-900 font-medium truncate max-w-[150px]" [title]="recipientUpiId">{{ recipientUpiId }}</span>
            </div>
          </div>

        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-3">
          <button 
            type="button"
            (click)="downloadPDF()"
            class="bg-[#1b2333] hover:bg-[#253047] border border-[#2a3347] text-white font-bold text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <i class="fa-solid fa-download text-xs"></i>
            <span>Download Receipt</span>
          </button>

          <button 
            type="button"
            (click)="closeModal()"
            class="bg-[#5b6cf0] hover:bg-[#4a5be0] text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-lg shadow-[#5b6cf0]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Done</span>
            <i class="fa-solid fa-arrow-right text-xs"></i>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class PaymentSuccessModalComponent {
  @Input() isVisible = false;
  @Input() paymentDetails: PaymentDetails | null = null;
  @Input() recipientUpiId = '';

  @Output() modalClose = new EventEmitter<void>();

  @ViewChild('modalContent', { static: false }) modalContent!: ElementRef;

  private toast = inject(ToastService);
  private pdfService = inject(PdfService);

  getPaymentMethodDisplay(): string {
    if (!this.paymentDetails) return 'UPI';

    switch (this.paymentDetails.method) {
      case 'upi':
        return 'UPI';
      case 'card':
        return 'Card';
      case 'qr':
        return 'Scan QR';
      default:
        return String(this.paymentDetails.method).toUpperCase();
    }
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  copyTransactionId() {
    if (this.paymentDetails?.transactionId) {
      navigator.clipboard.writeText(this.paymentDetails.transactionId).then(() => {
        this.toast.showSuccess('Transaction ID copied!');
      });
    }
  }

  closeModal() {
    this.modalClose.emit();
  }

  downloadPDF() {
    if (!this.paymentDetails) return;

    try {
      if (this.paymentDetails.appointmentId) {
        this.pdfService.generateAppointmentReceiptByBookingId(this.paymentDetails.appointmentId);
        this.toast.showSuccess('Receipt downloaded successfully');
        return;
      }

      if (this.paymentDetails.bookingId) {
        this.pdfService.generateReceiptByBookingId(this.paymentDetails.bookingId);
        this.toast.showSuccess('Receipt downloaded successfully');
        return;
      }

      const receiptData: PaymentReceiptData = {
        transactionId: String(this.paymentDetails.transactionId),
        amount: this.paymentDetails.amount,
        currency: 'INR',
        paymentMethod: this.getPaymentMethodDisplay(),
        patientName: String(this.paymentDetails.patientName) || 'Patient',
        patientId: this.paymentDetails.patientId || 0,
        paymentDate: new Date().toISOString(),
        paidTo: this.recipientUpiId || 'CareSync Healthcare Services',
        recipientUpiId: this.recipientUpiId,
        upiId: this.paymentDetails.upiId,
        status: 'SUCCESS',
        description: 'Healthcare Service Payment Receipt'
      };

      this.pdfService.generatePaymentReceipt(receiptData);
      this.toast.showSuccess('Receipt downloaded successfully');
    } catch (error) {
      console.error('PDF Generation Error', error);
      this.toast.showError('Failed to download receipt');
    }
  }
}
