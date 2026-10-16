import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared page title row used across patient/doctor screens.
 * UI only — actions projected via ng-content.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  host: { class: 'block w-full' },
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() compact = false;
  @Input() hasActions = false;
  @Input() containerClass = '';
  /** `hero` = the gradient banner used at the top of most patient/doctor pages */
  @Input() variant: 'default' | 'hero' = 'default';
  /** Font Awesome classes; shown in the hero variant only */
  @Input() icon = '';
}
