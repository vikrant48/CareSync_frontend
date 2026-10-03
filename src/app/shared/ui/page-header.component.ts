import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared page title row used across patient/doctor screens.
 * UI only — actions projected via ng-content.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-6 animate-fade-in"
      [ngClass]="containerClass"
    >
      <div class="min-w-0">
        <p *ngIf="eyebrow" class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand mb-0.5">
          {{ eyebrow }}
        </p>
        <h1
          class="font-display font-bold text-gray-900 dark:text-white tracking-tight truncate"
          [class.text-xl]="!compact"
          [class.sm:text-3xl]="!compact"
          [class.text-lg]="compact"
          [class.sm:text-2xl]="compact"
        >
          {{ title }}
        </h1>
        <p *ngIf="subtitle" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div *ngIf="hasActions" class="flex items-center gap-2 shrink-0 flex-wrap">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() compact = false;
  @Input() hasActions = false;
  @Input() containerClass = '';
}
