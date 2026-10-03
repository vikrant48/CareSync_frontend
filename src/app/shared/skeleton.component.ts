import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.css'
})
export class SkeletonLoaderComponent {
  @Input() type: 'doctor-card' | 'appointment-card' | 'patient-history' | 'table-row' = 'doctor-card';
  @Input() count: number = 3;
  @Input() containerClass: string = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

  get items(): number[] {
    return Array.from({ length: this.count });
  }
}
