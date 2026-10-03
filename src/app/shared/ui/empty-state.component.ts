import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared empty-state visual. UI only — parents keep their own data/actions.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col items-center justify-center text-center animate-fade-in"
      [class.py-10]="!compact"
      [class.py-6]="compact"
      [class.sm:py-16]="!compact"
      [class.min-h-[240px]]="!compact"
      [ngClass]="containerClass"
      role="status"
    >
      <div
        class="rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-inner"
        [class.w-14]="compact"
        [class.h-14]="compact"
        [class.w-20]="!compact"
        [class.h-20]="!compact"
        [class.sm:w-24]="!compact"
        [class.sm:h-24]="!compact"
        [ngClass]="iconWrapClass"
      >
        <i
          [class]="icon"
          [class.text-2xl]="compact"
          [class.text-3xl]="!compact"
          [class.sm:text-4xl]="!compact"
          aria-hidden="true"
        ></i>
      </div>

      <h3
        *ngIf="title"
        class="font-bold text-gray-800 dark:text-gray-100 mb-1"
        [class.text-base]="compact"
        [class.text-lg]="!compact"
        [class.sm:text-xl]="!compact"
      >
        {{ title }}
      </h3>

      <p
        *ngIf="message"
        class="text-gray-500 dark:text-gray-400 max-w-md mx-auto"
        [class.text-xs]="compact"
        [class.sm:text-sm]="compact"
        [class.text-sm]="!compact"
        [class.mb-4]="hasAction"
        [class.mb-0]="!hasAction"
      >
        {{ message }}
      </p>

      <div *ngIf="hasAction" class="mt-2 flex flex-wrap items-center justify-center gap-2">
        <ng-content></ng-content>
      </div>
    </div>
  `,
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
}
