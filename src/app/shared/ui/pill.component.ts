import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TONE_BORDER, TONE_SOFT, UiTone } from './tone';

/**
 * Small tone-coloured label ("Verified", "Anonymous", "Inactive" ...).
 * For appointment/payment statuses keep using `app-status-badge`.
 */
@Component({
  selector: 'app-pill',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'inline-flex' },
  template: `
    <span class="inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap"
      [ngClass]="[toneClass, borderClass, size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs']">
      <i *ngIf="icon" [class]="icon" aria-hidden="true"></i>
      <ng-content></ng-content>
    </span>
  `,
})
export class PillComponent {
  @Input() tone: UiTone = 'neutral';
  @Input() icon = '';
  @Input() size: 'sm' | 'md' = 'md';

  get toneClass(): string { return TONE_SOFT[this.tone]; }
  get borderClass(): string { return TONE_BORDER[this.tone]; }
}
