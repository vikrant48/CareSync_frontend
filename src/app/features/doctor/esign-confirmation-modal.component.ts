import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../core/services/appointment.service';
import { ToastService } from '../../core/services/toast.service';
import { ESignCompletionResponse } from '../../core/models/appointment.models';

@Component({
    selector: 'app-esign-confirmation-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-md animate-fade-in">
      <div class="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-gray-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <i class="fa-solid fa-file-signature text-lg"></i>
            </div>
            <div>
              <h2 class="text-base font-bold text-gray-100">Doctor Electronic Signature</h2>
              <p class="text-xs text-gray-400">Legal Non-Repudiation Authorization</p>
            </div>
          </div>
          <button (click)="closeModal()" class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-xl transition-colors">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Security Info Badge -->
        <div class="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-purple-200">
          <i class="fa-solid fa-shield-halved text-purple-400 text-base mt-0.5 shrink-0"></i>
          <div>
            <div class="font-bold text-purple-300">Cryptographic Signing Audit</div>
            <div class="text-[11px] opacity-80 mt-0.5">
              Signing this visit will compute a SHA-256 hash digest of all clinical records, lock the file from modifications, and notify the patient.
            </div>
          </div>
        </div>

        <!-- Form Inputs -->
        <div class="space-y-4 text-xs">

          <!-- Doctor Name Input -->
          <div class="space-y-1.5">
            <label class="font-bold text-gray-300 block">Typed Full Signature Name *</label>
            <input type="text" [(ngModel)]="doctorNameTyped"
                   placeholder="e.g. Dr. Jane Doe"
                   class="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-purple-500 transition-all font-semibold" />
          </div>

          <!-- Password Re-entry -->
          <div class="space-y-1.5">
            <label class="font-bold text-gray-300 block">Re-enter Doctor Account Password *</label>
            <input type="password" [(ngModel)]="password"
                   placeholder="Enter your account password for signature authentication"
                   class="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-purple-500 transition-all" />
          </div>

          <!-- Legal Declaration Checkbox -->
          <div class="bg-gray-950/60 border border-gray-800 rounded-xl p-3.5 space-y-2">
            <label class="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" [(ngModel)]="declarationAccepted"
                     class="mt-1 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0" />
              <span class="text-[11px] text-gray-300 leading-relaxed">
                I certify that I am the attending physician for this appointment, and that all medical entries, diagnosis, and treatment plans in this record are accurate and true to the best of my knowledge.
              </span>
            </label>
          </div>

        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
          <button (click)="closeModal()" class="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all">
            Cancel
          </button>
          <button (click)="submitESign()" [disabled]="submitting || !declarationAccepted || !password || !doctorNameTyped"
                  class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
            <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin"></i>
            <i *ngIf="!submitting" class="fa-solid fa-signature"></i>
            <span>Confirm & Electronically Sign</span>
          </button>
        </div>

      </div>
    </div>
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
