import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type IconButtonTone = 'neutral' | 'primary' | 'danger';

/**
 * Icon-only button with a guaranteed 44px touch target and a required accessible name.
 * Bind `(click)` directly on the element; a disabled/loading button never fires it.
 */
@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'inline-flex' },
  template: `
    <button [type]="type" [disabled]="disabled || loading" [attr.aria-label]="label" [attr.title]="label"
      [attr.aria-busy]="loading ? 'true' : null"
      class="min-h-touch min-w-touch inline-flex items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      [ngClass]="toneClass">
      <i [class]="loading ? 'fa-solid fa-circle-notch fa-spin' : icon" aria-hidden="true"></i>
    </button>
  `,
})
export class IconButtonComponent {
  /** Font Awesome classes, e.g. `fa-solid fa-trash` */
  @Input() icon = '';
  /** Required: becomes aria-label and tooltip */
  @Input() label = '';
  @Input() tone: IconButtonTone = 'neutral';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() loading = false;

  get toneClass(): string {
    switch (this.tone) {
      case 'primary':
        return 'text-[var(--primary)] hover:bg-[var(--primary-soft)]';
      case 'danger':
        return 'text-red-600 dark:text-red-400 hover:bg-red-500/10';
      default:
        return 'text-muted hover:bg-gray-500/10 hover:text-[var(--text)]';
    }
  }
}
