import { Component, Input } from '@angular/core';

/**
 * Standard page wrapper: max width, gutters and vertical rhythm.
 * Replaces the `max-w-[1400px] mx-auto p-3 sm:p-5 space-y-4` string repeated on every page.
 */
@Component({
  selector: 'app-page-container',
  standalone: true,
  host: { class: 'block w-full' },
  template: `
    <div class="mx-auto w-full min-w-0 text-[var(--text)]"
      [class]="maxWidthClass + ' ' + paddingClass + ' ' + spacingClass + ' ' + extraClass">
      <ng-content></ng-content>
    </div>
  `,
})
export class PageContainerComponent {
  @Input() maxWidthClass = 'max-w-[1400px]';
  @Input() paddingClass = 'p-3 sm:p-5';
  @Input() spacingClass = 'space-y-4';
  /** Anything extra, e.g. bottom padding to clear a sticky bar */
  @Input() extraClass = '';
}
