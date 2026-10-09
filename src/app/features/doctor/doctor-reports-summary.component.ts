import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverallAnalytics } from '../../core/services/analytics.service';

@Component({
  selector: 'app-doctor-reports-summary',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './doctor-reports-summary.component.html',
})
export class DoctorReportsSummaryComponent {
  @Input() overall: OverallAnalytics | null = null;
  @Input() retention: { retentionRate?: number } | null = null;
}
