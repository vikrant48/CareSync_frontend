import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AppStatus =
  | 'BOOKED'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELLED_BY_PATIENT'
  | 'CANCELLED_BY_DOCTOR'
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | string;

/**
 * Unified status chip. Maps appointment/lab/admin statuses to one visual language.
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
  /** Optional override label */
  @Input() text = '';

  get normalized(): string {
    return String(this.status || '').toUpperCase().trim();
  }

  get label(): string {
    if (this.text) return this.text;
    const s = this.normalized;
    switch (s) {
      case 'BOOKED': return 'Booked';
      case 'SCHEDULED': return 'Scheduled';
      case 'CONFIRMED': return 'Confirmed';
      case 'IN_PROGRESS': return 'In progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'CANCELLED_BY_PATIENT': return 'Cancelled by patient';
      case 'CANCELLED_BY_DOCTOR': return 'Cancelled by doctor';
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
    if (s === 'COMPLETED' || s === 'ACTIVE') return 'status-badge--success';
    if (s === 'BOOKED' || s === 'SCHEDULED' || s === 'PENDING') return 'status-badge--warning';
    if (s === 'IN_PROGRESS' || s === 'CONFIRMED') return 'status-badge--info';
    if (s.startsWith('CANCELLED') || s === 'INACTIVE') return 'status-badge--danger';
    return 'status-badge--neutral';
  }
}
