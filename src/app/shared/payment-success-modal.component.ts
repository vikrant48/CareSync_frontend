import { Component, EventEmitter, Input, Output, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDetails } from './payment-popup.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-payment-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div #modalContent class="bg-gray-900 rounded-xl shadow-2xl w-full mx-auto sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[80dvh] overflow-y-auto ring-1 ring-gray-800">
        <!-- Header -->
        <div class="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center sticky top-0">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-white/90 text-xl mr-3"></i>
            <h2 class="text-lg sm:text-xl font-semibold">Payment Successful</h2>
          </div>
          <div class="flex items-center space-x-2">
            <!-- Download Button -->
            <button 
              (click)="downloadPDF()"
              class="text-white/80 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
              title="Download Receipt">
              <i class="fas fa-download text-base"></i>
            </button>
            <!-- Share Button (disabled for now) -->
            <button 
              class="text-white/60 cursor-not-allowed p-2 rounded-lg"
              title="Share (Coming Soon)"
              disabled>
              <i class="fas fa-share-alt text-base"></i>
            </button>
            <!-- Close Button -->
            <button 
              (click)="closeModal()"
              class="text-white/80 hover:text-white transition p-2 rounded-lg hover:bg-white/10">
              <i class="fas fa-times text-base"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 sm:p-6">
          <!-- Success Message -->
          <div class="text-center mb-4 sm:mb-6">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-check text-white text-xl"></i>
            </div>
            <h3 class="text-base sm:text-lg font-semibold text-gray-100 mb-1">Payment Completed Successfully!</h3>
            <p class="text-gray-400 text-xs sm:text-sm">Your payment has been processed and confirmed.</p>
          </div>

          <!-- Transaction Details -->
          <div class="bg-gray-800 rounded-lg p-4 mb-4 sm:mb-6">
            <h4 class="text-gray-200 font-medium mb-3">Transaction Details</h4>
            
            <!-- Transaction ID -->
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
              <span class="text-gray-400 text-xs sm:text-sm">Transaction ID:</span>
              <div class="flex items-center">
                <span class="text-gray-200 font-mono text-xs sm:text-sm mr-2">{{ paymentDetails?.transactionId }}</span>
                <button 
                  (click)="copyTransactionId()"
                  class="text-indigo-400 hover:text-indigo-300 transition">
                  <i class="fas fa-copy text-[10px]"></i>
                </button>
              </div>
            </div>

            <!-- Amount -->
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
              <span class="text-gray-400 text-xs sm:text-sm">Amount Paid:</span>
              <span class="text-emerald-400 font-semibold">₹{{ paymentDetails?.amount }}</span>
            </div>

            <!-- Payment Method -->
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
              <span class="text-gray-400 text-xs sm:text-sm">Payment Method:</span>
              <span class="text-gray-200 text-xs sm:text-sm capitalize">{{ getPaymentMethodDisplay() }}</span>
            </div>

            <!-- Recipient -->
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
              <span class="text-gray-400 text-xs sm:text-sm">Paid To:</span>
              <span class="text-gray-200 text-xs sm:text-sm">{{ recipientUpiId }}</span>
            </div>

            <!-- Date & Time -->
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
              <span class="text-gray-400 text-xs sm:text-sm">Date & Time:</span>
              <span class="text-gray-200 text-xs sm:text-sm">{{ getCurrentDateTime() }}</span>
            </div>

            <!-- Status -->
            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-xs sm:text-sm">Status:</span>
              <span class="text-emerald-400 font-medium flex items-center">
                <i class="fas fa-check-circle mr-1"></i>
                Completed
              </span>
            </div>
          </div>

          <!-- Additional Info -->
          <!-- <div class="bg-blue-900 border border-blue-700 rounded-lg p-3 mb-4 sm:mb-6">
            <p class="text-blue-300 text-xs sm:text-sm">
              <i class="fas fa-info-circle mr-2"></i>
              A confirmation email has been sent to your registered email address. 
              Please save this transaction ID for your records.
            </p>
          </div> -->

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row sm:justify-center gap-3">
            <button 
              (click)="closeModal()"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentSuccessModalComponent {
  @Input() isVisible = false;
  @Input() paymentDetails: PaymentDetails | null = null;
  @Input() recipientUpiId = 'vikrantchauhan9794@okicici';
  
  @Output() modalClose = new EventEmitter<void>();
  
  @ViewChild('modalContent', { static: false }) modalContent!: ElementRef;

  getPaymentMethodDisplay(): string {
    if (!this.paymentDetails) return '';
    
    switch (this.paymentDetails.method) {
      case 'upi':
        return 'UPI Payment';
      case 'card':
        return 'Credit/Debit Card';
      case 'qr':
        return 'QR Code';
      default:
        return this.paymentDetails.method;
    }
  }

  getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  copyTransactionId() {
    if (this.paymentDetails?.transactionId) {
      navigator.clipboard.writeText(this.paymentDetails.transactionId).then(() => {
        console.log('Transaction ID copied to clipboard');
        // Could show a toast notification here
      }).catch(err => {
        console.error('Failed to copy transaction ID: ', err);
      });
    }
  }

  closeModal() {
    this.modalClose.emit();
  }

  async downloadPDF() {
    try {
      if (!this.modalContent) {
        console.error('Modal content not found');
        return;
      }

      // Get the modal content element
      const element = this.modalContent.nativeElement;
      
      // Create canvas from the modal content
      const canvas = await html2canvas(element, {
        backgroundColor: '#111827',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Calculate dimensions for PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add the image to PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with transaction ID and date
      const transactionId = this.paymentDetails?.transactionId || 'unknown';
      const date = new Date().toISOString().split('T')[0];
      const filename = `payment-receipt-${transactionId}-${date}.pdf`;

      // Save the PDF
      pdf.save(filename);
      
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  }
}
