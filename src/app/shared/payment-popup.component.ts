import { Component, EventEmitter, Input, Output, signal, inject, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { PaymentService, PaymentRequest } from '../core/services/payment.service';
import { AppointmentService } from '../core/services/appointment.service';
import { LabTestService, BookingRequest } from '../core/services/lab-test.service';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { PaymentSuccessModalComponent } from './payment-success-modal.component';
import { ModalShellComponent } from './ui/modal-shell.component';

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
  patientName?: string;
  bookingId?: number;
  appointmentId?: number;
}

@Component({
  selector: 'app-payment-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentSuccessModalComponent, ModalShellComponent],
  template: `
    <app-modal-shell
      [open]="isVisible"
      [showHeader]="false"
      [hasFooter]="false"
      maxWidthClass="max-w-3xl"
      zIndexClass="z-[100]"
      panelClass="bg-[#121826] border border-[#2a3347] rounded-2xl relative shadow-2xl overflow-hidden"
      bodyClass="p-0 relative"
      ariaLabel="Appointment Booking Payment"
      backdropClass="bg-black/80 backdrop-blur-sm"
      (close)="closePayment()"
    >
      <!-- Modal Header Bar -->
      <div class="px-5 sm:px-6 py-4 bg-[#121826] border-b border-[#2a3347] flex items-center justify-between gap-4 shrink-0">
        <div class="min-w-0 flex-1">
          <h2 class="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">{{ title || 'Appointment Booking Payment' }}</h2>
          <p class="text-xs sm:text-sm text-[#5b6cf0] font-semibold mt-0.5 truncate" *ngIf="additionalInfo">{{ additionalInfo }}</p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
          <!-- Emerald Amount Badge -->
          <div class="bg-[#0d2822] text-[#34d399] border border-[#10b981]/30 px-3.5 py-1 rounded-full text-xs sm:text-sm font-extrabold shadow-sm shrink-0 whitespace-nowrap">
            ₹{{ amount | number:'1.2-2' }}
          </div>
          <button 
            type="button"
            (click)="closePayment()"
            aria-label="Close payment"
            class="text-[#9aa3b8] hover:text-white hover:bg-[#1b2333] p-2 rounded-full transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Modal Body Split Layout (Grid) -->
      <div class="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
        
        <!-- LEFT COLUMN: Select Payment Method -->
        <div class="md:col-span-5 p-4 sm:p-5 border-b md:border-b-0 md:border-r border-[#2a3347] space-y-3 bg-[#121826]/60">
          <div class="text-[10px] font-bold text-[#9aa3b8] uppercase tracking-wider mb-2">SELECT PAYMENT METHOD</div>
          
          <div class="space-y-2.5">
            <!-- UPI Payment Option -->
            <button 
              type="button"
              (click)="selectPaymentMethod('upi')"
              [ngClass]="selectedMethod() === 'upi' ? 'bg-[#151d30] border-2 border-[#5b6cf0] shadow-md' : 'bg-[#151b2b] hover:bg-[#1b2333] border border-[#2a3347]'"
              class="w-full p-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 text-left cursor-pointer group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/15 text-[#5b6cf0] flex items-center justify-center text-base shrink-0">
                  <i class="fa-solid fa-mobile-screen-button"></i>
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-xs sm:text-sm text-white truncate">UPI Payment</h3>
                  <p class="text-[11px] text-[#9aa3b8] truncate">Google Pay, PhonePe, Paytm, BHIM</p>
                </div>
              </div>
              <!-- Radio Indicator -->
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2"
                   [ngClass]="selectedMethod() === 'upi' ? 'border-[#5b6cf0] text-[#5b6cf0]' : 'border-[#3a4763]'">
                <div *ngIf="selectedMethod() === 'upi'" class="w-2.5 h-2.5 rounded-full bg-[#5b6cf0]"></div>
              </div>
            </button>

            <!-- Card Payment Option -->
            <button 
              type="button"
              (click)="selectPaymentMethod('card')"
              [ngClass]="selectedMethod() === 'card' ? 'bg-[#151d30] border-2 border-[#5b6cf0] shadow-md' : 'bg-[#151b2b] hover:bg-[#1b2333] border border-[#2a3347]'"
              class="w-full p-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 text-left cursor-pointer group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-base shrink-0">
                  <i class="fa-regular fa-credit-card"></i>
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-xs sm:text-sm text-white truncate">Card Payment</h3>
                  <p class="text-[11px] text-[#9aa3b8] truncate">Credit & Debit Cards</p>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2"
                   [ngClass]="selectedMethod() === 'card' ? 'border-[#5b6cf0] text-[#5b6cf0]' : 'border-[#3a4763]'">
                <div *ngIf="selectedMethod() === 'card'" class="w-2.5 h-2.5 rounded-full bg-[#5b6cf0]"></div>
              </div>
            </button>

            <!-- Scan QR Option -->
            <button 
              type="button"
              (click)="selectPaymentMethod('qr')"
              [ngClass]="selectedMethod() === 'qr' ? 'bg-[#151d30] border-2 border-[#5b6cf0] shadow-md' : 'bg-[#151b2b] hover:bg-[#1b2333] border border-[#2a3347]'"
              class="w-full p-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 text-left cursor-pointer group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base shrink-0">
                  <i class="fa-solid fa-qrcode"></i>
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-xs sm:text-sm text-white truncate">Scan QR</h3>
                  <p class="text-[11px] text-[#9aa3b8] truncate">Scan to pay instantly</p>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2"
                   [ngClass]="selectedMethod() === 'qr' ? 'border-[#5b6cf0] text-[#5b6cf0]' : 'border-[#3a4763]'">
                <div *ngIf="selectedMethod() === 'qr'" class="w-2.5 h-2.5 rounded-full bg-[#5b6cf0]"></div>
              </div>
            </button>
          </div>
        </div>

        <!-- RIGHT COLUMN: Payment Method Form Details -->
        <div class="md:col-span-7 p-5 sm:p-6 space-y-4 bg-[#121826] flex flex-col justify-between">
          
          <!-- UPI FLOW PANEL -->
          <div *ngIf="selectedMethod() === 'upi'" class="space-y-4 animate-in fade-in duration-300">
            <!-- Header with UPI Apps -->
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-0.5">
                <h3 class="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <i class="fa-solid fa-mobile-screen-button text-[#5b6cf0]"></i> UPI Payment
                </h3>
                <p class="text-xs text-[#9aa3b8]">Pay securely using any UPI app</p>
              </div>

              <!-- UPI App Icons -->
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="bg-[#151b2b] border border-[#2a3347] px-2 py-1 rounded-lg text-[10px] font-extrabold text-blue-400">GPay</span>
                <span class="bg-[#151b2b] border border-[#2a3347] px-2 py-1 rounded-lg text-[10px] font-extrabold text-purple-400">Pe</span>
                <span class="bg-[#151b2b] border border-[#2a3347] px-2 py-1 rounded-lg text-[10px] font-extrabold text-sky-400">Paytm</span>
                <span class="bg-[#151b2b] border border-[#2a3347] px-2 py-1 rounded-lg text-[10px] font-extrabold text-amber-400">BHIM</span>
              </div>
            </div>

            <!-- Total Payable Box -->
            <div class="bg-[#151b2b] border border-[#2a3347] rounded-xl p-3.5 text-center space-y-0.5 shadow-inner">
              <div class="text-xs font-semibold text-[#9aa3b8]">Total Payable</div>
              <div class="text-2xl font-extrabold text-white tracking-tight">₹{{ amount | number:'1.2-2' }}</div>
            </div>

            <!-- UPI ID Input Form -->
            <div class="space-y-1.5 relative">
              <label class="block text-xs font-bold text-[#9aa3b8] uppercase tracking-wider">UPI ID</label>
              <div class="relative flex items-center">
                <div class="absolute left-3.5 text-[#5b6cf0] pointer-events-none text-sm">
                  <i class="fa-solid fa-at"></i>
                </div>
                <input 
                  type="text" 
                  [(ngModel)]="upiId"
                  (input)="onUpiInput($event)"
                  placeholder="name@bank"
                  class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-[#5a657d] outline-none transition-colors"
                  [class.border-rose-500]="errorMessage()"
                />
                <button *ngIf="upiId" type="button" (click)="clearUpiId()" class="absolute right-3 text-[#9aa3b8] hover:text-white text-xs cursor-pointer">
                  <i class="fa-solid fa-circle-xmark"></i>
                </button>
              </div>

              <!-- Autocomplete Suggestions -->
              <div *ngIf="showUpiSuggestions() && upiSuggestions.length > 0" 
                   class="absolute z-20 w-full mt-1 bg-[#1b2333] border border-[#2a3347] rounded-xl shadow-2xl overflow-hidden">
                <button 
                  *ngFor="let suggestion of upiSuggestions"
                  (click)="selectUpiSuggestion(suggestion)"
                  type="button"
                  class="w-full px-3.5 py-2 text-left text-xs text-white hover:bg-[#5b6cf0]/20 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{{ suggestion }}</span>
                  <span class="text-[10px] text-[#5b6cf0] font-bold">Select</span>
                </button>
              </div>

              <div class="flex items-center justify-between text-[11px] pt-0.5">
                <span class="text-[#5a657d]">Enter your UPI ID (e.g. name&#64;bank)</span>
                <span *ngIf="errorMessage()" class="text-rose-400 font-semibold">{{ errorMessage() }}</span>
              </div>

              <!-- Pay Button -->
              <div class="pt-2">
                <button 
                  type="button"
                  (click)="processPayment()"
                  [disabled]="!canProcessPayment() || isProcessing()"
                  class="w-full bg-[#5b6cf0] hover:bg-[#4a5be0] text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-lg shadow-[#5b6cf0]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <i *ngIf="isProcessing()" class="fa-solid fa-circle-notch animate-spin text-xs"></i>
                  <span>Pay ₹{{ amount | number:'1.2-2' }}</span>
                </button>
              </div>
            </div>

            <!-- OR Divider -->
            <div class="relative flex py-1 items-center">
              <div class="flex-grow border-t border-[#2a3347]"></div>
              <span class="flex-shrink mx-3 text-[10px] font-bold text-[#5a657d] uppercase tracking-wider">OR</span>
              <div class="flex-grow border-t border-[#2a3347]"></div>
            </div>

            <!-- Scan with your UPI app Section -->
            <div class="bg-[#151b2b] border border-[#2a3347] rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-3.5">
              <div class="w-20 h-20 bg-white p-1.5 rounded-xl shrink-0 flex items-center justify-center shadow-md">
                <img [src]="qrCodeUrl" class="w-full h-full object-contain" alt="UPI QR Code" />
              </div>
              <div class="space-y-1 text-center sm:text-left min-w-0 flex-1">
                <h4 class="text-xs sm:text-sm font-bold text-white">Scan with your UPI app</h4>
                <p class="text-[11px] text-[#9aa3b8] leading-tight">Open Google Pay, PhonePe, Paytm or any UPI app and scan this QR code to pay.</p>
                <div class="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <span class="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <i class="fa-regular fa-clock"></i> QR expires in {{ formatTimer(qrCountdown) }}
                  </span>
                  <button type="button" (click)="downloadQR()" class="bg-[#1b2333] hover:bg-[#253047] border border-[#2a3347] text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer">
                    <i class="fa-solid fa-download text-[10px]"></i> Download QR
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD FLOW PANEL -->
          <div *ngIf="selectedMethod() === 'card'" class="space-y-4 animate-in fade-in duration-300">
            <div class="space-y-0.5">
              <h3 class="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <i class="fa-regular fa-credit-card text-purple-400"></i> Card Payment
              </h3>
              <p class="text-xs text-[#9aa3b8]">Pay securely using your Credit or Debit Card</p>
            </div>

            <div class="bg-[#151b2b] border border-[#2a3347] rounded-xl p-4 space-y-3.5">
              <div>
                <label class="block text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider mb-1">Card Number</label>
                <input 
                  type="text" 
                  [(ngModel)]="cardDetails.cardNumber"
                  placeholder="0000 0000 0000 0000"
                  maxlength="19"
                  class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-[#5a657d] outline-none"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider mb-1">Cardholder Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="cardDetails.cardholderName"
                  placeholder="NAME ON CARD"
                  class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white uppercase placeholder-[#5a657d] outline-none"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider mb-1">Expiry Date</label>
                  <input 
                    type="text" 
                    [(ngModel)]="cardDetails.expiryDate"
                    placeholder="MM/YY"
                    maxlength="5"
                    class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono text-center placeholder-[#5a657d] outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider mb-1">CVV</label>
                  <input 
                    type="password" 
                    [(ngModel)]="cardDetails.cvv"
                    placeholder="123"
                    maxlength="3"
                    class="w-full bg-[#1b2333] border border-[#2a3347] focus:border-[#5b6cf0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono text-center placeholder-[#5a657d] outline-none"
                  />
                </div>
              </div>
            </div>

            <button 
              type="button"
              (click)="processPayment()"
              [disabled]="!canProcessPayment() || isProcessing()"
              class="w-full bg-[#5b6cf0] hover:bg-[#4a5be0] text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-lg shadow-[#5b6cf0]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <i *ngIf="isProcessing()" class="fa-solid fa-circle-notch animate-spin text-xs"></i>
              <span>Pay ₹{{ amount | number:'1.2-2' }}</span>
            </button>
          </div>

          <!-- SCAN QR FLOW PANEL -->
          <div *ngIf="selectedMethod() === 'qr'" class="space-y-4 animate-in fade-in duration-300 text-center flex flex-col items-center justify-center py-4">
            <div class="space-y-1">
              <h3 class="font-bold text-white text-base flex items-center justify-center gap-2">
                <i class="fa-solid fa-qrcode text-emerald-400"></i> Scan to Pay
              </h3>
              <p class="text-xs text-[#9aa3b8]">Scan this QR code using any UPI app</p>
            </div>

            <div class="bg-white p-3 rounded-2xl shadow-xl border-4 border-[#5b6cf0]/20 inline-block">
              <img [src]="qrCodeUrl" class="w-48 h-48 object-contain" alt="QR Code" />
            </div>

            <div class="space-y-1 text-xs">
              <div class="text-white font-bold">Total Amount: ₹{{ amount | number:'1.2-2' }}</div>
              <div class="text-[#9aa3b8]">{{ merchantUpiId }}</div>
            </div>

            <button 
              type="button"
              (click)="processPayment()"
              [disabled]="isProcessing()"
              class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <i class="fa-solid fa-circle-check"></i>
              <span>I Have Made the Payment</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Processing Overlay -->
      <div *ngIf="isProcessing()" class="absolute inset-0 bg-[#0b0f1a]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        
        <!-- Central Orbiting Shield & Icon Ring -->
        <div class="relative w-44 h-44 flex items-center justify-center mb-6">
          <!-- Spinning Outer Gradient Ring -->
          <div class="absolute inset-0 border-4 border-[#5b6cf0]/20 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-transparent border-t-[#5b6cf0] border-r-[#5b6cf0] rounded-full animate-spin"></div>
          
          <!-- Floating Orbit Security Icons -->
          <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1b2333] border border-[#2a3347] text-[#5b6cf0] flex items-center justify-center text-xs shadow-md">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div class="absolute top-1/4 -right-2 w-8 h-8 rounded-full bg-[#1b2333] border border-[#2a3347] text-purple-400 flex items-center justify-center text-xs shadow-md">
            <i class="fa-regular fa-credit-card"></i>
          </div>
          <div class="absolute bottom-1/4 -left-2 w-8 h-8 rounded-full bg-[#1b2333] border border-[#2a3347] text-amber-400 flex items-center justify-center text-xs shadow-md">
            <i class="fa-solid fa-building-columns"></i>
          </div>
          <div class="absolute bottom-1 right-1/4 w-8 h-8 rounded-full bg-[#1b2333] border border-[#2a3347] text-sky-400 flex items-center justify-center text-xs shadow-md">
            <i class="fa-solid fa-mobile-screen-button"></i>
          </div>

          <!-- Floating Sparks -->
          <div class="absolute top-2 left-6 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
          <div class="absolute bottom-4 right-8 w-1.5 h-1.5 bg-[#5b6cf0] rounded-full animate-ping"></div>

          <!-- Central Glowing Lock Circle -->
          <div class="w-20 h-20 rounded-full bg-[#151d30] border-2 border-[#5b6cf0] flex items-center justify-center shadow-xl shadow-[#5b6cf0]/30 relative z-10">
            <div class="w-14 h-14 rounded-full bg-[#5b6cf0] flex items-center justify-center text-white text-xl shadow-inner">
              <i class="fa-solid fa-lock"></i>
            </div>
          </div>
        </div>

        <!-- Title & Subtitle -->
        <h3 class="text-xl sm:text-2xl font-extrabold text-white mb-1 tracking-tight">Processing Secure Payment</h3>
        <p class="text-xs sm:text-sm text-[#9aa3b8] mb-8">Please do not close this window...</p>

        <!-- 3-Step Progress Tracker Bar -->
        <div class="w-full max-w-md bg-[#151b2b] border border-[#2a3347] rounded-2xl p-4 sm:p-5 mb-6 shadow-inner">
          <div class="relative flex items-center justify-between">
            
            <!-- Progress Bar Background Line -->
            <div class="absolute left-6 right-6 top-4 h-0.5 bg-[#2a3347] -z-0"></div>
            <div class="absolute left-6 w-1/2 top-4 h-0.5 bg-[#5b6cf0] -z-0"></div>

            <!-- Step 1: Verifying -->
            <div class="flex flex-col items-center space-y-1.5 relative z-10 w-1/3 text-center">
              <div class="w-8 h-8 rounded-full bg-[#5b6cf0] text-white flex items-center justify-center text-xs font-bold shadow-md">
                <i class="fa-solid fa-check"></i>
              </div>
              <div class="text-xs font-bold text-white">Verifying</div>
              <div class="text-[10px] text-[#9aa3b8]">payment details</div>
            </div>

            <!-- Step 2: Processing (Active) -->
            <div class="flex flex-col items-center space-y-1.5 relative z-10 w-1/3 text-center">
              <div class="w-8 h-8 rounded-full bg-[#121826] border-2 border-[#5b6cf0] text-[#5b6cf0] flex items-center justify-center text-xs font-bold shadow-md animate-pulse">
                <div class="w-3 h-3 rounded-full bg-[#5b6cf0]"></div>
              </div>
              <div class="text-xs font-bold text-white">Processing</div>
              <div class="text-[10px] text-[#9aa3b8]">with secure gateway</div>
            </div>

            <!-- Step 3: Finalizing -->
            <div class="flex flex-col items-center space-y-1.5 relative z-10 w-1/3 text-center">
              <div class="w-8 h-8 rounded-full bg-[#151b2b] border border-[#3a4763] text-[#5a657d] flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div class="text-xs font-semibold text-[#9aa3b8]">Finalizing</div>
              <div class="text-[10px] text-[#5a657d]">your transaction</div>
            </div>

          </div>
        </div>

        <!-- Security Footer Badge Pill -->
        <div class="bg-[#151b2b] border border-[#2a3347] px-4 py-2 rounded-xl text-xs text-[#9aa3b8] flex items-center justify-center gap-2 shadow-sm">
          <i class="fa-solid fa-lock text-[#5b6cf0] text-xs"></i>
          <span>Secure payment powered by trusted partners</span>
        </div>

      </div>

    </app-modal-shell>

    <!-- Payment Success Modal -->
    <app-payment-success-modal
      [isVisible]="showSuccessModal()"
      [paymentDetails]="successPaymentDetails"
      [recipientUpiId]="merchantUpiId"
      (modalClose)="closeSuccessModal()">
    </app-payment-success-modal>
  `
})
export class PaymentPopupComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible = false;
  @Input() amount = 0;
  @Input() title = 'Appointment Booking Payment';
  @Input() patientId?: number;
  @Input() bookingId?: number;
  @Input() appointmentId?: number;
  @Input() paymentType?: 'APPOINTMENT' | 'CONSULTATION' | 'LAB_TEST';
  @Input() additionalInfo?: string;

  @Input() appointmentBookingDetails?: { doctorId: number; appointmentDateTime: string; reason?: string };
  @Input() labTestBookingDetails?: BookingRequest | null;

  @Output() paymentSuccess = new EventEmitter<PaymentDetails>();
  @Output() paymentCancel = new EventEmitter<void>();
  @Output() paymentError = new EventEmitter<string>();

  private paymentService = inject(PaymentService);
  private appointmentService = inject(AppointmentService);
  private labTestService = inject(LabTestService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  selectedMethod = signal<'upi' | 'card' | 'qr'>('upi');
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string>('');

  showSuccessModal = signal<boolean>(false);
  successPaymentDetails: PaymentDetails | null = null;

  merchantUpiId = environment.merchantUpiId || 'careSync@business';

  // UPI Form
  upiId = 'yourUPI@oksbi';
  upiSuggestions: string[] = [];
  showUpiSuggestions = signal<boolean>(false);

  // Timer & QR Code
  qrCountdown = 300;
  private qrTimerInterval: any;

  // Card Form
  cardDetails = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  };

  private readonly UPI_HANDLES = ['@okicici', '@oksbi', '@okhdfcbank', '@okaxis', '@paytm', '@ybl', '@upi', '@ibl', '@axl'];

  ngOnInit() {
    this.startQrTimer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isVisible'] && this.isVisible) {
      this.selectedMethod.set('upi');
      this.startQrTimer();
    }
  }

  ngOnDestroy() {
    this.stopQrTimer();
  }

  startQrTimer() {
    this.stopQrTimer();
    this.qrCountdown = 298;
    this.qrTimerInterval = setInterval(() => {
      if (this.qrCountdown > 0) {
        this.qrCountdown--;
      } else {
        this.stopQrTimer();
      }
    }, 1000);
  }

  stopQrTimer() {
    if (this.qrTimerInterval) {
      clearInterval(this.qrTimerInterval);
      this.qrTimerInterval = null;
    }
  }

  formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get qrCodeUrl(): string {
    const upi = `upi://pay?pa=${encodeURIComponent(this.merchantUpiId)}&pn=CareSync&am=${this.amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upi)}`;
  }

  downloadQR() {
    const link = document.createElement('a');
    link.href = this.qrCodeUrl;
    link.download = 'caresync-upi-qr.png';
    link.target = '_blank';
    link.click();
    this.toast.showSuccess('QR Code download started');
  }

  selectPaymentMethod(method: 'upi' | 'card' | 'qr') {
    this.selectedMethod.set(method);
    this.errorMessage.set('');
    this.upiSuggestions = [];
  }

  clearUpiId() {
    this.upiId = '';
    this.showUpiSuggestions.set(false);
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
        const validFormat = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(this.upiId);
        if (this.upiId && !validFormat && this.upiId.includes('@')) {
          return true;
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
      if (this.selectedMethod() === 'upi') this.errorMessage.set('Please enter a valid UPI ID (e.g. name@bank)');
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
      description: this.title,
      bookingId: this.bookingId,
      appointmentId: this.appointmentId
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

    if (this.paymentType === 'APPOINTMENT' && this.appointmentBookingDetails) {
      const payload = {
        doctorId: this.appointmentBookingDetails.doctorId,
        appointmentDateTime: this.appointmentBookingDetails.appointmentDateTime,
        reason: this.appointmentBookingDetails.reason,
        amount: this.amount,
        paymentMethod: paymentRequest.paymentMethod,
        upiId: paymentRequest.upiId,
        cardDetails: paymentRequest.cardDetails
      };

      this.appointmentService.bookAppointmentWithPayment(payload).subscribe({
        next: (response) => this.handleSuccess(response),
        error: (error) => this.handleError(error)
      });
      return;
    }

    if (this.paymentType === 'LAB_TEST' && this.labTestBookingDetails) {
      const patientBookingWithPayment = {
        bookingRequest: this.labTestBookingDetails,
        paymentRequest: {
          amount: this.amount,
          description: `Lab tests booking`,
          paymentMethod: paymentRequest.paymentMethod,
          paymentType: 'LAB_TEST' as const,
          patientId: this.patientId || parseInt(this.authService.userId() || '0'),
          currency: 'INR',
          upiId: paymentRequest.upiId,
          cardDetails: paymentRequest.cardDetails
        }
      };

      this.labTestService.createPatientBookingWithPayment(patientBookingWithPayment).subscribe({
        next: (response) => this.handleSuccess(response),
        error: (error) => this.handleError(error)
      });
      return;
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
      if (response.success || response.paymentTransactionId || response.transactionId || response.appointmentId || response.id) {
        const apptId = response.appointmentId || (this.paymentType === 'APPOINTMENT' ? (response.id || response.appointmentId) : undefined);
        const labBookingId = this.paymentType === 'LAB_TEST' ? (response.id || response.bookingId) : response.bookingId;

        this.successPaymentDetails = {
          method: this.selectedMethod()!,
          amount: this.amount,
          transactionId: response.paymentTransactionId || response.transactionId || ('APPT_' + (apptId || response.id)),
          bookingId: labBookingId,
          appointmentId: apptId,
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
    const msg = error?.error?.error || error?.error?.message || (typeof error?.error === 'string' ? error.error : null) || 'Payment failed. Please try again.';
    this.errorMessage.set(msg);
    this.toast.showError(msg);
    // this.paymentError.emit(msg);
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
    this.selectedMethod.set('upi');
    this.isProcessing.set(false);
    this.errorMessage.set('');
    this.upiId = 'yourUPI@oksbi';
    this.upiSuggestions = [];
    this.cardDetails = { cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' };
  }
}
