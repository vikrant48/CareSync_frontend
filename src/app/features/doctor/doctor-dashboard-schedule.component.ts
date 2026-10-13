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

  trackAppointment(index: number, item: any): string | number {
    return item?.appointmentId ?? `${item?.appointmentTime}-${item?.patientName}-${index}`;
  }

}
