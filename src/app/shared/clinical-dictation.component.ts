import { Component, EventEmitter, Input, Output, inject, signal, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService } from '../core/services/ai-assistant.service';
import { ClinicalDictationResponse } from '../core/models/ai.models';

@Component({
    selector: 'app-clinical-dictation',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto">
      <div class="relative w-full max-w-4xl my-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh] transition-all">
        
        <!-- Header -->
        <div class="px-6 py-4.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-between text-white shrink-0 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
              🎙️
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold leading-tight tracking-wide">{{ modalTitle }}</h3>
              <p class="text-xs text-teal-100/90 font-medium">Real-time Speech-to-Text & AI S.O.A.P Structuring</p>
            </div>
          </div>
          <button type="button" (click)="closeModal.emit()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>

        <!-- Main Body -->
        <div class="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          <!-- Speech Dictation Controller Bar -->
          <div class="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 space-y-4 shadow-inner">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <!-- Record / Stop Button -->
                <button type="button" 
                        (click)="toggleRecording()"
                        [ngClass]="{
                          'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 animate-pulse': isRecording(),
                          'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30': !isRecording()
                        }"
                        class="px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all transform active:scale-95 shadow-lg">
                  <i class="fas" [ngClass]="{ 'fa-stop-circle text-base': isRecording(), 'fa-microphone text-base': !isRecording() }"></i>
                  {{ isRecording() ? 'Stop Recording' : 'Start Live Dictation' }}
                </button>

                <span *ngIf="isRecording()" class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-mono font-bold border border-rose-500/30">
                  <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Live Recording...
                </span>

                <span *ngIf="!isRecording() && transcriptText().trim()" class="text-xs text-slate-400">
                  <i class="fas fa-check-circle text-emerald-400 mr-1"></i> Ready to structure
                </span>
              </div>

              <!-- Clear Transcript Button -->
              <button *ngIf="transcriptText().trim()" type="button" (click)="clearTranscript()" class="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
                <i class="fas fa-trash-alt mr-1"></i> Clear Dictation
              </button>
            </div>

            <!-- Dictation Live Text Area -->
            <div class="relative">
              <textarea 
                [ngModel]="transcriptText()"
                (ngModelChange)="transcriptText.set($event)"
                placeholder="Click 'Start Live Dictation' and speak into your microphone (e.g. 'Patient 45yo male presenting with throbbing headache for 3 days. Prescribe Paracetamol 500mg...'), or type consultation notes here..."
                rows="4"
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all custom-scrollbar">
              </textarea>
            </div>

            <!-- Structure Action Trigger -->
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-slate-400 italic">
                💡 AI automatically parses your spoken words into SOAP clinical notes & prescriptions.
              </span>
              <button 
                type="button"
                (click)="processDictation()"
                [disabled]="!transcriptText().trim() || isProcessing()"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all">
                <i class="fas" [ngClass]="{ 'fa-spinner fa-spin': isProcessing(), 'fa-magic': !isProcessing() }"></i>
                {{ isProcessing() ? 'Structuring Clinical Note...' : '✨ Structure into SOAP Note' }}
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage()" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center gap-3">
            <i class="fas fa-exclamation-triangle text-lg text-rose-500"></i>
            <div>
              <p class="font-bold">Dictation Error</p>
              <p class="text-xs opacity-90">{{ errorMessage() }}</p>
            </div>
          </div>

          <!-- Structured Result Output -->
          <div *ngIf="dictationResult() && dictationResult()!.success" class="space-y-6 animate-in fade-in duration-300">
            
            <!-- Quick Summary Header -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Chief Complaint</span>
                <p class="text-xs font-semibold text-teal-300">{{ dictationResult()!.chiefComplaint || 'Not specified' }}</p>
              </div>

              <div class="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Diagnosis</span>
                <p class="text-xs font-semibold text-emerald-300">{{ dictationResult()!.diagnosis || 'Under evaluation' }}</p>
              </div>

              <div class="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Vitals / Follow-up</span>
                <p class="text-xs font-semibold text-cyan-300">{{ dictationResult()!.vitals || dictationResult()!.followUp || 'Standard follow-up' }}</p>
              </div>
            </div>

            <!-- S.O.A.P Clinical Cards -->
            <div *ngIf="dictationResult()!.soapNote" class="space-y-3">
              <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <i class="fas fa-notes-medical text-teal-400"></i> S.O.A.P Clinical Note Format
              </h5>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Subjective -->
                <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-900/50 text-blue-300 border border-blue-700/50">
                      S - Subjective
                    </span>
                  </div>
                  <p class="text-xs leading-relaxed text-slate-300">{{ dictationResult()!.soapNote!.subjective || 'No subjective history provided.' }}</p>
                </div>

                <!-- Objective -->
                <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                      O - Objective
                    </span>
                  </div>
                  <p class="text-xs leading-relaxed text-slate-300">{{ dictationResult()!.soapNote!.objective || 'Vitals & clinical exam within normal limits.' }}</p>
                </div>

                <!-- Assessment -->
                <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-900/50 text-purple-300 border border-purple-700/50">
                      A - Assessment
                    </span>
                  </div>
                  <p class="text-xs leading-relaxed text-slate-300">{{ dictationResult()!.soapNote!.assessment || 'Clinical assessment pending.' }}</p>
                </div>

                <!-- Plan -->
                <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                      P - Plan
                    </span>
                  </div>
                  <p class="text-xs leading-relaxed text-slate-300">{{ dictationResult()!.soapNote!.plan || 'Follow-up as required.' }}</p>
                </div>
              </div>
            </div>

            <!-- Structured Prescriptions Table -->
            <div *ngIf="dictationResult()!.prescriptions && dictationResult()!.prescriptions!.length > 0" class="space-y-3">
              <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <i class="fas fa-pills text-purple-400"></i> Structured Prescriptions ({{ dictationResult()!.prescriptions!.length }})
              </h5>
              <div class="overflow-x-auto rounded-2xl border border-slate-800 shadow-md">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-800/90 font-semibold text-slate-300">
                    <tr>
                      <th class="p-3">Medication</th>
                      <th class="p-3">Dosage</th>
                      <th class="p-3">Frequency</th>
                      <th class="p-3">Duration</th>
                      <th class="p-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 bg-slate-900/60">
                    <tr *ngFor="let med of dictationResult()!.prescriptions" class="hover:bg-slate-800/50">
                      <td class="p-3 font-bold text-purple-400">{{ med.name }}</td>
                      <td class="p-3 font-mono text-slate-300">{{ med.dosage || '-' }}</td>
                      <td class="p-3 text-slate-300">{{ med.frequency || '-' }}</td>
                      <td class="p-3 text-slate-300">{{ med.duration || '-' }}</td>
                      <td class="p-3 text-slate-400 italic">{{ med.instructions || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Lab Orders -->
            <div *ngIf="dictationResult()!.labOrders && dictationResult()!.labOrders!.length > 0" class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <i class="fas fa-vials text-amber-400"></i> Recommended Lab Orders:
              </div>
              <ul class="list-disc list-inside text-xs space-y-1 opacity-90">
                <li *ngFor="let lab of dictationResult()!.labOrders">{{ lab }}</li>
              </ul>
            </div>

          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button *ngIf="copiedText()" type="button" class="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
            <i class="fas fa-check"></i> Copied to Clipboard!
          </button>
          
          <button *ngIf="dictationResult() && !copiedText()" type="button" (click)="copyToClipboard()" class="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <i class="far fa-copy"></i> Copy SOAP Note
          </button>

          <div class="flex items-center gap-3 ml-auto">
            <button type="button" (click)="closeModal.emit()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              Close
            </button>
            <button *ngIf="dictationResult() && dictationResult()!.success" type="button" (click)="onConfirm()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all">
              <i class="fas fa-check mr-1.5"></i> Insert into Consultation
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ClinicalDictationComponent implements OnInit, OnDestroy {
    @Input() modalTitle: string = 'AI Doctor Voice Dictation & SOAP Structuring';
    @Output() closeModal = new EventEmitter<void>();
    @Output() dictationComplete = new EventEmitter<ClinicalDictationResponse>();

    private aiService = inject(AiAssistantService);
    private cdr = inject(ChangeDetectorRef);

    isRecording = signal(false);
    isProcessing = signal(false);
    transcriptText = signal('');
    errorMessage = signal<string | null>(null);
    dictationResult = signal<ClinicalDictationResponse | null>(null);
    copiedText = signal(false);

    private recognition: any = null;

    ngOnInit() {
        this.initSpeechRecognition();
    }

    ngOnDestroy() {
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) { }
        }
    }

    private initSpeechRecognition() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                if (currentTranscript) {
                    const prev = this.transcriptText();
                    this.transcriptText.set(prev ? prev + ' ' + currentTranscript : currentTranscript);
                    this.cdr.detectChanges();
                }
            };

            this.recognition.onerror = (err: any) => {
                console.warn('Speech recognition error:', err);
                this.isRecording.set(false);
                this.cdr.detectChanges();
            };

            this.recognition.onend = () => {
                this.isRecording.set(false);
                this.cdr.detectChanges();
            };
        }
    }

    toggleRecording() {
        if (!this.recognition) {
            this.errorMessage.set('Web Speech API is not supported in this browser. You can type or paste your consultation notes directly.');
            return;
        }

        if (this.isRecording()) {
            this.recognition.stop();
            this.isRecording.set(false);
        } else {
            this.errorMessage.set(null);
            try {
                this.recognition.start();
                this.isRecording.set(true);
            } catch (e) {
                console.error('Failed to start speech recognition:', e);
            }
        }
        this.cdr.detectChanges();
    }

    clearTranscript() {
        this.transcriptText.set('');
        this.dictationResult.set(null);
        this.errorMessage.set(null);
        this.cdr.detectChanges();
    }

    processDictation() {
        const text = this.transcriptText().trim();
        if (!text) return;

        this.isProcessing.set(true);
        this.errorMessage.set(null);
        this.dictationResult.set(null);
        this.cdr.detectChanges();

        this.aiService.dictateClinicalNote(text).subscribe({
            next: (res) => {
                this.isProcessing.set(false);
                if (res && res.success) {
                    this.dictationResult.set(res);
                } else {
                    this.errorMessage.set(res?.error || 'Failed to structure dictation notes.');
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isProcessing.set(false);
                this.errorMessage.set(err?.error?.message || err?.message || 'Server error while processing dictation.');
                this.cdr.detectChanges();
            }
        });
    }

    copyToClipboard() {
        const result = this.dictationResult();
        if (!result || !result.soapNote) return;

        const soapText = `CLINICAL CONSULTATION NOTE
Patient: ${result.patientName || 'N/A'}
Chief Complaint: ${result.chiefComplaint || 'N/A'}
Diagnosis: ${result.diagnosis || 'N/A'}

[S] SUBJECTIVE:
${result.soapNote.subjective || '-'}

[O] OBJECTIVE:
${result.soapNote.objective || '-'}

[A] ASSESSMENT:
${result.soapNote.assessment || '-'}

[P] PLAN:
${result.soapNote.plan || '-'}

Prescriptions: ${result.prescriptions?.map(p => `${p.name} ${p.dosage}`).join(', ') || 'None'}`;

        navigator.clipboard.writeText(soapText).then(() => {
            this.copiedText.set(true);
            setTimeout(() => this.copiedText.set(false), 3000);
            this.cdr.detectChanges();
        });
    }

    onConfirm() {
        const result = this.dictationResult();
        if (result) {
            this.dictationComplete.emit(result);
        }
        this.closeModal.emit();
    }
}
