import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  selector: 'app-doctor-dashboard-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent, PageLoaderComponent, StatusBadgeComponent],
  templateUrl: './doctor-dashboard-schedule.component.html',
  styles: [`:host { display: block; min-width: 0; height: 100%; }`],
})
export class DoctorDashboardScheduleComponent {
  @Input() loading = false;
  @Input() appointments: any[] = [];
  @Output() openPatient = new EventEmitter<any>();

  private static readonly CLOSED = /CANCELLED|REJECTED|NO_SHOW|AUTO_CLOSED/;

  /** The first 3 of today: active visits first, cancelled or missed ones only if there is room. */
  get topAppointments(): any[] {
    const isClosed = (a: any) => DoctorDashboardScheduleComponent.CLOSED.test(String(a?.status || ""));
    return [...this.appointments.filter((a) => !isClosed(a)), ...this.appointments.filter(isClosed)].slice(0, 3);
  }

  trackAppointment(index: number, item: any): string | number {
    return item?.appointmentId ?? `${item?.appointmentTime}-${item?.patientName}-${index}`;
  }

}
