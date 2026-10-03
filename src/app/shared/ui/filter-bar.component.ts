import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared collapsible filter strip (My Appointments pattern).
 * Project filter fields as default content; optional [filterSummary] slot.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css'
})
export class FilterBarComponent {
  @Input() title = 'Filters';
  @Input() activeCount = 0;
  @Input() showClear = true;
  @Input() gridClass = 'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4';
  @Input() panelClass = '';
  @Input() summaryClass = '';
  /** Use on slate/admin surfaces that don't rely on Tailwind `dark:` */
  @Input() tone: 'default' | 'dark' = 'default';
  /** Set true when projecting [filterSummary] */
  @Input() hasSummary = false;
  @Input() expanded = false;

  @Output() expandedChange = new EventEmitter<boolean>();
  @Output() clear = new EventEmitter<void>();

  toggle() {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }
}
