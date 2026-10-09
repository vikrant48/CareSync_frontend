import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';

@Component({
  selector: 'app-doctor-dashboard-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent, SkeletonComponent],
  templateUrl: './doctor-dashboard-schedule.component.html',
  styles: [`:host { display: block; min-width: 0; height: 100%; }`],
})
export class DoctorDashboardScheduleComponent {
  @Input() loading = false;
  @Input() appointments: any[] = [];
  @Output() openPatient = new EventEmitter<any>();

  trackAppointment(index: number, item: any): string | number {
    return item?.appointmentId ?? `${item?.appointmentTime}-${item?.patientName}-${index}`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30';
      case 'SCHEDULED':
      case 'BOOKED':
        return 'bg-[var(--bg)] text-muted border border-[var(--border)]';
      case 'CANCELLED':
      case 'CANCELLED_BY_PATIENT':
      case 'CANCELLED_BY_DOCTOR':
        return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30';
      default:
        return 'bg-[var(--bg)] text-muted border border-[var(--border)]';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Checked In';
      case 'IN_PROGRESS': return 'Up Next';
      case 'SCHEDULED': return 'Scheduled';
      case 'BOOKED': return 'Pending';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }
}
