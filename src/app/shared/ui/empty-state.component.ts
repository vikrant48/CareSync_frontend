import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared empty-state visual. UI only — parents keep their own data/actions.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
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
