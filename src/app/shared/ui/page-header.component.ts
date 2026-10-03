import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared page title row used across patient/doctor screens.
 * UI only — actions projected via ng-content.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() compact = false;
  @Input() hasActions = false;
  @Input() containerClass = '';
}
