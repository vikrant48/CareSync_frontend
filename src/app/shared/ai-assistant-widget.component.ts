import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService } from '../core/services/ai-assistant.service';
import { ChatMessage, AiBookingSuggestion, DoctorSuggestion } from '../core/models/ai.models';
import { AppointmentService } from '../core/services/appointment.service';
import { AuthService } from '../core/services/auth.service';
import { PaymentPopupComponent, PaymentDetails } from './payment-popup.component';
import { ToastService } from '../core/services/toast.service';

@Component({
    selector: 'app-ai-assistant-widget',
    standalone: true,
    imports: [CommonModule, FormsModule, PaymentPopupComponent],
    template: `
    <!-- Floating Button -->
    <button
      (click)="toggleChat()"
      class="fixed bottom-20 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] group"
    >
      <i class="fas fa-robot text-2xl group-hover:rotate-12 transition-transform" *ngIf="!isOpen()"></i>
      <i class="fas fa-times text-2xl" *ngIf="isOpen()"></i>
      <span class="absolute -top-1 -right-1 flex h-3 w-3" *ngIf="!isOpen() && messages().length === 0">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
    </button>

    <!-- Chat Window -->
    <div
      *ngIf="isOpen()"
      class="fixed bottom-36 right-6 md:bottom-28 md:right-10 w-[min(calc(100vw-3rem),480px)] h-[min(calc(100vh-15rem),700px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden z-[60] animate-in slide-in-from-bottom-5 duration-300"
    >
      <!-- Header -->
      <div class="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <i class="fas fa-robot text-xl"></i>
          </div>
          <div>
            <h3 class="font-bold text-sm">CareSync AI Assistant</h3>
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span class="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Online</span>
            </div>
          </div>
        </div>
        <button (click)="toggleChat()" class="text-white/80 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Messages Area -->
      <div #messageContainer class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50 scroll-smooth no-scrollbar">
        <!-- Welcome Message -->
        <div class="flex gap-2 max-w-[90%]">
          <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <i class="fas fa-robot text-xs text-blue-600 dark:text-blue-400"></i>
          </div>
          <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700">
            <p class="text-sm">Hello! I'm your CareSync Assistant. How can I help you with your health today?</p>
            <p class="text-[10px] text-gray-500 mt-2 italic font-medium">CareSync AI can provide health guidance but is not a substitute for professional medical advice.</p>
            
            <button 
              (click)="startBooking()"
              class="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <i class="fas fa-calendar-plus"></i>
              Book Appointment
            </button>
          </div>
        </div>

        <!-- Dynamic Messages -->
        <div *ngFor="let msg of messages()" class="flex flex-col gap-2" [ngClass]="msg.isAi ? 'max-w-[95%]' : 'max-w-[85%] ml-auto'">
          <div class="flex gap-2" [ngClass]="msg.isAi ? '' : 'flex-row-reverse text-right'">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" 
                 [ngClass]="msg.isAi ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-indigo-600'">
              <i class="fas" [ngClass]="msg.isAi ? 'fa-robot text-xs text-blue-600 dark:text-blue-400' : 'fa-user text-xs text-white'"></i>
            </div>
            <div class="p-3 rounded-2xl shadow-sm border" 
                 [ngClass]="msg.isAi ? 'bg-white dark:bg-gray-800 rounded-tl-none border-gray-100 dark:border-gray-700' : 'bg-indigo-600 text-white rounded-tr-none border-indigo-500'">
              <p class="text-sm whitespace-pre-wrap">{{ msg.text }}</p>
              <span class="text-[9px] mt-1 block opacity-60 text-right">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
          </div>

          <!-- Suggestion Cards based on type -->
          <div *ngIf="msg.suggestion" class="ml-10 space-y-2 animate-in zoom-in-95 duration-200">
             
             <!-- SPECIALIZATIONS -->
             <div *ngIf="msg.suggestion.type === 'SPECIALIZATIONS'" class="flex flex-wrap gap-2 py-1">
                <button *ngFor="let spec of msg.suggestion.specializations" 
                        (click)="selectSpecialization(spec)"
                        class="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] font-semibold hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">
                   {{ spec }}
                </button>
             </div>

             <!-- DOCTOR LIST -->
             <div *ngIf="msg.suggestion.type === 'DOCTORS'" class="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                <div *ngFor="let doc of msg.suggestion.doctors" 
                     (click)="selectDoctor(doc.id)"
                     class="min-w-[200px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-md hover:border-blue-500 border-2 cursor-pointer transition-all hover:shadow-lg">
                   <div class="flex items-start gap-3 mb-3">
                      <div class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden shrink-0 border border-blue-100">
                         <img *ngIf="doc.profileImageUrl" [src]="doc.profileImageUrl" class="w-full h-full object-cover">
                         <i *ngIf="!doc.profileImageUrl" class="fas fa-user-md text-xl text-blue-500"></i>
                      </div>
                       <div class="overflow-hidden">
                          <div class="text-[12px] font-bold truncate flex items-center gap-1.5">
                             {{ doc.name }}
                             <span *ngIf="doc['isOnLeave']" class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[8px] font-black uppercase rounded-md border border-red-200 dark:border-red-800 shrink-0">Away</span>
                          </div>
                          <div class="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate">{{ doc.specialization }}</div>
                       </div>
                   </div>
                   
                   <div class="space-y-1.5 mb-3">
                      <div class="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                         <i class="fas fa-star text-amber-400"></i>
                         <span>{{ doc.experience }} Years Experience</span>
                      </div>
                      <div class="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                         <i class="fas fa-language text-indigo-500"></i>
                         <span class="truncate">{{ doc.languages || 'English, Hindi' }}</span>
                      </div>
                   </div>

                   <div class="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700">
                      <span class="text-[10px] text-gray-400">Consultation Fee</span>
                      <span class="text-[12px] font-bold text-green-600">₹{{ doc.consultationFee }}</span>
                   </div>
                </div>
             </div>

             <!-- DATE SELECTION -->
             <div *ngIf="msg.suggestion.type === 'DATES'" class="bg-white dark:bg-gray-800 border border-blue-50 dark:border-blue-900/30 p-4 rounded-xl shadow-md">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Appointment Date</div>
                <div class="flex flex-wrap gap-2">
                   <button (click)="selectRelativeDate(msg.suggestion.doctorId!, 0)" class="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">Today</button>
                   <button (click)="selectRelativeDate(msg.suggestion.doctorId!, 1)" class="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">Tomorrow</button>
                   
                   <div class="relative">
                      <input #datePicker type="date" class="absolute inset-0 opacity-0 cursor-pointer" 
                             [min]="minDate" (change)="onDateSelected(msg.suggestion.doctorId!, datePicker.value)">
                      <button class="px-4 py-2 border-2 border-dashed border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-50 transition-all">
                         <i class="fas fa-calendar-alt"></i>
                         Custom Date
                      </button>
                   </div>
                </div>
             </div>

             <!-- SLOT GRID -->
             <div *ngIf="msg.suggestion.type === 'SLOTS'" class="bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl shadow-md">
                <div class="flex justify-between items-center mb-3">
                   <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Slots</div>
                   <div class="text-[10px] font-bold text-blue-600">{{ msg.suggestion.date | date:'mediumDate' }}</div>
                </div>
                <div class="grid grid-cols-3 gap-2">
                   <button *ngFor="let slot of msg.suggestion.slots" 
                           [value]="slot"
                           #slotBtn
                           (click)="selectFinalSlot(msg.suggestion.doctorId!, msg.suggestion.date!, slotBtn.value)"
                           class="py-2 px-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all">
                      {{ slot }}
                   </button>
                </div>
             </div>

             <!-- CONFIRMATION & PAYMENT -->
             <div *ngIf="msg.suggestion.type === 'CONFIRM'" class="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
                <div class="relative z-10">
                   <div class="text-[10px] opacity-80 mb-1 uppercase tracking-wider">Appointment Overview</div>
                   <div class="font-bold text-base mb-1">{{ msg.suggestion.doctorName }}</div>
                   <div class="text-[11px] opacity-90 mb-4">{{ msg.suggestion.specialization }}</div>
                   
                   <div class="space-y-2 mb-6">
                      <div class="flex items-center gap-3 text-xs">
                         <i class="fas fa-calendar-day opacity-70"></i>
                         <span>{{ msg.suggestion.date | date:'fullDate' }}</span>
                      </div>
                      <div class="flex items-center gap-3 text-xs">
                         <i class="fas fa-clock opacity-70"></i>
                         <span>{{ msg.suggestion.slot }}</span>
                      </div>
                      <div class="flex items-center gap-3 text-xs">
                         <i class="fas fa-wallet opacity-70"></i>
                         <span class="font-bold">₹{{ msg.suggestion.consultationFee }}</span>
                      </div>
                   </div>

                   <button
                     (click)="openPaymentPopup(msg.suggestion)"
                     class="w-full py-3 bg-white text-blue-700 rounded-xl text-xs font-bold shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                     <i class="fas fa-check-circle"></i>
                     Confirm & Pay Now
                   </button>
                </div>
                <i class="fas fa-calendar-check absolute -bottom-4 -right-4 text-8xl opacity-10 rotate-12"></i>
             </div>

          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading()" class="flex gap-2 max-w-[85%]">
          <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <i class="fas fa-robot text-xs text-blue-600 dark:text-blue-400"></i>
          </div>
          <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <form (submit)="sendMessage(); $event.preventDefault()" class="relative">
          <input
            type="text"
            [(ngModel)]="userInput"
            name="userInput"
            [disabled]="isLoading() || isListening()"
            [placeholder]="isListening() ? 'Listening...' : 'Type your health question...'"
            class="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-3 pl-4 pr-24 text-sm focus:ring-2 focus:ring-blue-500 dark:text-gray-100 disabled:opacity-50"
          />
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              (click)="toggleVoiceInput()"
              [disabled]="isLoading()"
              [class.text-red-500]="isListening()"
              [class.animate-pulse]="isListening()"
              class="w-8 h-8 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-all"
              title="Voice Input"
            >
              <i class="fas" [class.fa-microphone]="!isListening()" [class.fa-microphone-slash]="isListening()"></i>
            </button>
            <button
              type="submit"
              [disabled]="!userInput.trim() || isLoading() || isListening()"
              class="w-8 h-8 flex items-center justify-center text-blue-600 dark:text-blue-400 disabled:text-gray-400 transition-colors"
            >
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Payment Popup Integration -->
    <app-payment-popup
      [isVisible]="isPaymentPopupVisible"
      [amount]="currentSuggestion?.consultationFee || 0"
      [title]="'Appointment Booking via AI'"
      [patientId]="patientId()"
      [paymentType]="'APPOINTMENT'"
      [additionalInfo]="getPaymentInfo()"
      (paymentSuccess)="onPaymentSuccess($event)"
      (paymentCancel)="isPaymentPopupVisible = false"
      (paymentError)="onPaymentError($event)"
    ></app-payment-popup>
  `,
    styles: [`
    :host { display: block; }
    .animate-in { animation: slideUp 0.3s ease-out; }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class AiAssistantWidgetComponent implements AfterViewChecked, OnInit {
    @ViewChild('messageContainer') private messageContainer!: ElementRef;

    private aiService = inject(AiAssistantService);
    private appointmentService = inject(AppointmentService);
    private authService = inject(AuthService);
    private toast = inject(ToastService);

    isOpen = signal(false);
    isLoading = signal(false);
    messages = signal<ChatMessage[]>([]);
    userInput = '';

    // Date constraints
    private getLocalDateString(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    minDate = this.getLocalDateString();

    // Payment State
    isPaymentPopupVisible = false;
    // Voice Recognition State
    isListening = signal(false);
    private recognition: any;

    currentSuggestion: AiBookingSuggestion | null = null;
    patientId = () => this.authService.user()?.id || 0;

    constructor() { }

    ngOnInit() {
        this.initVoiceRecognition();
    }

    private initVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => this.isListening.set(true);
        this.recognition.onend = () => this.isListening.set(false);
        this.recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            this.isListening.set(false);
            if (event.error === 'not-allowed') {
                this.toast.showError('Microphone permission denied.');
            }
        };

        this.recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            this.userInput = transcript;
            this.sendMessage();
        };
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.toast.showError('Voice recognition is not supported in your browser.');
            return;
        }

        if (this.isListening()) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    toggleChat() {
        this.isOpen.set(!this.isOpen());
    }

    startBooking() {
        this.sendMessage(`ACTION_GET_SPECIALIZATIONS`);
    }

    selectSpecialization(spec: string) {
        this.sendMessage(`ACTION_SELECT_SPECIALIZATION_${spec}`);
    }

    selectDoctor(doctorId: number) {
        this.sendMessage(`ACTION_SELECT_DOCTOR_${doctorId}`);
    }

    selectRelativeDate(doctorId: number, daysToAdd: number) {
        const date = new Date();
        date.setDate(date.getDate() + daysToAdd);
        const dateStr = this.getLocalDateString(date);
        this.sendMessage(`ACTION_SELECT_DATE_${doctorId}_${dateStr}`);
    }

    onDateSelected(doctorId: number, dateStr: string) {
        if (!dateStr) return;
        this.sendMessage(`ACTION_SELECT_DATE_${doctorId}_${dateStr}`);
    }

    selectFinalSlot(doctorId: number, date: string, slot: string) {
        this.sendMessage(`ACTION_SELECT_SLOT_${doctorId}_${date}_${slot}`);
    }

    sendMessage(text: string = this.userInput.trim()) {
        if (!text || this.isLoading()) return;

        // Add user message to UI (unless it's a hidden action)
        const isAction = text.startsWith('ACTION_');
        if (!isAction) {
            this.messages.update(msgs => [...msgs, {
                text,
                isAi: false,
                timestamp: new Date()
            }]);
            this.userInput = '';
        }

        this.isLoading.set(true);

        this.aiService.sendMessage(text).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                if (res.success && res.response) {
                    this.messages.update(msgs => [...msgs, {
                        text: res.response!,
                        isAi: true,
                        timestamp: new Date(),
                        suggestion: res.suggestion
                    }]);
                } else {
                    this.addBotMessage(res.error || 'Sorry, I encountered an error. Please try again later.');
                }
            },
            error: () => {
                this.isLoading.set(false);
                this.addBotMessage('Connection error. Please check your internet and try again.');
            }
        });
    }

    openPaymentPopup(suggestion: AiBookingSuggestion) {
        if (!this.authService.isAuthenticated()) {
            this.addBotMessage('Please login to book an appointment.');
            return;
        }
        this.currentSuggestion = suggestion;
        this.isPaymentPopupVisible = true;
    }

    getPaymentInfo() {
        if (!this.currentSuggestion) return '';
        return `Booking with ${this.currentSuggestion.doctorName} on ${this.currentSuggestion.date} at ${this.currentSuggestion.slot}`;
    }

    onPaymentSuccess(details: PaymentDetails) {
        this.isPaymentPopupVisible = false;
        const sug = this.currentSuggestion;
        if (!sug || !sug.date || !sug.slot) return;

        // Parse date and time from the suggestion strings (e.g., "2025-12-20" and "10:30")
        const [year, month, day] = sug.date.split('-').map(Number);
        const [hours, minutes] = sug.slot.split(':').map(Number);

        // Build a local ISO string (YYYY-MM-DDTHH:mm:ss) to avoid UTC conversion
        const pad = (n: number) => n.toString().padStart(2, '0');
        const localIsoString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;

        const payload = {
            doctorId: sug.doctorId!,
            appointmentDateTime: localIsoString,
            reason: 'AI Assisted Booking'
        };

        this.isLoading.set(true);
        this.appointmentService.bookAppointment(payload).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.addBotMessage(`Payment Successful! Your appointment with ${sug.doctorName} for ${sug.date} at ${sug.slot} has been confirmed. See you then!`);
                this.currentSuggestion = null;
            },
            error: (err: any) => {
                this.isLoading.set(false);
                this.addBotMessage('Payment was successful, but booking failed: ' + (err.error?.message || 'Please contact support.'));
            }
        });
    }

    onPaymentError(err: string) {
        this.isPaymentPopupVisible = false;
        this.addBotMessage('Payment failed: ' + err);
    }

    private addBotMessage(text: string) {
        this.messages.update(msgs => [...msgs, {
            text,
            isAi: true,
            timestamp: new Date()
        }]);
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        if (this.messageContainer) {
            try {
                const el = this.messageContainer.nativeElement;
                el.scrollTop = el.scrollHeight;
            } catch (err) { }
        }
    }
}
