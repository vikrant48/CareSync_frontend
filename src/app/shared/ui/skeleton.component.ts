import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Lightweight loading skeleton blocks. UI only.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './skeleton.component.html',
})
export class SkeletonComponent {
  /** card | list | metrics | line | table | focus | history */
  @Input() variant: 'card' | 'list' | 'metrics' | 'line' | 'table' | 'focus' | 'history' = 'card';
  @Input() count = 3;
  @Input() width = '100%';
  @Input() height = '0.75rem';
  @Input() wrapperClass = '';
  @Input() panelClass = '';

  get countArray(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, i) => i);
  }
}
