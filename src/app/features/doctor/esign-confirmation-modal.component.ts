import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { ToastService } from '../../core/services/toast.service';
import { ESignCompletionResponse } from '../../core/models/appointment.models';

@Component({
    selector: 'app-esign-confirmation-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalShellComponent],
    template: `
    <app-modal-shell [open]="isOpen" title="Doctor Electronic Signature" subtitle="Legal Non-Repudiation Authorization"
      titleId="esign-modal-title" icon="fa-solid fa-file-signature"
      iconWrapClass="bg-purple-500/15 text-purple-700 dark:text-purple-300" maxWidthClass="max-w-lg"
      bodyClass="p-4 sm:p-6 space-y-4" footerClass="p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2"
      [hasFooter]="true" (close)="closeModal()">

      <div class="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-purple-900 dark:text-purple-100">
        <i class="fa-solid fa-shield-halved text-purple-600 dark:text-purple-300 text-base mt-0.5 shrink-0"></i>
        <div>
          <div class="font-bold">Cryptographic Signing Audit</div>
          <div class="text-[11px] mt-0.5">
            Signing this visit will compute a SHA-256 hash digest of all clinical records, lock the file from modifications, and notify the patient.
          </div>
        </div>
      </div>

      <div class="space-y-4 text-xs">
        <div class="space-y-1.5">
          <label class="form-label" for="esign-name">Typed Full Signature Name *</label>
          <input id="esign-name" type="text" [(ngModel)]="doctorNameTyped" placeholder="e.g. Dr. Jane Doe" class="form-input font-semibold" />
        </div>
        <div class="space-y-1.5">
          <label class="form-label" for="esign-password">Re-enter Doctor Account Password *</label>
          <input id="esign-password" type="password" [(ngModel)]="password"
            placeholder="Enter your account password for signature authentication" class="form-input" />
        </div>
        <div class="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5">
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" [(ngModel)]="declarationAccepted" class="mt-1 h-4 w-4 shrink-0" />
            <span class="text-[11px] text-[var(--text)] leading-relaxed">
              I certify that I am the attending physician for this appointment, and that all medical entries, diagnosis, and treatment plans in this record are accurate and true to the best of my knowledge.
            </span>
          </label>
        </div>
      </div>

      <button modalFooter type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
      <button modalFooter type="button" (click)="submitESign()" [disabled]="submitting || !declarationAccepted || !password || !doctorNameTyped" class="btn-primary">
        <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin"></i>
        <i *ngIf="!submitting" class="fa-solid fa-signature"></i>
        <span>Confirm & Electronically Sign</span>
      </button>
    </app-modal-shell>
  `
})
export class EsignConfirmationModalComponent {
    private appointmentService = inject(AppointmentService);
    private toast = inject(ToastService);

    @Input() isOpen: boolean = false;
    @Input() appointmentId: number = 0;
    @Input() doctorName: string = '';

    @Output() close = new EventEmitter<void>();
    @Output() signedSuccess = new EventEmitter<ESignCompletionResponse>();

    doctorNameTyped: string = '';
    password: string = '';
    declarationAccepted: boolean = false;
    signatureImageUrl: string = '';
    submitting: boolean = false;

    ngOnChanges(changes: any): void {
        if (changes['isOpen'] && this.isOpen) {
            if (this.doctorName && !this.doctorNameTyped) {
                this.doctorNameTyped = this.doctorName.startsWith('Dr.') ? this.doctorName : `Dr. ${this.doctorName}`;
            }
            this.password = '';
            this.declarationAccepted = false;
            this.submitting = false;
        }
    }

    closeModal(): void {
        this.close.emit();
    }

    submitESign(): void {
        if (!this.doctorNameTyped || !this.password) {
            this.toast.show('Please enter your full name and password to e-sign.', 'warning');
            return;
        }
        if (!this.declarationAccepted) {
            this.toast.show('You must accept the legal declaration to complete signature.', 'warning');
            return;
        }

        this.submitting = true;
        this.appointmentService.eSignAndComplete(this.appointmentId, {
            appointmentId: this.appointmentId,
            doctorNameTyped: this.doctorNameTyped,
            password: this.password,
            declarationAccepted: this.declarationAccepted,
            signatureImageUrl: this.signatureImageUrl
        }).subscribe({
            next: (res: ESignCompletionResponse) => {
                this.submitting = false;
                this.toast.showSuccess('Appointment successfully signed and completed!');
                this.signedSuccess.emit(res);
                this.closeModal();
            },
            error: (err: any) => {
                this.submitting = false;
                const errMsg = err?.error?.error || 'Failed to complete electronic signature. Check password.';
                this.toast.showError(errMsg);
            }
        });
    }
}
