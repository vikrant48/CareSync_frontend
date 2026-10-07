import { Component, Input, Output, EventEmitter, ElementRef, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompletionPreview } from '../../core/models/appointment.models';

@Component({
  selector: 'app-visit-completion-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-md animate-fade-in">
      <div class="bg-gray-900 border border-gray-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 overflow-hidden max-h-[90vh] flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-800 pb-4 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <i class="fa-solid fa-clipboard-check text-lg"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-100 flex items-center gap-2">
                <span *ngIf="!isCompleted">Stage 7: Visit Completion & Clinical Document Preview</span>
                <span *ngIf="isCompleted">Visit Clinical Record & Prescription Preview</span>
              </h2>
              <p class="text-xs text-gray-400" *ngIf="!isCompleted">Appointment #{{ appointmentId }} &bull; Review all clinical entries prior to binding e-signature</p>
              <p class="text-xs text-gray-400" *ngIf="isCompleted">Appointment #{{ appointmentId }} &bull; Signed & Finalized Clinical Record</p>
            </div>
          </div>
          <button (click)="closeModal()" class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-xl transition-colors">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Readiness Banner -->
        <div *ngIf="previewData" class="shrink-0 p-3.5 rounded-xl border flex items-center justify-between"
             [ngClass]="(isCompleted || isReady) ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/30 border-amber-500/30 text-amber-300'">
          <div class="flex items-center gap-3 text-xs">
            <i [class]="(isCompleted || isReady) ? 'fa-solid fa-circle-check text-emerald-400 text-base' : 'fa-solid fa-triangle-exclamation text-amber-400 text-base'"></i>
            <div>
              <div class="font-bold text-sm">
                {{ isCompleted ? 'Consultation completed and electronically signed.' : (isReady ? 'All mandatory clinical records are saved and verified.' : 'Record validation check incomplete.') }}
              </div>
              <div class="text-[11px] opacity-80">
                {{ isCompleted ? 'Viewing verified medical record and AI SOAP summary.' : (isReady ? 'Review the summary below and proceed to legal e-signature.' : (previewData.readinessReasons.join(', ') || 'Validation pending')) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Scrollable Content Body -->
        <div *ngIf="previewData" class="overflow-y-auto pr-1 flex-1 space-y-6">

          <!-- Patient Header Badge -->
          <div class="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div class="text-xs text-gray-400 font-medium">Patient Name</div>
              <div class="text-base font-bold text-white">{{ previewData.patientName }}</div>
            </div>
            <div class="flex items-center gap-6 text-xs text-gray-400">
              <div *ngIf="previewData.patientAge">Age: <span class="text-gray-200 font-semibold">{{ previewData.patientAge }} yrs</span></div>
              <div *ngIf="previewData.patientGender">Gender: <span class="text-gray-200 font-semibold">{{ previewData.patientGender }}</span></div>
            </div>
          </div>

          <!-- 1. Patient Intake Summary -->
          <div class="bg-gray-950/50 border border-gray-800 rounded-xl p-4 space-y-3">
            <div class="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-user-pen"></i> Stage 3: Patient Intake & AI Triage Summary
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                <div class="text-gray-400 font-semibold mb-1">Chief Complaint:</div>
                <div class="text-gray-200">{{ previewData.intake?.chiefComplaint || 'Not specified' }}</div>
              </div>
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                <div class="text-gray-400 font-semibold mb-1">Symptoms & Duration:</div>
                <div class="text-gray-200">{{ previewData.intake?.symptoms || 'N/A' }} ({{ previewData.intake?.duration || 'N/A' }})</div>
              </div>
            </div>
            <div *ngIf="previewData.intake?.aiTriageSummary" class="bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-3 text-xs text-cyan-200">
              <span class="font-bold text-cyan-400">AI Intake Triage Summary:</span> {{ previewData.intake.aiTriageSummary }}
            </div>
          </div>

          <!-- 2. AI SOAP Note -->
          <div class="bg-gray-950/50 border border-gray-800 rounded-xl p-4 space-y-3">
            <div class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-notes-medical"></i> Stage 6: AI SOAP Clinical Notes
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800 space-y-1">
                <div class="text-blue-400 font-bold">Subjective:</div>
                <p class="text-gray-300 whitespace-pre-wrap">{{ previewData.soapReport?.subjective || 'None' }}</p>
              </div>
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800 space-y-1">
                <div class="text-emerald-400 font-bold">Objective:</div>
                <p class="text-gray-300 whitespace-pre-wrap">{{ previewData.soapReport?.objective || 'None' }}</p>
              </div>
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800 space-y-1">
                <div class="text-amber-400 font-bold">Assessment:</div>
                <p class="text-gray-300 whitespace-pre-wrap">{{ previewData.soapReport?.assessment || 'None' }}</p>
              </div>
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800 space-y-1">
                <div class="text-purple-400 font-bold">Plan:</div>
                <p class="text-gray-300 whitespace-pre-wrap">{{ previewData.soapReport?.plan || 'None' }}</p>
              </div>
            </div>
          </div>

          <!-- 3. Final Medical Record -->
          <div class="bg-gray-950/50 border border-gray-800 rounded-xl p-4 space-y-3">
            <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-file-prescription"></i> Medical Record & Prescriptions
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                <div class="text-gray-400 font-semibold mb-1">Primary Diagnosis:</div>
                <div class="text-emerald-300 font-bold">{{ previewData.medicalHistory?.diagnosis || 'Not entered' }}</div>
              </div>
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                <div class="text-gray-400 font-semibold mb-1">Treatment Plan:</div>
                <div class="text-gray-200">{{ previewData.medicalHistory?.treatment || 'N/A' }}</div>
              </div>
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                <div class="text-gray-400 font-semibold mb-1">Prescribed Medicines:</div>
                <div class="text-gray-200">{{ previewData.medicalHistory?.medicine || 'None' }}</div>
              </div>
              <div class="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                <div class="text-gray-400 font-semibold mb-1">Dosage & Frequency:</div>
                <div class="text-gray-200">{{ previewData.medicalHistory?.doses || 'N/A' }}</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-between border-t border-gray-800 pt-4 shrink-0">
          <button *ngIf="!isCompleted" (click)="onBackToEdit()"
                  class="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all flex items-center gap-2">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Back to Edit (Medical Record)</span>
          </button>
          <div *ngIf="isCompleted"></div>

          <div class="flex items-center gap-3">
            <button (click)="closeModal()" class="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 text-xs font-semibold transition-all">
              Close
            </button>
            <button *ngIf="!isCompleted" (click)="onProceedToSign()" [disabled]="!isReady"
                    class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-gray-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              <i class="fa-solid fa-file-signature"></i>
              <span>Proceed to Electronic Signature & Complete</span>
            </button>
            <button *ngIf="isCompleted" (click)="onDownloadPdf()"
                    class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2">
              <i class="fa-solid fa-file-pdf"></i>
              <span>Download Rx PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class VisitCompletionPreviewModalComponent implements OnChanges, OnDestroy {
  private elementRef = inject(ElementRef);

  @Input() isOpen: boolean = false;
  @Input() appointmentId: number = 0;
  @Input() previewData: CompletionPreview | null = null;
  @Input() isCompleted: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() proceedToSign = new EventEmitter<void>();
  @Output() backToEdit = new EventEmitter<void>();
  @Output() downloadPdf = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        document.body.appendChild(this.elementRef.nativeElement);
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    if (this.elementRef.nativeElement.parentNode) {
      this.elementRef.nativeElement.parentNode.removeChild(this.elementRef.nativeElement);
    }
  }

  get isReady(): boolean {
    return !!(this.previewData?.isReadyForSign || this.previewData?.readyForSign);
  }

  closeModal(): void {
    this.close.emit();
  }

  onProceedToSign(): void {
    this.proceedToSign.emit();
  }

  onBackToEdit(): void {
    this.backToEdit.emit();
  }

  onDownloadPdf(): void {
    this.downloadPdf.emit();
  }
}
