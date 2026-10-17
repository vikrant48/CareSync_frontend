import { Component, Input, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiAssistantService } from '../core/services/ai-assistant.service';
import { LabReportExplanation } from '../core/models/ai.models';
import { extractApiError } from './utils/api-error.util';

/**
 * "Explain" button for a lab report. Shows the saved plain-language explanation, or asks the AI for one (saved
 * with the report, so it shows instantly next time). Always shown with its "not a diagnosis" note.
 */
@Component({
  selector: 'app-lab-report-explainer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="open($event)" [disabled]="loading()"
      class="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-transparent border border-indigo-500/30 hover:border-indigo-500/60 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-60"
      [attr.aria-label]="'Explain ' + (filename || 'this lab report') + ' in plain language'">
      <i class="fa-solid" [ngClass]="loading() ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'" aria-hidden="true"></i>
      {{ loading() ? 'Explaining...' : 'Explain' }}
    </button>

    <div *ngIf="isOpen()" class="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
         (click)="close($event)" role="dialog" aria-modal="true" aria-label="Lab report explanation">
      <div class="w-full max-w-lg max-h-[85vh] flex flex-col bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
          <div class="min-w-0">
            <h3 class="text-sm font-black text-[var(--text)] flex items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-indigo-600 dark:text-indigo-400" aria-hidden="true"></i>
              Your report in plain words
            </h3>
            <p *ngIf="filename" class="text-[10px] text-[var(--muted)] truncate">{{ filename }}</p>
          </div>
          <button type="button" (click)="close($event)" aria-label="Close"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div class="px-4 py-3 overflow-y-auto space-y-3">
          <pre class="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--text)]">{{ explanation()?.explanation }}</pre>
          <div class="flex gap-2 items-start rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <i class="fa-solid fa-circle-info text-amber-600 dark:text-amber-400 text-xs mt-0.5" aria-hidden="true"></i>
            <p class="text-[11px] font-semibold text-amber-800 dark:text-amber-200">{{ explanation()?.note }}</p>
          </div>
          <p *ngIf="explanation()?.explainedAt" class="text-[10px] text-[var(--muted)]">
            Explained by CareSync AI on {{ explanation()?.explainedAt | date:'d MMM y' }}
          </p>
        </div>
      </div>
    </div>

    <p *ngIf="error()" class="mt-1 text-[10px] text-red-600 dark:text-red-400" role="alert">{{ error() }}</p>
  `
})
export class LabReportExplainerComponent {
  @Input({ required: true }) documentId!: number;
  @Input() filename?: string;

  private ai = inject(AiAssistantService);

  loading = signal(false);
  isOpen = signal(false);
  error = signal<string | null>(null);
  explanation = signal<LabReportExplanation | null>(null);

  open(event: Event) {
    // The button may sit inside a clickable card (which opens the file)
    event.stopPropagation();
    if (this.explanation()) {
      this.isOpen.set(true);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.ai.getLabReportExplanation(this.documentId).subscribe({
      next: saved => (saved ? this.show(saved) : this.explainNow()),
      error: () => this.explainNow()
    });
  }

  private explainNow() {
    this.ai.explainLabReport(this.documentId).subscribe({
      next: result => this.show(result),
      error: err => {
        this.loading.set(false);
        this.error.set(extractApiError(err, 'The explanation is unavailable right now. Please try again later.'));
      }
    });
  }

  private show(result: LabReportExplanation) {
    this.explanation.set(result);
    this.loading.set(false);
    this.isOpen.set(true);
  }

  close(event: Event) {
    event.stopPropagation();
    this.isOpen.set(false);
  }
}
