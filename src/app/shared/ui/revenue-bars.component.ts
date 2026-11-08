import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RevenueBar {
  label: string;
  value: number;
  detail?: string;
}

/** Single-series bar chart (one brand hue, no legend) with a hover tooltip per bar and a screen-reader table. */
@Component({
  selector: 'app-revenue-bars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <figure class="relative w-full m-0" [attr.aria-label]="title">
      <div class="flex items-baseline justify-between gap-2 mb-2">
        <figcaption class="text-sm font-bold text-[var(--text)]">{{ title }}</figcaption>
        <span class="text-[11px] text-[var(--muted)]">Peak {{ format(max) }}</span>
      </div>

      <div class="relative h-40 border-b border-[var(--border)]" aria-hidden="true">
        <div class="absolute inset-x-0 top-0 border-t border-dashed border-[var(--border)]"></div>
        <div class="absolute inset-0 flex items-end gap-[2px]">
          <div *ngFor="let bar of bars; let i = index" class="group relative flex-1 h-full flex items-end min-w-0">
            <div class="w-full rounded-t-[4px] bg-[var(--primary)] transition-opacity group-hover:opacity-80"
                 [style.height.%]="height(bar.value)"
                 [style.min-height.px]="bar.value > 0 ? 2 : 0"></div>
            <div class="pointer-events-none absolute bottom-full mb-1 z-10 hidden group-hover:block whitespace-nowrap
                        rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[11px] shadow-lg text-[var(--text)]"
                 [ngClass]="i > bars.length / 2 ? 'right-0' : 'left-0'">
              <div class="font-bold">{{ bar.label }}</div>
              <div>{{ format(bar.value) }}</div>
              <div *ngIf="bar.detail" class="text-[var(--muted)]">{{ bar.detail }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-[2px] mt-1" aria-hidden="true">
        <div *ngFor="let bar of bars; let i = index" class="flex-1 min-w-0 text-center text-[10px] text-[var(--muted)] truncate">
          {{ showLabel(i) ? shortLabel(bar.label) : '' }}
        </div>
      </div>

      <table class="sr-only">
        <caption>{{ title }}</caption>
        <tr><th scope="col">Period</th><th scope="col">Amount</th></tr>
        <tr *ngFor="let bar of bars"><td>{{ bar.label }}</td><td>{{ format(bar.value) }}</td></tr>
      </table>
    </figure>
  `,
})
export class RevenueBarsComponent {
  @Input() title = '';
  @Input() bars: RevenueBar[] = [];
  @Input() currency = 'INR';
  @Input() labelEvery = 1;

  get max(): number {
    return this.bars.reduce((m, b) => Math.max(m, b.value || 0), 0);
  }

  height(value: number): number {
    const max = this.max;
    return max > 0 ? Math.max(0, (value / max) * 100) : 0;
  }

  showLabel(i: number): boolean {
    const every = Math.max(1, this.labelEvery);
    return i % every === 0 || i === this.bars.length - 1;
  }

  shortLabel(label: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label.slice(8) + '/' + label.slice(5, 7);
    if (/^\d{4}-\d{2}$/.test(label)) {
      const [y, m] = label.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short' });
    }
    return label;
  }

  format(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: this.currency, maximumFractionDigits: 0 }).format(value || 0);
  }
}
