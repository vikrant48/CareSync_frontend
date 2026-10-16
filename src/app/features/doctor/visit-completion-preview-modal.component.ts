import { Component, Input, Output, EventEmitter, ElementRef, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { CompletionPreview } from '../../core/models/appointment.models';

@Component({
  selector: 'app-visit-completion-preview-modal',
  standalone: true,
  imports: [CommonModule, ModalShellComponent],
  template: `
    <app-modal-shell [open]="isOpen" [title]="dialogTitle" [subtitle]="dialogSubtitle" titleId="visit-preview-title"
      icon="fa-solid fa-clipboard-check" iconWrapClass="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      maxWidthClass="max-w-4xl" zIndexClass="z-[9999]" bodyClass="p-4 sm:p-6 space-y-4"
      footerClass="p-4" [hasFooter]="true" (close)="closeModal()">

      <div *ngIf="previewData" class="p-3.5 rounded-xl border"
           [ngClass]="(isCompleted || isReady) ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-100' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-100'">
        <div class="flex items-start gap-3 text-xs">
          <i [class]="(isCompleted || isReady) ? 'fa-solid fa-circle-check text-base mt-0.5' : 'fa-solid fa-triangle-exclamation text-base mt-0.5'" aria-hidden="true"></i>
          <div>
            <div class="font-bold text-sm">
              {{ isCompleted ? 'Consultation completed and electronically signed.' : (isReady ? 'All mandatory clinical records are saved and verified.' : 'Record validation check incomplete.') }}
            </div>
            <div class="text-[11px] mt-0.5">
              {{ isCompleted ? 'Viewing verified medical record and AI SOAP summary.' : (isReady ? 'Review the summary below and proceed to legal e-signature.' : (previewData.readinessReasons.join(', ') || 'Validation pending')) }}
            </div>
          </div>
        </div>
      </div>

      <ng-container *ngIf="previewData">
        <div class="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div class="text-xs text-muted font-medium">Patient Name</div>
            <div class="text-base font-bold text-[var(--text)]">{{ previewData.patientName }}</div>
          </div>
          <div class="flex items-center gap-6 text-xs text-muted">
            <div *ngIf="previewData.patientAge">Age: <span class="text-[var(--text)] font-semibold">{{ previewData.patientAge }} yrs</span></div>
            <div *ngIf="previewData.patientGender">Gender: <span class="text-[var(--text)] font-semibold">{{ previewData.patientGender }}</span></div>
          </div>
        </div>

        <div class="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <div class="text-xs font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-user-pen" aria-hidden="true"></i> Stage 3: Patient Intake & AI Triage Summary
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)]">
              <div class="text-muted font-semibold mb-1">Chief Complaint:</div>
              <div class="text-[var(--text)]">{{ previewData.intake?.chiefComplaint || 'Not specified' }}</div>
            </div>
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)]">
              <div class="text-muted font-semibold mb-1">Symptoms & Duration:</div>
              <div class="text-[var(--text)]">{{ previewData.intake?.symptoms || 'N/A' }} ({{ previewData.intake?.duration || 'N/A' }})</div>
            </div>
          </div>
          <div *ngIf="previewData.intake?.aiTriageSummary" class="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/30 rounded-lg p-3 text-xs text-cyan-900 dark:text-cyan-100">
            <span class="font-bold">AI Intake Triage Summary:</span> {{ previewData.intake.aiTriageSummary }}
          </div>
        </div>

        <div class="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <div class="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-notes-medical" aria-hidden="true"></i> Stage 6: AI SOAP Clinical Notes
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)] space-y-1">
              <div class="text-blue-700 dark:text-blue-300 font-bold">Subjective:</div>
              <p class="text-[var(--text)] whitespace-pre-wrap">{{ previewData.soapReport?.subjective || 'None' }}</p>
            </div>
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)] space-y-1">
              <div class="text-emerald-700 dark:text-emerald-300 font-bold">Objective:</div>
              <p class="text-[var(--text)] whitespace-pre-wrap">{{ previewData.soapReport?.objective || 'None' }}</p>
            </div>
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)] space-y-1">
              <div class="text-amber-700 dark:text-amber-300 font-bold">Assessment:</div>
              <p class="text-[var(--text)] whitespace-pre-wrap">{{ previewData.soapReport?.assessment || 'None' }}</p>
            </div>
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)] space-y-1">
              <div class="text-purple-700 dark:text-purple-300 font-bold">Plan:</div>
              <p class="text-[var(--text)] whitespace-pre-wrap">{{ previewData.soapReport?.plan || 'None' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <div class="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-file-prescription" aria-hidden="true"></i> Medical Record & Prescriptions
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)]">
              <div class="text-muted font-semibold mb-1">Primary Diagnosis:</div>
              <div class="text-emerald-700 dark:text-emerald-300 font-bold">{{ previewData.medicalHistory?.diagnosis || 'Not entered' }}</div>
            </div>
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)]">
              <div class="text-muted font-semibold mb-1">Treatment Plan:</div>
              <div class="text-[var(--text)]">{{ previewData.medicalHistory?.treatment || 'N/A' }}</div>
            </div>
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)]">
              <div class="text-muted font-semibold mb-1">Prescribed Medicines:</div>
              <div class="text-[var(--text)]">{{ previewData.medicalHistory?.medicine || 'None' }}</div>
            </div>
            <div class="bg-[var(--panel)] p-3 rounded-lg border border-[var(--border)]">
              <div class="text-muted font-semibold mb-1">Dosage & Frequency:</div>
              <div class="text-[var(--text)]">{{ previewData.medicalHistory?.doses || 'N/A' }}</div>
            </div>
          </div>
        </div>
      </ng-container>

      <div modalFooter class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
        <button *ngIf="!isCompleted" type="button" (click)="onBackToEdit()" class="btn-secondary">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          <span>Back to Edit</span>
        </button>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:ml-auto">
          <button type="button" (click)="closeModal()" class="btn-secondary">Close</button>
          <button *ngIf="!isCompleted" type="button" (click)="onProceedToSign()" [disabled]="!isReady" class="btn-primary">
            <i class="fa-solid fa-file-signature" aria-hidden="true"></i>
            <span>Proceed to Electronic Signature</span>
          </button>
          <button *ngIf="isCompleted" type="button" (click)="onDownloadPdf()" class="btn-primary">
            <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
            <span>Download Rx PDF</span>
          </button>
        </div>
      </div>
    </app-modal-shell>
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

  get dialogTitle(): string {
    return this.isCompleted
      ? 'Visit Clinical Record & Prescription Preview'
      : 'Stage 7: Visit Completion & Clinical Document Preview';
  }

  get dialogSubtitle(): string {
    return this.isCompleted
      ? `Appointment #${this.appointmentId} • Signed & Finalized Clinical Record`
      : `Appointment #${this.appointmentId} • Review all clinical entries prior to binding e-signature`;
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
