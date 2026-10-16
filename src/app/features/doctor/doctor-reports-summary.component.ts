import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../shared/ui/stat-card.component';

@Component({
  selector: 'app-doctor-reports-summary',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  host: { class: 'block' },
  templateUrl: './doctor-reports-summary.component.html',
})
export class DoctorReportsSummaryComponent {
  @Input() appointmentCount: number | null = null;
  @Input() doctorRating: number | null = null;
  @Input() retention: { retentionRate?: number } | null = null;

  get retentionLabel(): string | null {
    const rate = this.retention?.retentionRate;
    return rate != null ? `${rate}%` : null;
  }
}
