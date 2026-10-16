import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalShellComponent } from './ui/modal-shell.component';
import { PaymentDetails } from './payment-popup.component';
import { ToastService } from '../core/services/toast.service';
import { PdfService, PaymentReceiptData } from '../core/services/pdf.service';

@Component({
  selector: 'app-payment-success-modal',
  standalone: true,
  imports: [CommonModule, ModalShellComponent],
  template: `
    <app-modal-shell [open]="isVisible" title="Payment Successful!" subtitle="Your transaction has been processed securely."
      titleId="payment-success-title" icon="fa-solid fa-check"
      iconWrapClass="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" maxWidthClass="max-w-lg"
      zIndexClass="z-[110]" bodyClass="p-4 sm:p-6 space-y-4" footerClass="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2"
      [hasFooter]="true" (close)="closeModal()">

      <div class="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
              <i class="fa-solid fa-indian-rupee-sign" aria-hidden="true"></i>
            </div>
            <span class="text-muted font-semibold">Amount Paid</span>
          </div>
          <span class="text-emerald-700 dark:text-emerald-400 font-extrabold text-lg sm:text-xl">₹{{ paymentDetails?.amount | number:'1.2-2' }}</span>
        </div>
        <div class="h-px bg-[var(--border)]"></div>
        <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
              <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
            </div>
            <span class="text-muted font-semibold">Transaction ID</span>
          </div>
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-[var(--text)] font-mono text-xs font-semibold truncate max-w-[140px] sm:max-w-[200px]" [title]="paymentDetails?.transactionId">{{ paymentDetails?.transactionId }}</span>
            <button type="button" (click)="copyTransactionId()" class="min-w-[44px] min-h-[44px] text-[var(--primary)] rounded-lg hover:bg-[var(--bg)]" title="Copy ID" aria-label="Copy transaction ID">
              <i class="fa-regular fa-copy text-xs" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
              <i class="fa-regular fa-calendar-days" aria-hidden="true"></i>
            </div>
            <span class="text-muted font-semibold">Date & Time</span>
          </div>
          <span class="text-[var(--text)] font-semibold text-xs sm:text-sm">{{ getCurrentDateTime() }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
              <i class="fa-regular fa-credit-card" aria-hidden="true"></i>
            </div>
            <span class="text-muted font-semibold">Payment Method</span>
          </div>
          <span class="text-[var(--text)] font-semibold uppercase text-xs sm:text-sm">{{ getPaymentMethodDisplay() }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-sm shrink-0">
              <i class="fa-regular fa-user" aria-hidden="true"></i>
            </div>
            <span class="text-muted font-semibold">Paid to</span>
          </div>
          <div class="text-right min-w-0">
            <div class="text-[var(--text)] font-bold text-xs sm:text-sm truncate max-w-[160px]" [title]="recipientUpiId">{{ recipientUpiId }}</div>
          </div>
        </div>
      </div>

      <button modalFooter type="button" (click)="downloadPDF()" class="btn-secondary">
        <i class="fa-solid fa-download text-xs" aria-hidden="true"></i>
        <span>Download Receipt</span>
      </button>
      <button modalFooter type="button" (click)="closeModal()" class="btn-primary">
        <span>Done</span>
        <i class="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
      </button>
    </app-modal-shell>
  `,
  styles: []
})
export class PaymentSuccessModalComponent {
  @Input() isVisible = false;
  @Input() paymentDetails: PaymentDetails | null = null;
  @Input() recipientUpiId = '';

  @Output() modalClose = new EventEmitter<void>();

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
        patientName: this.paymentDetails.patientName ? String(this.paymentDetails.patientName) : 'Patient',
        patientId: this.paymentDetails.patientId || 0,
        paymentDate: new Date().toISOString(),
        paidTo: this.recipientUpiId || 'Not provided',
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
