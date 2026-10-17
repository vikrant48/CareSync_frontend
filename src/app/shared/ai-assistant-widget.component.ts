import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService } from '../core/services/ai-assistant.service';
import { ChatMessage, AiBookingSuggestion, DoctorSuggestion } from '../core/models/ai.models';
import { AppointmentService } from '../core/services/appointment.service';
import { AuthService } from '../core/services/auth.service';
import { PaymentPopupComponent, PaymentDetails } from './payment-popup.component';
import { ToastService } from '../core/services/toast.service';
import { DatePickerComponent } from './date-picker.component';
import { VisionScannerComponent } from './vision-scanner.component';
import { ClinicalDictationComponent } from './clinical-dictation.component';
import { ClinicalDictationResponse } from '../core/models/ai.models';
import { escapeHtml } from './utils/escape-html';

export interface SavedChatSession {
  id: string;
  title: string;
  time: string;
  timestamp: number;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-ai-assistant-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentPopupComponent, DatePickerComponent, VisionScannerComponent, ClinicalDictationComponent],
  template: `
    <!-- Floating Trigger Button -->
    <button
      *ngIf="!isOpen()"
      id="ai-widget-trigger"
      (click)="toggleChat()"
      class="fixed bottom-20 right-4 xl:bottom-8 xl:right-8 w-12 h-12 xl:w-14 xl:h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] group"
    >
      <i class="fas fa-robot text-xl md:text-2xl group-hover:rotate-12 transition-transform" aria-hidden="true"></i>
      <span class="absolute -top-1 -right-1 flex h-3 w-3" *ngIf="messages().length === 0">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
    </button>

    <!-- FLOATING CHAT WINDOW (Compact Mode) -->
    <div
      *ngIf="isOpen() && !isExpanded()"
      class="fixed bottom-20 right-3 sm:right-6 md:bottom-6 md:right-8 w-[min(calc(100vw-1.5rem),440px)] max-h-[calc(100dvh-5.5rem)] h-[min(calc(100dvh-6rem),620px)] bg-[var(--bg)] dark:bg-gray-900 rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden z-[60] animate-in slide-in-from-bottom-5 duration-300 text-[var(--text)]"
    >
      <!-- Header -->
      <div class="p-3.5 sm:p-4 bg-gradient-to-r from-[var(--primary)] via-indigo-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-md">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
            <i class="fas fa-robot text-xl" aria-hidden="true"></i>
          </div>
          <div>
            <h3 class="font-bold text-sm tracking-wide">{{ isDoctor() ? 'Clinical AI Assistant' : 'CareSync AI Assistant' }}</h3>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Online</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
           <button (click)="expandChat()" class="text-[var(--text)]/80 hover:text-[var(--text)] p-1.5 rounded-lg hover:bg-white/10 transition-all" title="Expand Assistant (Fullscreen)" aria-label="Expand Assistant (Fullscreen)">
             <i class="fas fa-expand text-xs sm:text-sm" aria-hidden="true"></i>
           </button>
           <button (click)="isVisionScannerOpen.set(true)" class="text-[var(--text)]/80 hover:text-[var(--text)] p-1.5 rounded-lg hover:bg-white/10 transition-all" title="Scan Prescription / Lab Report (Vision AI)" aria-label="Scan Prescription / Lab Report (Vision AI)">
             <i class="fas fa-camera text-sm" aria-hidden="true"></i>
           </button>
           <button (click)="clearChat()" class="text-[var(--text)]/80 hover:text-[var(--text)] p-1.5 rounded-lg hover:bg-white/10 transition-all" title="Clear Chat" aria-label="Clear Chat">
             <i class="fas fa-trash-alt text-sm" aria-hidden="true"></i>
           </button>
           <button (click)="toggleChat()" class="text-[var(--text)]/80 hover:text-[var(--text)] p-1.5 rounded-lg hover:bg-white/10 transition-all" title="Close Assistant" aria-label="Close Assistant">
             <i class="fas fa-times text-base" aria-hidden="true"></i>
           </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div #messageContainer class="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg)] scroll-smooth no-scrollbar">
        <!-- Messages Content Template -->
        <ng-container *ngTemplateOutlet="chatMessagesContent"></ng-container>
      </div>

      <!-- Input Area -->
      <div class="p-3.5 bg-[var(--panel)] border-t border-[var(--border)] shrink-0">
        <form (submit)="sendMessage(); $event.preventDefault()" class="relative flex items-center">
          <input
            type="text"
            [(ngModel)]="userInput"
            name="compactUserInput"
            [disabled]="isLoading() || isListening()"
            [placeholder]="isListening() ? 'Listening...' : 'Type your health question...'"
            class="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl py-3 pl-4 pr-24 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50 transition-all"
          />
          <div class="absolute right-2.5 flex items-center gap-1">
            <button
              type="button"
              (click)="isVisionScannerOpen.set(true)"
              [disabled]="isLoading()"
              class="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/10 rounded-lg transition-all"
              title="Scan Prescription / Lab Report (Vision AI)" aria-label="Scan Prescription / Lab Report (Vision AI)">
              <i class="fas fa-camera text-sm" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              (click)="toggleVoiceInput()"
              [disabled]="isLoading()"
              [class.text-red-400]="isListening()"
              [class.animate-pulse]="isListening()"
              class="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/10 rounded-lg transition-all"
              title="Voice Input" aria-label="Voice Input">
              <i class="fas" [class.fa-microphone]="!isListening()" [class.fa-microphone-slash]="isListening()" aria-hidden="true"></i>
            </button>
            <button
              type="submit"
              [disabled]="!userInput.trim() || isLoading() || isListening()"
              class="w-8 h-8 flex items-center justify-center bg-[var(--primary)] hover:bg-indigo-600 disabled:bg-[var(--border)] text-white disabled:text-[var(--muted)] rounded-xl transition-all shadow-md shadow-[var(--primary)]/20"
            >
              <i class="fas fa-paper-plane text-xs" aria-hidden="true"></i>
            </button>
          </div>
        </form>
      </div>
    </div>


    <!-- EXPANDED MODAL OVERLAY (Fullscreen Mode - 85-90% Viewport) -->
    <div
      *ngIf="isOpen() && isExpanded()"
      class="fixed inset-x-0 bottom-0 top-[4.25rem] bg-black/75 backdrop-blur-md z-[70] flex items-center justify-center px-2 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6 animate-in fade-in duration-300"
    >
      <div
        class="w-full max-w-6xl h-[min(88dvh,calc(100dvh-5.25rem))] max-h-[860px] bg-[var(--bg)] rounded-3xl shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden text-[var(--text)] relative"
      >
        <!-- Expanded Modal Header -->
        <div class="p-3.5 sm:p-4 bg-gradient-to-r from-[var(--primary)] via-indigo-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
              <i class="fas fa-robot text-xl" aria-hidden="true"></i>
            </div>
            <div>
              <h3 class="font-bold text-sm sm:text-base tracking-wide">{{ isDoctor() ? 'Clinical AI Assistant' : 'CareSync AI Assistant' }}</h3>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Online</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
             <button (click)="isVisionScannerOpen.set(true)" class="text-[var(--text)]/80 hover:text-[var(--text)] p-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold" title="Scan Prescription / Lab Report (Vision AI)" aria-label="Scan Prescription / Lab Report (Vision AI)">
               <i class="fas fa-camera text-sm" aria-hidden="true"></i>
               <span class="hidden sm:inline">Scan Vision</span>
             </button>
             <button (click)="clearChat()" class="text-[var(--text)]/80 hover:text-[var(--text)] p-2 rounded-lg hover:bg-white/10 transition-all" title="Clear Chat" aria-label="Clear Chat">
               <i class="fas fa-trash-alt text-sm" aria-hidden="true"></i>
             </button>
             <button (click)="minimizeChat()" class="text-[var(--text)]/80 hover:text-[var(--text)] p-2 rounded-lg hover:bg-white/10 transition-all" title="Minimize Window" aria-label="Minimize Window">
               <i class="fas fa-compress text-sm" aria-hidden="true"></i>
             </button>
             <button (click)="toggleChat()" class="text-[var(--text)]/80 hover:text-[var(--text)] p-2 rounded-lg hover:bg-white/10 transition-all" title="Close Assistant" aria-label="Close Assistant">
               <i class="fas fa-times text-base" aria-hidden="true"></i>
             </button>
          </div>
        </div>

        <!-- Expanded 2-Column Body -->
        <div class="flex-1 flex overflow-hidden min-h-0">
          
          <!-- Left Sidebar: Recent Chats & Tips -->
          <div class="hidden md:flex w-72 flex-col bg-[var(--panel)] border-r border-[var(--border)] p-4 shrink-0 justify-between">
            <div class="space-y-4">
              <!-- New Chat Button -->
              <button 
                (click)="clearChat()"
                class="btn-size-lg w-full bg-[var(--primary)] hover:bg-indigo-600 active:scale-95 text-white font-bold text-sm px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[var(--primary)]/25"
              >
                <i class="fas fa-plus text-xs" aria-hidden="true"></i>
                <span>New Chat</span>
              </button>

              <!-- Recent Chats Header -->
              <div class="flex items-center justify-between px-1 mb-1">
                <span class="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Recent Chats</span>
                <span class="text-[9px] bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)] px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1" title="Cloud chat backup will be available in future updates">
                  <i class="fa-solid fa-cloud-arrow-up text-[9px]" aria-hidden="true"></i> Cloud Sync Soon
                </span>
              </div>

              <!-- Recent Chats List -->
              <div class="space-y-1.5 overflow-y-auto max-h-[calc(88vh-260px)] no-scrollbar pr-1">
                <div *ngIf="recentChats().length === 0" class="p-3 text-center bg-[var(--bg)]/50 border border-dashed border-[var(--border)] rounded-xl">
                  <i class="fa-regular fa-comments text-lg text-[var(--muted)] mb-1" aria-hidden="true"></i>
                  <p class="text-[11px] text-[var(--muted)]">No past local chats yet.</p>
                  <span class="text-[9px] text-gray-500">Your conversations will be saved here automatically.</span>
                </div>

                <div 
                  *ngFor="let chat of recentChats()"
                  (click)="selectRecentChat(chat)"
                  class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group"
                  [ngClass]="activeSessionId === chat.id ? 'bg-[var(--bg)] border-[var(--primary)]/60 shadow-md' : 'bg-transparent border-transparent hover:bg-[var(--bg)]/60 hover:border-[var(--border)]'"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <i class="fa-regular fa-comments text-xs" [ngClass]="activeSessionId === chat.id ? 'text-[var(--primary)]' : 'text-[var(--muted)]'" aria-hidden="true"></i>
                    <div class="min-w-0">
                      <h5 class="text-xs font-bold truncate" [ngClass]="activeSessionId === chat.id ? 'text-[var(--text)]' : 'text-[var(--muted)] group-hover:text-[var(--text)]'">{{ chat.title }}</h5>
                      <span class="text-[10px] text-[var(--muted)] opacity-80 truncate block">{{ chat.time }}</span>
                    </div>
                  </div>
                  <button 
                    (click)="deleteRecentChat(chat.id, $event)" 
                    class="text-[var(--muted)] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                    title="Delete Chat Session" aria-label="Delete Chat Session">
                    <i class="fa-solid fa-trash-can text-xs" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Tip Card at Bottom of Sidebar -->
            <div class="p-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-2xl">
              <div class="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs mb-1">
                <i class="fa-regular fa-lightbulb" aria-hidden="true"></i>
                <span>Tip</span>
              </div>
              <p class="text-[11px] text-[var(--muted)] leading-relaxed">
                You can ask me about appointments, medications, lab tests, and general health information.
              </p>
            </div>
          </div>

          <!-- Right Column: Main Chat & Guidance Cards -->
          <div class="flex-1 flex flex-col min-w-0 bg-[var(--bg)] relative">
            <!-- Messages Container -->
            <div #expandedMessageContainer class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth custom-scrollbar">
              
              <!-- Topic Guidance Cards Grid (Shown when conversation has no user messages) -->
              <div *ngIf="messages().length === 0" class="mb-4">
                <div class="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3 px-1">You can also ask me about:</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  <!-- Symptoms -->
                  <div (click)="askTopic('What symptoms should I get checked by a doctor?')" 
                       class="p-3.5 bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">
                      <i class="fa-solid fa-stethoscope" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <h5 class="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">Symptoms</h5>
                      <p class="text-[11px] text-[var(--muted)] truncate">Get general guidance</p>
                    </div>
                  </div>

                  <!-- Lab Tests -->
                  <div (click)="askTopic('How do I view or book lab tests?')" 
                       class="p-3.5 bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">
                      <i class="fa-solid fa-flask" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <h5 class="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">Lab Tests</h5>
                      <p class="text-[11px] text-[var(--muted)] truncate">Understand your reports</p>
                    </div>
                  </div>

                  <!-- Medications -->
                  <div (click)="askTopic('Can you explain medication usage and side effects?')" 
                       class="p-3.5 bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">
                      <i class="fa-solid fa-pills" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <h5 class="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">Medications</h5>
                      <p class="text-[11px] text-[var(--muted)] truncate">Usage & side effects</p>
                    </div>
                  </div>

                  <!-- Health Records -->
                  <div (click)="askTopic('How can I view my past medical records?')" 
                       class="p-3.5 bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">
                      <i class="fa-solid fa-file-medical" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <h5 class="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">Health Records</h5>
                      <p class="text-[11px] text-[var(--muted)] truncate">View & explain</p>
                    </div>
                  </div>

                  <!-- Doctor Suggestions -->
                  <div (click)="startBooking()" 
                       class="p-3.5 bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">
                      <i class="fa-solid fa-user-doctor" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <h5 class="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">Doctor Suggestions</h5>
                      <p class="text-[11px] text-[var(--muted)] truncate">Find the right specialist</p>
                    </div>
                  </div>

                  <!-- Lifestyle Advice -->
                  <div (click)="askTopic('Give me general tips for healthy living and wellness.')" 
                       class="p-3.5 bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">
                      <i class="fa-solid fa-heart-pulse" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <h5 class="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">Lifestyle Advice</h5>
                      <p class="text-[11px] text-[var(--muted)] truncate">Tips for better health</p>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Shared Chat Messages Template outlet -->
              <ng-container *ngTemplateOutlet="chatMessagesContent"></ng-container>

            </div>

            <!-- Fixed Bottom Input Bar -->
            <div class="p-4 bg-[var(--panel)] border-t border-[var(--border)] shrink-0">
              <form (submit)="sendMessage(); $event.preventDefault()" class="relative flex items-center">
                <input
                  type="text"
                  [(ngModel)]="userInput"
                  name="expandedUserInput"
                  [disabled]="isLoading() || isListening()"
                  [placeholder]="isListening() ? 'Listening...' : 'Type your health question...'"
                  class="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl py-3.5 pl-5 pr-28 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50 transition-all"
                />
                <div class="absolute right-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="isVisionScannerOpen.set(true)"
                    [disabled]="isLoading()"
                    class="w-9 h-9 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/10 rounded-xl transition-all"
                    title="Scan Prescription / Lab Report (Vision AI)" aria-label="Scan Prescription / Lab Report (Vision AI)">
                    <i class="fas fa-camera text-sm" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    (click)="toggleVoiceInput()"
                    [disabled]="isLoading()"
                    [class.text-red-400]="isListening()"
                    [class.animate-pulse]="isListening()"
                    class="w-9 h-9 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/10 rounded-xl transition-all"
                    title="Voice Input" aria-label="Voice Input">
                    <i class="fas" [class.fa-microphone]="!isListening()" [class.fa-microphone-slash]="isListening()" aria-hidden="true"></i>
                  </button>
                  <button
                    type="submit"
                    [disabled]="!userInput.trim() || isLoading() || isListening()"
                    class="w-9 h-9 flex items-center justify-center bg-[var(--primary)] hover:bg-indigo-600 disabled:bg-[var(--border)] text-white disabled:text-[var(--muted)] rounded-xl transition-all shadow-md shadow-[var(--primary)]/20"
                  >
                    <i class="fas fa-paper-plane text-xs" aria-hidden="true"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>


    <!-- REUSABLE CHAT MESSAGES CONTENT TEMPLATE -->
    <ng-template #chatMessagesContent>
      <!-- Welcome Message -->
      <div class="flex gap-2.5 max-w-[92%]">
        <div class="w-9 h-9 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center shrink-0">
          <i class="fas fa-robot text-xs text-[var(--primary)]" aria-hidden="true"></i>
        </div>
        <div class="bg-[var(--panel)] p-3.5 rounded-2xl rounded-tl-none shadow-md border border-[var(--border)] text-[var(--text)]">
          <p class="text-sm" *ngIf="!isDoctor()">Hello! I'm your CareSync Assistant. How can I help you with your health today?</p>
          <p class="text-sm" *ngIf="isDoctor()">Hello Doctor. I'm your Clinical Assistant. How can I assist you with patient history or clinical queries today?</p>
          <p class="text-[10px] text-[var(--muted)] mt-2 italic font-medium">{{ isDoctor() ? 'This AI assistant is for clinical guidance and does not replace medical evidence.' : 'CareSync AI can provide health guidance but is not a substitute for professional medical advice.' }}</p>
          
          <div class="flex flex-wrap gap-2 mt-3">
            <button 
              *ngIf="!isDoctor()"
              (click)="startBooking()"
              class="btn-size-lg flex items-center gap-2 px-3.5 bg-[var(--primary)] hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-md shadow-[var(--primary)]/20"
            >
              <i class="fas fa-calendar-plus" aria-hidden="true"></i>
              Book Appointment
            </button>

            <button 
              (click)="isVisionScannerOpen.set(true)"
              class="btn-size-lg flex items-center gap-2 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-md shadow-purple-500/20"
            >
              <i class="fas fa-camera" aria-hidden="true"></i>
              Scan Prescription
            </button>

            <button 
              *ngIf="isDoctor()"
              (click)="isClinicalDictationOpen.set(true)"
              class="btn-size-lg flex items-center gap-2 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-md shadow-blue-500/20"
            >
              <i class="fas fa-microphone-alt" aria-hidden="true"></i>
              Voice Dictation (SOAP)
            </button>
          </div>
        </div>
      </div>

      <!-- Dynamic Messages -->
      <div *ngFor="let msg of messages()" class="flex flex-col gap-2" [ngClass]="msg.isAi ? 'max-w-[95%]' : 'max-w-[85%] ml-auto'">
        <div class="flex gap-2.5" [ngClass]="msg.isAi ? '' : 'flex-row-reverse text-right'">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md" 
               [ngClass]="msg.isAi ? 'bg-[var(--primary)]/20 border border-[var(--primary)]/40' : 'bg-[var(--primary)]'">
            <i class="fas" [ngClass]="msg.isAi ? 'fa-robot text-xs text-[var(--primary)]' : 'fa-user text-xs text-[var(--text)]'" aria-hidden="true"></i>
          </div>
          <div class="p-3.5 rounded-2xl shadow-md border" 
               [ngClass]="msg.isAi ? 'bg-[var(--panel)] text-[var(--text)] rounded-tl-none border-[var(--border)]' : 'bg-[var(--primary)] text-white rounded-tr-none border-[var(--primary)]'">
            <div *ngIf="msg.isAi" [innerHTML]="formatAiMessage(msg.text)" class="text-sm"></div>
            <p *ngIf="!msg.isAi" class="text-sm whitespace-pre-wrap">{{ msg.text }}</p>
            <span class="text-[9px] mt-1 block opacity-60 text-right">{{ msg.timestamp | date:'shortTime' }}</span>
          </div>
        </div>

        <!-- Suggestion Cards based on type -->
        <div *ngIf="msg.suggestion" class="ml-10 space-y-2 animate-in zoom-in-95 duration-200">
           
           <!-- SPECIALIZATIONS -->
           <div *ngIf="msg.suggestion.type === 'SPECIALIZATIONS'" class="flex flex-wrap gap-2 py-1">
              <button *ngFor="let spec of msg.suggestion.specializations" 
                      (click)="selectSpecialization(spec, msg.suggestion.reason)"
                      class="btn-size-sm px-3 bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-lg text-[11px] font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all shadow-sm inline-flex items-center justify-center">
                 {{ spec }}
              </button>
           </div>

           <!-- DOCTOR LIST -->
           <div *ngIf="msg.suggestion.type === 'DOCTORS'" class="space-y-3">
             <div class="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                <div *ngFor="let doc of msg.suggestion.doctors" 
                     (click)="chooseDoctorSuggestion(doc, msg.suggestion.reason)"
                     class="min-w-[200px] bg-[var(--panel)] border border-[var(--border)] p-4 rounded-xl shadow-md hover:border-[var(--primary)] border-2 cursor-pointer transition-all hover:shadow-lg">
                   <div class="flex items-start gap-3 mb-3">
                      <div class="w-12 h-12 rounded-full bg-[var(--bg)] flex items-center justify-center overflow-hidden shrink-0 border border-[var(--border)]">
                         <img *ngIf="doc.profileImageUrl" [src]="doc.profileImageUrl" class="w-full h-full object-cover">
                         <i *ngIf="!doc.profileImageUrl" class="fas fa-user-md text-xl text-[var(--primary)]" aria-hidden="true"></i>
                      </div>
                       <div class="overflow-hidden">
                          <div class="text-[12px] font-bold truncate flex items-center gap-1.5 text-[var(--text)]">
                             {{ doc.name }}
                             <i *ngIf="doc.isVerified" class="fa-solid fa-circle-check text-[var(--primary)] text-[10px]" title="Verified" aria-hidden="true"></i>
                             <span *ngIf="doc['isOnLeave']" class="px-1.5 py-0.5 bg-red-900/40 text-red-700 dark:text-red-400 text-[8px] font-black uppercase rounded-md border border-red-800 shrink-0">Away</span>
                          </div>
                          <div class="text-[10px] text-[var(--primary)] font-medium truncate">{{ doc.specialization }}</div>
                       </div>
                   </div>
                   
                   <div class="space-y-1.5 mb-3">
                      <div class="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                         <i class="fas fa-star text-amber-700 dark:text-amber-400" aria-hidden="true"></i>
                         <span>{{ doc.experience }} Years Experience</span>
                      </div>
                      <div class="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                         <i class="fas fa-language text-indigo-700 dark:text-indigo-400" aria-hidden="true"></i>
                         <span class="truncate">{{ doctorLanguages(doc.languages) }}</span>
                      </div>
                   </div>

                   <div class="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                      <span class="text-[10px] text-[var(--muted)]">Consultation Fee</span>
                      <span class="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">₹{{ doc.consultationFee }}</span>
                   </div>
                   <div *ngIf="doc.recommendedDate && doc.recommendedSlot"
                        class="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-[10px] text-emerald-700 dark:text-emerald-300">
                      <i class="fa-solid fa-calendar-check mr-1" aria-hidden="true"></i>
                      Earliest: {{ doc.recommendedDate | date:'mediumDate' }} at {{ doc.recommendedSlot }}
                   </div>
                </div>
             </div>
             
             <button (click)="startBooking()" class="text-xs text-[var(--primary)] hover:text-indigo-300 hover:underline flex items-center gap-1 pl-1">
                <i class="fas fa-arrow-left" aria-hidden="true"></i> Change Specialization
             </button>
           </div>

           <!-- DATE SELECTION -->
           <div *ngIf="msg.suggestion.type === 'DATES'" class="bg-[var(--panel)] border border-[var(--border)] p-4 rounded-xl shadow-md">
              <div class="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Select Appointment Date</div>
              <div class="flex flex-wrap gap-2 mb-3">
                  <button (click)="selectRelativeDate(msg.suggestion.doctorId!, 0, msg.suggestion.reason)" class="btn-size-md px-4 bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[var(--primary)] hover:text-white transition-all inline-flex items-center justify-center">Today</button>
                 <button (click)="selectRelativeDate(msg.suggestion.doctorId!, 1, msg.suggestion.reason)" class="btn-size-md px-4 bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[var(--primary)] hover:text-white transition-all inline-flex items-center justify-center">Tomorrow</button>
                 
                 <div class="mt-2 text-[var(--text)]">
                    <app-date-picker
                      #customDP
                      label="Custom Date"
                      [minDate]="minDate"
                      placeholder="DD-MM-YYYY"
                      (dateChange)="onDateSelected(msg.suggestion.doctorId!, $event, msg.suggestion.reason)">
                    </app-date-picker>
                 </div>
              </div>
              <button (click)="selectSpecialization(msg.suggestion.specialization!, msg.suggestion.reason)" class="text-xs text-[var(--primary)] hover:text-indigo-300 hover:underline flex items-center gap-1 pl-1">
                <i class="fas fa-arrow-left" aria-hidden="true"></i> Change Doctor
             </button>
           </div>

           <!-- SLOT GRID -->
           <div *ngIf="msg.suggestion.type === 'SLOTS'" class="bg-[var(--panel)] border border-[var(--border)] p-4 rounded-xl shadow-md">
              <div class="flex justify-between items-center mb-3">
                 <div class="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Available Slots</div>
                 <div class="text-[10px] font-bold text-[var(--primary)]">{{ msg.suggestion.date | date:'mediumDate' }}</div>
              </div>
              <div class="grid grid-cols-3 gap-2 mb-3">
                 <button *ngFor="let slot of msg.suggestion.slots" 
                         (click)="selectFinalSlot(msg.suggestion.doctorId!, msg.suggestion.date!, slot, msg.suggestion.reason)"
                         class="btn-size-sm px-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-lg text-[10px] font-bold hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all inline-flex items-center justify-center">
                    {{ slot }}
                 </button>
              </div>
              <button (click)="selectDoctor(msg.suggestion.doctorId!, msg.suggestion.reason)" class="text-xs text-[var(--primary)] hover:text-indigo-300 hover:underline flex items-center gap-1 pl-1">
                <i class="fas fa-arrow-left" aria-hidden="true"></i> Change Date
             </button>
           </div>

            <!-- CONFIRMATION & PAYMENT -->
           <div *ngIf="msg.suggestion.type === 'CONFIRM'" class="bg-gradient-to-br from-[var(--primary)] to-indigo-700 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
              <div class="relative z-10">
                 <div class="text-[10px] opacity-80 mb-1 uppercase tracking-wider">
                    {{ msg.suggestion.reason?.startsWith('RESCHEDULE') ? 'Rescheduling Overview' : 'Appointment Overview' }}
                 </div>
                 <div class="font-bold text-base mb-1">{{ msg.suggestion.doctorName }}</div>
                 <div class="text-[11px] opacity-90 mb-4">{{ msg.suggestion.specialization }}</div>
                 
                 <div class="space-y-2 mb-6">
                    <div *ngIf="msg.suggestion.reason?.startsWith('RESCHEDULE')" class="p-2 bg-white/10 rounded-lg mb-3 border border-white/20">
                       <div class="text-[9px] uppercase tracking-tighter opacity-70 mb-1">Rescheduling from</div>
                       <div class="text-[11px] font-medium flex items-center gap-2">
                         <i class="fas fa-history opacity-50" aria-hidden="true"></i>
                         {{ msg.suggestion.originalDate | date:'mediumDate' }} at {{ msg.suggestion.originalSlot }}
                       </div>
                    </div>

                    <div class="flex items-center gap-3 text-xs">
                       <i class="fas fa-calendar-day opacity-70" aria-hidden="true"></i>
                       <span>{{ msg.suggestion.date | date:'fullDate' }}</span>
                    </div>
                    <div class="flex items-center gap-3 text-xs">
                       <i class="fas fa-clock opacity-70" aria-hidden="true"></i>
                       <span>{{ msg.suggestion.slot }}</span>
                    </div>
                    <div *ngIf="!msg.suggestion.reason?.startsWith('RESCHEDULE')" class="flex items-center gap-3 text-xs">
                       <i class="fas fa-wallet opacity-70" aria-hidden="true"></i>
                       <span class="font-bold">₹{{ msg.suggestion.consultationFee }}</span>
                    </div>
                    
                    <div class="mt-4 p-2 bg-white/10 rounded-lg border border-white/20">
                       <div class="text-[9px] uppercase tracking-tighter opacity-70 mb-1">Reason for visit</div>
                       <input type="text" [(ngModel)]="editableReason" 
                              [name]="'reason_' + msg.timestamp.getTime()"
                              class="w-full bg-transparent border-none text-[11px] font-medium placeholder-white/50 focus:ring-0 p-0"
                              placeholder="State your reason...">
                    </div>
                 </div>

                 <button
                   (click)="openPaymentPopup(msg.suggestion)"
                   class="w-full py-3 bg-white text-indigo-700 rounded-xl text-xs font-bold shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2 mb-3"
                 >
                   <i class="fas fa-check-circle" aria-hidden="true"></i>
                   {{ msg.suggestion.reason?.startsWith('RESCHEDULE') ? 'Confirm Reschedule' : 'Confirm & Pay Now' }}
                 </button>
                 
                 <button (click)="onDateSelected(msg.suggestion.doctorId!, msg.suggestion.date!, msg.suggestion.reason)" class="w-full text-xs text-[var(--text)]/70 hover:text-[var(--text)] flex items-center justify-center gap-1">
                    <i class="fas fa-arrow-left" aria-hidden="true"></i> Change Slot
                 </button>
              </div>
              <i class="fas fa-calendar-check absolute -bottom-4 -right-4 text-8xl opacity-10 rotate-12" aria-hidden="true"></i>
           </div>

           <!-- MY APPOINTMENTS -->
           <div *ngIf="msg.suggestion.type === 'MY_APPOINTMENTS'" class="space-y-3">
              <div *ngFor="let appt of msg.suggestion.appointments" 
                   class="bg-[var(--panel)] border border-[var(--border)] p-4 rounded-xl shadow-sm">
                 <div class="flex items-center justify-between mb-3">
                    <div>
                       <div class="text-[12px] font-bold text-[var(--text)]">{{ appt.doctorName }}</div>
                       <div class="text-[10px] text-[var(--muted)]">{{ appt.appointmentDateTime | date:'medium' }}</div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase"
                          [ngClass]="{
                             'bg-emerald-900/40 text-emerald-700 dark:text-emerald-400': appt.status === 'CONFIRMED',
                             'bg-yellow-900/40 text-yellow-700 dark:text-yellow-400': appt.status === 'PENDING',
                             'bg-red-900/40 text-red-700 dark:text-red-400': appt.status === 'CANCELLED'
                          }">
                       {{ appt.status }}
                    </span>
                 </div>
                 <div class="flex gap-2">
                    <button (click)="cancelAppointment(appt.id)" 
                            class="flex-1 py-2 bg-red-900/30 text-red-700 dark:text-red-400 border border-red-800 rounded-lg text-[10px] font-bold hover:bg-red-600 hover:text-[var(--text)] transition-all">
                       Cancel
                    </button>
                    <button (click)="rescheduleAppointment(appt.id)" 
                            class="flex-1 py-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)] rounded-lg text-[10px] font-bold hover:bg-[var(--primary)] hover:text-white transition-all">
                       Reschedule
                    </button>
                 </div>
              </div>
           </div>

        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="flex gap-2 max-w-[85%]">
        <div class="w-8 h-8 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center shrink-0">
          <i class="fas fa-robot text-xs text-[var(--primary)]" aria-hidden="true"></i>
        </div>
        <div class="bg-[var(--panel)] p-3 rounded-2xl rounded-tl-none shadow-sm border border-[var(--border)] flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:0.4s]"></span>
        </div>
      </div>
    </ng-template>

    <!-- Vision AI Prescription & Report Scanner Modal -->
    <app-vision-scanner
      *ngIf="isVisionScannerOpen()"
      (closeModal)="isVisionScannerOpen.set(false)"
      (scanComplete)="onVisionScanComplete($event)"
    ></app-vision-scanner>

    <!-- AI Doctor Voice Dictation Modal -->
    <app-clinical-dictation
      *ngIf="isClinicalDictationOpen()"
      (closeModal)="isClinicalDictationOpen.set(false)"
      (dictationComplete)="onDictationComplete($event)"
    ></app-clinical-dictation>

    <!-- Payment Popup Integration -->
    <app-payment-popup
      [isVisible]="isPaymentPopupVisible"
      [amount]="currentSuggestion?.consultationFee || 0"
      [title]="'Appointment Booking via AI'"
      [patientId]="patientId()"
      [appointmentBookingDetails]="getAppointmentBookingDetails()"
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
  @ViewChild('expandedMessageContainer') private expandedMessageContainer!: ElementRef;

  private aiService = inject(AiAssistantService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  isOpen = signal(false);
  isExpanded = signal(false);
  isDoctor = signal(false);
  isLoading = signal(false);
  isVisionScannerOpen = signal(false);
  isClinicalDictationOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  userInput = '';
  editableReason = '';

  recentChats = signal<SavedChatSession[]>([]);
  activeSessionId: string | null = null;

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
    this.isDoctor.set(this.authService.user()?.role === 'DOCTOR');
    this.initVoiceRecognition();
    this.loadRecentChatsFromStorage();
  }

  private initVoiceRecognition() {
    if (typeof window === 'undefined') return;
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

  /** Chat history is stored per user so accounts sharing a device never see each other's chats. */
  private get sessionsStorageKey(): string {
    const id = this.authService.user()?.id ?? this.authService.userId() ?? 'anonymous';
    return `caresync_ai_sessions_${id}`;
  }

  private loadRecentChatsFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      // Legacy shared key (not attributable to a user): remove it
      localStorage.removeItem('caresync_ai_sessions');
      const raw = localStorage.getItem(this.sessionsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.recentChats.set(parsed);
      }
    } catch (e) { }
  }

  private persistRecentChats() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.sessionsStorageKey, JSON.stringify(this.recentChats()));
    } catch (e) { }
  }

  saveCurrentSession() {
    const currentMsgs = this.messages();
    if (!currentMsgs || currentMsgs.length === 0) return;

    const firstUserMsg = currentMsgs.find(m => !m.isAi);
    const title = firstUserMsg ? (firstUserMsg.text.length > 22 ? firstUserMsg.text.substring(0, 22) + '...' : firstUserMsg.text) : 'General Health';
    const now = new Date();
    const time = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const id = this.activeSessionId || ('session_' + Date.now());

    this.activeSessionId = id;

    const session: SavedChatSession = {
      id,
      title,
      time,
      timestamp: Date.now(),
      messages: currentMsgs
    };

    this.recentChats.update(chats => {
      const filtered = chats.filter(c => c.id !== id);
      return [session, ...filtered];
    });

    this.persistRecentChats();
  }

  selectRecentChat(session: SavedChatSession) {
    if (this.messages().length > 0) {
      this.saveCurrentSession();
    }
    this.activeSessionId = session.id;
    this.messages.set(session.messages || []);
  }

  deleteRecentChat(sessionId: string, event: Event) {
    event.stopPropagation();
    this.recentChats.update(chats => chats.filter(c => c.id !== sessionId));
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
      this.messages.set([]);
    }
    this.persistRecentChats();
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
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.isExpanded.set(false);
    } else {
      this.isOpen.set(true);
    }
  }

  expandChat() {
    this.isOpen.set(true);
    this.isExpanded.set(true);
  }

  minimizeChat() {
    this.isExpanded.set(false);
  }

  askTopic(topicPrompt: string) {
    this.sendMessage(topicPrompt);
  }

  clearChat() {
    if (this.messages().length > 0) {
      this.saveCurrentSession();
    }
    this.aiService.resetConversation();
    this.activeSessionId = null;
    this.messages.set([]);
    this.userInput = '';
  }

  startBooking() {
    this.sendMessage(`ACTION_GET_SPECIALIZATIONS`);
  }

  selectSpecialization(spec: string, reason?: string) {
    this.sendMessage(`ACTION_SELECT_SPECIALIZATION_${spec}${reason ? '_' + reason : ''}`);
  }

  doctorLanguages(value: unknown): string {
    const items = Array.isArray(value) ? value : String(value ?? '').split(',');
    const text = items.map(item => String(item).trim()).filter(Boolean).join(', ');
    return text || 'Not provided';
  }

  selectDoctor(doctorId: number, reason?: string) {
    this.sendMessage(`ACTION_SELECT_DOCTOR_${doctorId}${reason ? '_' + reason : ''}`);
  }

  chooseDoctorSuggestion(doctor: DoctorSuggestion, reason?: string) {
    if (doctor.recommendedDate && doctor.recommendedSlot) {
      this.selectFinalSlot(doctor.id, doctor.recommendedDate, doctor.recommendedSlot, reason);
      return;
    }
    this.selectDoctor(doctor.id, reason);
  }

  selectRelativeDate(doctorId: number, daysToAdd: number, reason?: string) {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    const dateStr = this.getLocalDateString(date);
    this.sendMessage(`ACTION_SELECT_DATE_${doctorId}_${dateStr}${reason ? '_' + reason : ''}`);
  }

  onDateSelected(doctorId: number, dateStr: string, reason?: string) {
    if (!dateStr) return;
    this.sendMessage(`ACTION_SELECT_DATE_${doctorId}_${dateStr}${reason ? '_' + reason : ''}`);
  }

  selectFinalSlot(doctorId: number, date: string, slot: string, reason?: string) {
    this.sendMessage(`ACTION_SELECT_SLOT_${doctorId}_${date}_${slot}${reason ? '_' + reason : ''}`);
  }

  cancelAppointment(apptId: number) {
    this.sendingInternalAction = true;
    this.sendMessage(`ACTION_CANCEL_APPOINTMENT_${apptId}`);
  }

  rescheduleAppointment(apptId: number) {
    this.sendingInternalAction = true;
    this.sendMessage(`ACTION_START_RESCHEDULE_${apptId}`);
  }

  private sendingInternalAction = false;

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
        this.sendingInternalAction = false;
        if (res.success && res.response) {
          this.messages.update(msgs => [...msgs, {
            text: res.response!,
            isAi: true,
            timestamp: new Date(),
            suggestion: res.suggestion
          }]);
          this.saveCurrentSession();
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
    this.editableReason = suggestion.reason || 'AI Assisted Booking';

    if (suggestion.reason?.startsWith('RESCHEDULE')) {
      this.executeAppointmentAction(suggestion);
      return;
    }
    this.isPaymentPopupVisible = true;
  }

  getAppointmentBookingDetails(): {
    doctorId: number;
    appointmentDateTime: string;
    reason?: string;
    bookingSource: 'AI_ASSISTED';
  } | undefined {
    if (!this.currentSuggestion || !this.currentSuggestion.doctorId || !this.currentSuggestion.date || !this.currentSuggestion.slot) {
      return undefined;
    }
    const [year, month, day] = this.currentSuggestion.date.split('-').map(Number);
    const [hours, minutes] = this.currentSuggestion.slot.split(':').map(Number);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIsoString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;

    return {
      doctorId: this.currentSuggestion.doctorId,
      appointmentDateTime: localIsoString,
      reason: this.editableReason || 'AI Assisted Booking',
      bookingSource: 'AI_ASSISTED'
    };
  }

  getPaymentInfo() {
    if (!this.currentSuggestion) return '';
    return `Booking with ${this.currentSuggestion.doctorName} on ${this.currentSuggestion.date} at ${this.currentSuggestion.slot}`;
  }

  onPaymentSuccess(details: PaymentDetails) {
    if (this.currentSuggestion) {
      const sug = this.currentSuggestion;
      this.addBotMessage(`Success! Your appointment with ${sug.doctorName} for ${sug.date} at ${sug.slot} has been confirmed and paid. Receipt generated!`);
      this.currentSuggestion = null;
    }
  }

  private executeAppointmentAction(sug: AiBookingSuggestion) {
    if (!sug || !sug.date || !sug.slot) return;

    const [year, month, day] = sug.date.split('-').map(Number);
    const [hours, minutes] = sug.slot.split(':').map(Number);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIsoString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;

    this.isLoading.set(true);

    if (sug.reason?.startsWith('RESCHEDULE:')) {
      const apptId = parseInt(sug.reason.split(':')[1]);
      this.appointmentService.rescheduleMyAppointment(apptId, localIsoString).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.addBotMessage(`Success! Your appointment has been rescheduled to ${sug.date} at ${sug.slot}.`);
          this.currentSuggestion = null;
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.addBotMessage('Rescheduling failed: ' + (err.error?.message || 'Internal error.'));
        }
      });
    } else {
      const payload = {
        doctorId: sug.doctorId!,
        appointmentDateTime: localIsoString,
        reason: this.editableReason || 'AI Assisted Booking',
        bookingSource: 'AI_ASSISTED' as const
      };

      this.appointmentService.bookAppointment(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.addBotMessage(`Success! Your appointment with ${sug.doctorName} for ${sug.date} at ${sug.slot} has been confirmed. See you then!`);
          this.currentSuggestion = null;
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.addBotMessage('Booking failed: ' + (err.error?.message || 'Please contact support.'));
        }
      });
    }
  }

  onPaymentError(err: string) {
    this.isPaymentPopupVisible = false;
    this.addBotMessage('Payment failed: ' + err);
  }

  onVisionScanComplete(res: any) {
    if (!res || !res.success) return;
    let summaryText = `📷 **Vision AI Scan Results (${res.documentType || 'Document'}):**\n\n`;
    if (res.rawSummary) {
      summaryText += `${res.rawSummary}\n\n`;
    }
    if (res.medications && res.medications.length > 0) {
      summaryText += `**Extracted Medications (${res.medications.length}):**\n`;
      res.medications.forEach((m: any) => {
        summaryText += `- **${m.name}**: ${m.dosage || ''} ${m.frequency || ''} (${m.duration || ''})\n`;
      });
      summaryText += '\n';
    }
    if (res.labResults && res.labResults.length > 0) {
      summaryText += `**Extracted Lab Metrics (${res.labResults.length}):**\n`;
      res.labResults.forEach((l: any) => {
        summaryText += `- **${l.testName}**: ${l.resultValue || ''} [Status: ${l.status || 'NORMAL'}]\n`;
      });
    }
    this.addBotMessage(summaryText);
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

  formatAiMessage(text: string): string {
    if (!text) return '';
    // Escape first: only the tags added below may appear in the message
    let formatted = escapeHtml(text);

    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--text)]">$1</strong>');
    formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="text-xs font-bold text-[var(--primary)] mt-2 mb-1 flex items-center gap-1.5"><i class="fas fa-notes-medical"></i> $1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="text-sm font-bold text-indigo-600 dark:text-indigo-300 mt-3 mb-1 border-b border-[var(--border)] pb-1 flex items-center gap-1.5"><i class="fas fa-file-medical-alt"></i> $1</h2>');
    formatted = formatted.replace(/^[ \t]*[\*\-] (.*$)/gim, '<li class="ml-2 mb-1 flex items-start gap-1.5"><span class="text-[var(--primary)] font-bold mt-0.5">•</span><span>$1</span></li>');
    formatted = formatted.replace(/(<li[\s\S]*?<\/li>)+/g, '<ul class="my-2 space-y-1 bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--border)]">$&</ul>');
    formatted = formatted.replace(/\n{2,}/g, '<div class="my-1.5"></div>');

    return formatted;
  }

  onDictationComplete(res: ClinicalDictationResponse) {
    if (!res || !res.success) return;
    const soapMsg: ChatMessage = {
      text: `### 🎙️ AI Voice Dictation S.O.A.P Note\n\n**Diagnosis:** ${res.diagnosis || 'Not provided'}\n**Chief Complaint:** ${res.chiefComplaint || 'Not provided'}\n\n**[S] Subjective:** ${res.soapNote?.subjective || 'Not provided'}\n**[O] Objective:** ${res.soapNote?.objective || 'Not provided'}\n**[A] Assessment:** ${res.soapNote?.assessment || 'Not provided'}\n**[P] Plan:** ${res.soapNote?.plan || 'Not provided'}\n\n**Prescriptions:** ${res.prescriptions?.length ? res.prescriptions.map(p => `${p.name}${p.dosage ? ' (' + p.dosage + ')' : ''}`).join(', ') : 'None'}`,
      isAi: true,
      timestamp: new Date()
    };
    this.messages.update(m => [...m, soapMsg]);
    this.toast.showSuccess('Structured SOAP dictation added to consultation');
  }

  private scrollToBottom(): void {
    if (this.messageContainer) {
      try {
        const el = this.messageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch (err) { }
    }
    if (this.expandedMessageContainer) {
      try {
        const el = this.expandedMessageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch (err) { }
    }
  }
}
