import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared collapsible filter strip (My Appointments pattern).
 * Project filter fields as default content; optional [filterSummary] slot.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="ui-panel p-3 sm:p-6 shadow-sm relative z-30 transition-all duration-300"
      [ngClass]="panelClass"
    >
      <div
        class="flex items-center justify-between gap-2 cursor-pointer sm:cursor-default"
        (click)="toggle()"
      >
        <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <i class="fa-solid fa-sliders shrink-0" [ngClass]="tone === 'dark' ? 'text-blue-400' : 'text-brand'" aria-hidden="true"></i>
          <span
            class="font-bold text-sm sm:text-base shrink-0"
            [ngClass]="tone === 'dark' ? 'text-slate-100' : 'text-gray-800 dark:text-gray-200'"
          >{{ title }}</span>
          <span
            *ngIf="activeCount > 0"
            class="bg-brand text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold shrink-0 whitespace-nowrap"
          >
            {{ activeCount }} Active
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0" (click)="$event.stopPropagation()">
          <button
            *ngIf="activeCount > 0 && showClear"
            type="button"
            (click)="clear.emit()"
            class="text-xs flex items-center gap-1 transition-colors font-medium shrink-0 whitespace-nowrap hover:underline"
            [ngClass]="tone === 'dark' ? 'text-rose-400 hover:text-rose-300' : 'text-red-600 dark:text-red-400 hover:text-red-300'"
          >
            <i class="fa-solid fa-xmark text-xs" aria-hidden="true"></i> Clear
          </button>
          <button
            type="button"
            (click)="toggle()"
            class="sm:hidden px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold transition-all shrink-0 whitespace-nowrap"
            [ngClass]="tone === 'dark' ? 'text-blue-300 bg-blue-500/15' : 'text-brand bg-brand-soft'"
            [attr.aria-expanded]="expanded"
          >
            <i class="fa-solid fa-filter text-[10px]" aria-hidden="true"></i>
            <span>{{ expanded ? 'Hide' : 'Filter' }}</span>
            <i
              class="fa-solid fa-chevron-down transition-transform duration-300"
              [class.rotate-180]="expanded"
              aria-hidden="true"
            ></i>
          </button>
        </div>
      </div>

      <div
        class="transition-all duration-300"
        [ngClass]="[
          gridClass,
          expanded ? 'grid mt-3' : 'hidden sm:grid'
        ]"
      >
        <ng-content></ng-content>
      </div>

      <div
        *ngIf="hasSummary"
        class="flex items-center justify-end pt-3 mt-3"
        [ngClass]="[
          summaryClass,
          tone === 'dark' ? 'border-t border-slate-700/60' : 'border-t border-gray-200 dark:border-gray-800'
        ]"
      >
        <ng-content select="[filterSummary]"></ng-content>
      </div>
    </div>
  `,
})
export class FilterBarComponent {
  @Input() title = 'Filters';
  @Input() activeCount = 0;
  @Input() showClear = true;
  @Input() gridClass = 'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4';
  @Input() panelClass = '';
  @Input() summaryClass = '';
  /** Use on slate/admin surfaces that don't rely on Tailwind `dark:` */
  @Input() tone: 'default' | 'dark' = 'default';
  /** Set true when projecting [filterSummary] */
  @Input() hasSummary = false;
  @Input() expanded = false;

  @Output() expandedChange = new EventEmitter<boolean>();
  @Output() clear = new EventEmitter<void>();

  toggle() {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }
}
