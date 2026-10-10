import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-doctor-reports-summary',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './doctor-reports-summary.component.html',
})
export class DoctorReportsSummaryComponent {
  @Input() appointmentCount: number | null = null;
  @Input() doctorRating: number | null = null;
  @Input() retention: { retentionRate?: number } | null = null;
}
