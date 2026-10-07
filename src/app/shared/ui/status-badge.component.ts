import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AppStatus =
  | 'HELD'
  | 'BOOKED'
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'INTAKE_COMPLETED'
  | 'READY_FOR_VISIT'
  | 'IN_PROGRESS'
  | 'REPORT_DRAFTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELLED_BY_PATIENT'
  | 'CANCELLED_BY_DOCTOR'
  | 'NO_SHOW_PATIENT'
  | 'NO_SHOW_DOCTOR'
  | 'AUTO_CLOSED'
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | string;

/**
 * Unified status chip mapping all 14 appointment states to consistent visual language.
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  @Input() status: AppStatus = '';
  @Input() text = '';

  get normalized(): string {
    return String(this.status || '').toUpperCase().trim();
  }

  get label(): string {
    if (this.text) return this.text;
    const s = this.normalized;
    switch (s) {
      case 'HELD': return 'Slot Held';
      case 'BOOKED': return 'Booked';
      case 'CONFIRMED': return 'Confirmed';
      case 'SCHEDULED': return 'Scheduled';
      case 'INTAKE_COMPLETED': return 'Intake Completed';
      case 'READY_FOR_VISIT': return 'Ready for Visit';
      case 'IN_PROGRESS': return 'In Consultation';
      case 'REPORT_DRAFTED': return 'Report Drafted';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'CANCELLED_BY_PATIENT': return 'Cancelled (Patient)';
      case 'CANCELLED_BY_DOCTOR': return 'Cancelled (Doctor)';
      case 'NO_SHOW_PATIENT': return 'No-Show (Patient)';
      case 'NO_SHOW_DOCTOR': return 'No-Show (Doctor)';
      case 'AUTO_CLOSED': return 'Auto-Closed';
      case 'PENDING': return 'Pending';
      case 'ACTIVE': return 'Active';
      case 'INACTIVE': return 'Inactive';
      default:
        return this.status
          ? String(this.status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
          : 'Unknown';
    }
  }

  get toneClass(): string {
    const s = this.normalized;
    switch (s) {
      case 'HELD': return 'status-badge--held';
      case 'BOOKED': return 'status-badge--booked';
      case 'CONFIRMED': return 'status-badge--confirmed';
      case 'SCHEDULED': return 'status-badge--scheduled';
      case 'INTAKE_COMPLETED': return 'status-badge--intake';
      case 'READY_FOR_VISIT': return 'status-badge--ready';
      case 'IN_PROGRESS': return 'status-badge--in-progress';
      case 'REPORT_DRAFTED': return 'status-badge--report-drafted';
      case 'COMPLETED': case 'ACTIVE': return 'status-badge--completed';
      case 'CANCELLED': case 'CANCELLED_BY_PATIENT': case 'CANCELLED_BY_DOCTOR': case 'INACTIVE': return 'status-badge--danger';
      case 'NO_SHOW_PATIENT': case 'NO_SHOW_DOCTOR': case 'PENDING': return 'status-badge--warning';
      case 'AUTO_CLOSED': return 'status-badge--neutral';
      default: return 'status-badge--neutral';
    }
  }
}
