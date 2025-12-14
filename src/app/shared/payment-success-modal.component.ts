import { Component, EventEmitter, Input, Output, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDetails } from './payment-popup.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-payment-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" (click)="closeModal()"></div>

      <!-- Modal Card -->
      <div #modalContent class="relative w-full max-w-md bg-white text-gray-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 flex flex-col max-h-[90vh]">
        
        <!-- Decorative Header -->
        <div class="relative h-32 bg-emerald-500 overflow-hidden shrink-0">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-500"></div>
          <!-- Abstract Circles -->
          <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-black/5 rounded-full blur-xl"></div>
          
          <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent"></div>

          <!-- Icon Badge -->
          <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full p-2 shadow-xl ring-4 ring-emerald-500/20 z-10 flex items-center justify-center">
             <div class="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center group">
               <!-- SVG Checkmark -->
               <svg class="w-10 h-10 text-emerald-600 drop-shadow-sm transform transition-all duration-700 ease-out group-hover:scale-110" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24">
                 <path stroke-linecap="round" 
                       stroke-linejoin="round" 
                       stroke-width="3" 
                       d="M5 13l4 4L19 7"
                       class="animate-[draw_0.6s_ease-out_forwards]"
                       style="stroke-dasharray: 24; stroke-dashoffset: 24; animation-delay: 200ms;">
                 </path>
               </svg>
             </div>
          </div>
        </div>

        <!-- Content -->
        <div class="pt-12 pb-8 px-6 sm:px-8 text-center flex-1 overflow-y-auto">
          <h2 class="text-2xl font-bold text-gray-900 mb-1">Payment Successful!</h2>
          <p class="text-gray-500 text-sm mb-8">Your transaction has been processed securely.</p>

          <!-- Receipt Card -->
          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 text-left space-y-4 relative">
             <!-- Ticket/Receipt cutouts -->
             <div class="absolute top-1/2 -left-2.5 w-5 h-5 bg-white rounded-full border-r border-gray-200"></div>
             <div class="absolute top-1/2 -right-2.5 w-5 h-5 bg-white rounded-full border-l border-gray-200"></div>

             <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500">Amount Paid</span>
                <span class="text-xl font-bold text-gray-900">₹{{ paymentDetails?.amount | number:'1.2-2' }}</span>
             </div>
             
             <div class="h-px bg-gray-200 border-t border-dashed border-gray-300 my-2"></div>

             <div class="space-y-3">
               <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-500">Transaction ID</span>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-900 font-mono text-xs">{{ paymentDetails?.transactionId }}</span>
                    <button (click)="copyTransactionId()" class="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50" title="Copy ID">
                       <i class="fas fa-copy"></i>
                    </button>
                  </div>
               </div>
               <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-500">Date</span>
                  <span class="text-gray-900 font-medium">{{ getCurrentDateTime() }}</span>
               </div>
               <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-500">Payment Method</span>
                  <span class="text-gray-900 font-medium">{{ getPaymentMethodDisplay() }}</span>
               </div>
               <div class="flex justify-between items-center text-sm">
                  <span class="text-gray-500">Paid to</span>
                  <span class="text-gray-900 font-medium truncate max-w-[150px]" [title]="recipientUpiId">{{ recipientUpiId }}</span>
               </div>
             </div>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3">
            <button 
              (click)="downloadPDF()"
              class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">
              <i class="fas fa-download"></i> Receipt
            </button>
            <button 
              (click)="closeModal()"
              class="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
              Done
            </button>
          </div>

        </div>

        <!-- Footer Decor -->
        <!-- <div class="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100">
           CareSync Secure Payments
        </div> -->
      </div>
    </div>
  `
})
export class PaymentSuccessModalComponent {
  @Input() isVisible = false;
  @Input() paymentDetails: PaymentDetails | null = null;
  @Input() recipientUpiId = '';

  @Output() modalClose = new EventEmitter<void>();

  @ViewChild('modalContent', { static: false }) modalContent!: ElementRef;

  private toast = inject(ToastService);

  getPaymentMethodDisplay(): string {
    if (!this.paymentDetails) return '';

    switch (this.paymentDetails.method) {
      case 'upi':
        return 'UPI';
      case 'card':
        return 'Card';
      case 'qr':
        return 'QR Scan';
      default:
        return this.paymentDetails.method;
    }
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('en-IN', {
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

  async downloadPDF() {
    if (!this.modalContent) return;

    try {
      const element = this.modalContent.nativeElement;
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff', // Capture as white background
        scale: 2,
        logging: false,
        useCORS: true
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

      const filename = `Receipt-${this.paymentDetails?.transactionId || 'Txn'}.pdf`;
      pdf.save(filename);
      this.toast.showSuccess('Receipt downloaded successfully');
    } catch (error) {
      console.error('PDF Generation Error', error);
      this.toast.showError('Failed to download receipt');
    }
  }
}
