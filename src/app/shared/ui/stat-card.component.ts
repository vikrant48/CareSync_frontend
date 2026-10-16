import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TONE_SOFT, UiTone } from './tone';

/**
 * KPI / metric tile: icon, label, value, optional hint.
 * Becomes a real <button> when `clickable` so it is keyboard accessible.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <ng-template #content>
      <span class="flex items-center gap-3 min-w-0">
        <span *ngIf="icon" class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
          [ngClass]="toneClass">
          <i [class]="icon" aria-hidden="true"></i>
        </span>
        <span class="min-w-0 text-left">
          <span class="block text-xs sm:text-sm text-muted leading-tight">{{ label }}</span>
          <span *ngIf="!loading" class="block font-bold text-xl sm:text-2xl leading-tight text-[var(--text)] truncate">
            {{ value ?? '—' }}
          </span>
          <span *ngIf="loading" class="skeleton-line block h-6 w-16 mt-1" role="status" aria-busy="true">
            <span class="sr-only">Loading</span>
          </span>
          <span *ngIf="hint" class="block text-xs text-muted mt-0.5">{{ hint }}</span>
        </span>
      </span>
    </ng-template>

    <button *ngIf="clickable; else plain" type="button" (click)="cardClick.emit()"
      class="surface surface-hover w-full p-3 sm:p-4 text-left cursor-pointer min-h-touch">
      <ng-container *ngTemplateOutlet="content"></ng-container>
    </button>
    <ng-template #plain>
      <div class="surface w-full p-3 sm:p-4">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </div>
    </ng-template>
  `,
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number | null | undefined;
  /** Font Awesome classes, e.g. `fa-solid fa-calendar-check` */
  @Input() icon = '';
  @Input() tone: UiTone = 'primary';
  @Input() hint = '';
  @Input() loading = false;
  @Input() clickable = false;

  @Output() cardClick = new EventEmitter<void>();

  get toneClass(): string {
    return TONE_SOFT[this.tone];
  }
}
