import { Component, EventEmitter, Output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService } from '../../core/services/ai-assistant.service';
import { AiEmergencyInfo, DoctorSuggestion } from '../../core/models/ai.models';

/**
 * Find & Book "Describe your problem": the patient assistant suggests the fitting specialization and doctors. The
 * page then filters its doctor list by that specialization (or a doctor's name). Urgent symptoms show emergency
 * help instead.
 */
@Component({
  selector: 'app-symptom-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Block element, so the page's spacing between sections applies to it
  host: { class: 'block' },
  template: `
    <section class="surface p-3 sm:p-4 shadow-sm" aria-label="Describe your problem">
      <form (submit)="search(); $event.preventDefault()" class="flex flex-col sm:flex-row gap-2">
        <label for="symptomSearchInput" class="sr-only">Describe your problem</label>
        <div class="relative flex-1 min-w-0">
          <input #symptomInput id="symptomSearchInput" type="text" [(ngModel)]="description" name="description" maxlength="500"
                 [disabled]="loading()"
                 placeholder="Describe your problem, e.g. itchy rash on my arm for a week"
                 class="w-full h-[38px] bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-3 pr-9 text-sm text-[var(--text)] placeholder-[var(--muted)] placeholder:text-[13px] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-60" />
          <button *ngIf="(description || hasResult()) && !loading()" type="button" (click)="clear(symptomInput)"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors"
                  title="Clear" aria-label="Clear and start a new search">
            <i class="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
          </button>
        </div>
        <button type="submit" [disabled]="loading() || !description.trim()"
                class="h-[38px] px-4 rounded-xl bg-[var(--primary)] hover:bg-indigo-600 disabled:bg-[var(--border)] text-white disabled:text-[var(--muted)] text-xs font-bold inline-flex items-center justify-center gap-2 transition-all">
          <i class="fa-solid" [ngClass]="loading() ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'" aria-hidden="true"></i>
          {{ loading() ? 'Finding...' : 'Find doctors with AI' }}
        </button>
      </form>

      <!-- Emergency help comes first -->
      <div *ngIf="emergency() as em" class="mt-3 rounded-xl border p-3"
           [ngClass]="em.level === 'EMERGENCY' ? 'border-red-500/40 bg-red-500/10' : 'border-amber-500/40 bg-amber-500/10'"
           role="alert">
        <div class="text-xs font-black" [ngClass]="em.level === 'EMERGENCY' ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-200'">{{ em.title }}</div>
        <p class="text-[11px] text-[var(--text)] mt-1">{{ em.message }}</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <a *ngFor="let c of em.contacts" [href]="'tel:' + c.number"
             class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[var(--text)]">
            <i class="fa-solid fa-phone text-[10px]" aria-hidden="true"></i> {{ c.label }}: {{ c.number }}
          </a>
          <button *ngIf="em.emergencyBooking" type="button" (click)="emergencyBooking.emit()"
                  class="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
            Emergency booking
          </button>
        </div>
      </div>

      <div *ngIf="reply()" class="mt-3 space-y-2">
        <p class="text-xs text-[var(--text)] whitespace-pre-line">{{ reply() }}</p>
        <div *ngIf="specialization()" class="flex flex-wrap items-center gap-2">
          <span class="text-[11px] text-[var(--muted)]">Showing</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30">{{ specialization() }}</span>
          <span class="text-[11px] text-[var(--muted)]">doctors below.</span>
        </div>
        <div *ngIf="doctors().length" class="flex flex-wrap gap-2">
          <button *ngFor="let d of doctors()" type="button" (click)="showDoctor.emit(d.name)"
                  class="text-left rounded-xl border border-[var(--border)] hover:border-[var(--primary)] bg-[var(--bg)] px-3 py-1.5 transition-colors"
                  [attr.aria-label]="'Show ' + d.name + ' in the list'">
            <span class="block text-[11px] font-bold text-[var(--text)]">Dr. {{ d.name }}</span>
            <span *ngIf="d.recommendedSlot" class="block text-[10px] text-[var(--muted)]">First open: {{ d.recommendedDate | date:'d MMM' }}, {{ d.recommendedSlot }}</span>
          </button>
        </div>
        <p class="text-[10px] text-[var(--muted)] italic">AI suggestion, not a diagnosis.</p>
      </div>
    </section>
  `
})
export class SymptomSearchComponent {
  /** The suggested specialization: the page filters its list by it */
  @Output() specializationFound = new EventEmitter<string>();
  /** A suggested doctor was clicked: the page shows them in its list */
  @Output() showDoctor = new EventEmitter<string>();
  @Output() emergencyBooking = new EventEmitter<void>();
  /** The search was cleared: the page removes the filters the AI applied */
  @Output() cleared = new EventEmitter<void>();

  private ai = inject(AiAssistantService);

  description = '';
  loading = signal(false);
  reply = signal<string | null>(null);
  specialization = signal<string | null>(null);
  doctors = signal<DoctorSuggestion[]>([]);
  emergency = signal<AiEmergencyInfo | null>(null);

  hasResult() {
    return !!this.reply() || !!this.emergency();
  }

  /** X button: empty the box and the result, ready for a new search */
  clear(input?: HTMLInputElement) {
    const hadFilter = !!this.specialization() || this.doctors().length > 0;
    this.description = '';
    this.reply.set(null);
    this.emergency.set(null);
    this.doctors.set([]);
    this.specialization.set(null);
    if (hadFilter) this.cleared.emit();
    input?.focus();
  }

  search() {
    const text = this.description.trim();
    if (!text || this.loading()) return;
    this.loading.set(true);
    this.ai.symptomSearch(text).subscribe({
      next: res => {
        this.loading.set(false);
        this.reply.set(res.response || res.error || 'Sorry, no suggestion right now. Please use the filters below.');
        this.emergency.set(res.emergency ?? null);
        const doctors = res.suggestion?.type === 'DOCTORS' ? res.suggestion.doctors ?? [] : [];
        this.doctors.set(doctors);
        const spec = doctors[0]?.specialization
          ?? (res.suggestion?.type === 'SPECIALIZATIONS' && res.suggestion.specializations?.length === 1
            ? res.suggestion.specializations[0] : null);
        this.specialization.set(spec ?? null);
        if (spec) this.specializationFound.emit(spec);
      },
      error: () => {
        this.loading.set(false);
        this.reply.set('The AI search is unavailable right now. Please use the filters below.');
      }
    });
  }
}
