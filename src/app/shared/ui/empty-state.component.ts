import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared empty-state visual. UI only — parents keep their own data/actions.
 * Use `variant="error"` when a load failed, so users can tell failure from "no data".
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  /** Font Awesome icon classes, e.g. `fa-calendar-xmark` or `fa-regular fa-calendar-xmark` */
  @Input() icon = 'fa-inbox';
  @Input() title = '';
  @Input() message = '';
  @Input() compact = false;
  /** Extra classes on the outer wrapper */
  @Input() containerClass = '';
  /** Icon circle background/text color classes */
  @Input() iconWrapClass = 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
  /** Set true when projecting action buttons/links into ng-content */
  @Input() hasAction = false;

  /** `error` swaps in a warning icon/colour, announces as an alert and can show a Retry button */
  @Input() variant: 'empty' | 'error' = 'empty';
  @Input() showRetry = true;
  @Input() retryLabel = 'Try again';
  @Output() retry = new EventEmitter<void>();

  get resolvedIcon(): string {
    return this.variant === 'error' && this.icon === 'fa-inbox' ? 'fa-solid fa-triangle-exclamation' : this.icon;
  }

  get resolvedIconWrapClass(): string {
    const isDefault = this.iconWrapClass === 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
    return this.variant === 'error' && isDefault
      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
      : this.iconWrapClass;
  }
}
