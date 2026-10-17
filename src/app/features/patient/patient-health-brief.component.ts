import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AiAssistantService } from '../../core/services/ai-assistant.service';
import { DocumentOpenerService } from '../../core/services/document-opener.service';
import { PatientHealthBrief } from '../../core/models/ai.models';
import { LabReportExplainerComponent } from '../../shared/lab-report-explainer.component';

/**
 * Patient dashboard "AI health brief": the next appointment and how to prepare, pending items, and lab reports
 * not opened yet. Facts come from the records; only the preparation tips are written by the AI.
 */
@Component({
  selector: 'app-patient-health-brief',
  standalone: true,
  imports: [CommonModule, RouterModule, LabReportExplainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section *ngIf="brief() as b" class="surface p-3.5 shadow-sm" aria-label="AI health brief">
      <div class="flex items-center justify-between gap-2 mb-3 border-b border-[var(--border)] pb-1.5">
        <h2 class="font-bold text-xs text-[var(--text)] uppercase tracking-wide flex items-center gap-2">
          <i class="fa-solid fa-wand-magic-sparkles text-indigo-600 dark:text-indigo-400" aria-hidden="true"></i>
          AI health brief
        </h2>
        <span class="text-[10px] text-[var(--muted)]">{{ b.note }}</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <!-- Next appointment and how to prepare -->
        <div class="inset-surface rounded-lg p-3">
          <div class="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Next appointment</div>
          <ng-container *ngIf="b.nextAppointment as next; else nothingBooked">
            <a [routerLink]="['/patient/appointments', next.appointmentId]"
               class="block text-xs font-bold text-[var(--text)] hover:text-[var(--primary)]">
              {{ next.doctorName }}<span *ngIf="next.specialization" class="font-medium text-[var(--muted)]"> · {{ next.specialization }}</span>
            </a>
            <div class="text-[11px] text-[var(--muted)] mb-2">{{ next.dateTime | date:'EEE d MMM, h:mm a' }}</div>
            <div class="text-[10px] font-bold text-[var(--muted)] mb-1 flex items-center gap-1.5">
              How to prepare
              <span *ngIf="b.tipsFromAi" class="px-1.5 py-px rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[9px]">AI</span>
            </div>
            <ul class="space-y-1">
              <li *ngFor="let tip of b.preparationTips" class="text-[11px] text-[var(--text)] flex gap-1.5">
                <i class="fa-solid fa-check text-emerald-600 dark:text-emerald-400 text-[9px] mt-1" aria-hidden="true"></i>
                <span>{{ tip }}</span>
              </li>
            </ul>
          </ng-container>
          <ng-template #nothingBooked>
            <p class="text-[11px] text-[var(--muted)]">No upcoming appointment.</p>
            <a routerLink="/patient/book-appointment" class="text-[11px] font-semibold text-[var(--primary)]">Find a doctor</a>
          </ng-template>
        </div>

        <!-- Pending follow-ups -->
        <div class="inset-surface rounded-lg p-3">
          <div class="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">To do</div>
          <p *ngIf="b.pendingFollowUps.length === 0" class="text-[11px] text-[var(--muted)]">Nothing pending.</p>
          <ul class="space-y-1.5">
            <li *ngFor="let item of b.pendingFollowUps" class="text-[11px] text-[var(--text)] flex gap-1.5">
              <i class="fa-solid text-[10px] mt-0.5"
                 [ngClass]="item.type === 'PRE_VISIT_FORM' ? 'fa-clipboard-list text-amber-600 dark:text-amber-400' : 'fa-flask text-purple-600 dark:text-purple-400'"
                 aria-hidden="true"></i>
              <span>
                {{ item.text }}
                <a *ngIf="item.type === 'PRE_VISIT_FORM' && item.appointmentId" [routerLink]="['/patient/intake', item.appointmentId]"
                   class="font-semibold text-[var(--primary)] whitespace-nowrap">Fill in</a>
                <a *ngIf="item.type === 'LAB_RESULTS_PENDING'" routerLink="/patient/lab-bookings"
                   class="font-semibold text-[var(--primary)] whitespace-nowrap">View</a>
              </span>
            </li>
          </ul>
        </div>

        <!-- Unread lab reports -->
        <div class="inset-surface rounded-lg p-3">
          <div class="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
            New lab reports
            <span *ngIf="b.unreadLabReports.length" class="ml-1 px-1.5 py-px rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300">{{ b.unreadLabReports.length }}</span>
          </div>
          <p *ngIf="b.unreadLabReports.length === 0" class="text-[11px] text-[var(--muted)]">You've seen all your lab reports.</p>
          <ul class="space-y-2">
            <li *ngFor="let report of b.unreadLabReports" class="flex items-center justify-between gap-2">
              <button type="button" (click)="openReport(report.documentId)"
                      class="min-w-0 text-left text-[11px] font-semibold text-[var(--text)] hover:text-[var(--primary)]">
                <span class="block truncate">{{ report.filename }}</span>
                <span class="block text-[9px] font-normal text-[var(--muted)]">{{ report.uploadedAt | date:'d MMM y' }}</span>
              </button>
              <app-lab-report-explainer [documentId]="report.documentId" [filename]="report.filename"></app-lab-report-explainer>
            </li>
          </ul>
        </div>
      </div>
    </section>
  `
})
export class PatientHealthBriefComponent implements OnInit {
  private ai = inject(AiAssistantService);
  private documentOpener = inject(DocumentOpenerService);

  brief = signal<PatientHealthBrief | null>(null);

  ngOnInit() {
    // Optional card: if the brief can't load, the dashboard simply doesn't show it
    this.ai.getHealthBrief().subscribe({
      next: brief => this.brief.set(brief),
      error: () => this.brief.set(null)
    });
  }

  /** Opening a report marks it read on the server, so it leaves this list */
  openReport(documentId: number) {
    this.documentOpener.open(documentId);
    this.brief.update(b => (b ? { ...b, unreadLabReports: b.unreadLabReports.filter(r => r.documentId !== documentId) } : b));
  }
}
