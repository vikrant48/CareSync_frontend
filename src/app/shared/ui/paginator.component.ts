import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Pagination with an ellipsis window and 44px touch targets.
 * `page` is zero-based, matching the existing list components.
 * Renders in normal flow; wrap in `app-sticky-action-bar` for a pinned bar.
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <nav *ngIf="totalPages > 1 || showSummaryAlways" aria-label="Pagination"
      class="flex items-center justify-between gap-2"
      [ngClass]="compact ? 'flex-row' : 'flex-col sm:flex-row'">
      <p class="text-muted truncate min-w-0" [ngClass]="compact ? 'text-[11px] sm:text-xs' : 'text-xs'" aria-live="polite">
        Showing {{ firstItem }}–{{ lastItem }} of {{ total }}
      </p>
      <div class="flex items-center gap-1 shrink-0" *ngIf="totalPages > 1">
        <button type="button" (click)="go(page - 1)" [disabled]="page <= 0" aria-label="Previous page"
          class="px-2 rounded-lg font-semibold surface surface-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center"
          [ngClass]="sizeClass">
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <ng-container *ngFor="let p of pageItems">
          <span *ngIf="p === null" class="px-1 text-muted" aria-hidden="true">…</span>
          <button *ngIf="p !== null" type="button" (click)="go(p)" [attr.aria-label]="'Page ' + (p + 1)"
            [attr.aria-current]="p === page ? 'page' : null"
            class="px-2 rounded-lg font-semibold cursor-pointer inline-flex items-center justify-center"
            [ngClass]="[sizeClass, p === page ? 'bg-[var(--primary)] text-[var(--primary-fg)]' : 'surface surface-hover']">
            {{ p + 1 }}
          </button>
        </ng-container>
        <button type="button" (click)="go(page + 1)" [disabled]="page >= totalPages - 1" aria-label="Next page"
          class="px-2 rounded-lg font-semibold surface surface-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center"
          [ngClass]="sizeClass">
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </nav>
  `,
})
export class PaginatorComponent {
  /** Zero-based current page */
  @Input() page = 0;
  @Input() pageSize = 10;
  @Input() total = 0;
  @Input() showSummaryAlways = false;
  /** Slim 28px buttons on one line (for pinned bottom bars) */
  @Input() compact = false;

  get sizeClass(): string {
    return this.compact ? 'h-7 min-w-7 text-xs' : 'min-h-touch min-w-touch text-sm';
  }

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return this.pageSize > 0 ? Math.max(1, Math.ceil(this.total / this.pageSize)) : 1;
  }

  get firstItem(): number {
    return this.total === 0 ? 0 : this.page * this.pageSize + 1;
  }

  get lastItem(): number {
    return Math.min(this.total, (this.page + 1) * this.pageSize);
  }

  /** Page numbers with `null` marking an ellipsis: 1 … 4 5 [6] 7 8 … 20 */
  get pageItems(): (number | null)[] {
    const last = this.totalPages - 1;
    const keep = new Set<number>([0, last, this.page - 1, this.page, this.page + 1]);
    const sorted = [...keep].filter((p) => p >= 0 && p <= last).sort((a, b) => a - b);
    const items: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) items.push(null);
      items.push(p);
    });
    return items;
  }

  go(p: number): void {
    if (p < 0 || p >= this.totalPages || p === this.page) return;
    this.pageChange.emit(p);
  }
}
