import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientAppointmentItem } from '../../core/services/appointment.service';
import { ButtonComponent } from '../../shared/components';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  selector: 'app-patient-dashboard-appointment-list',
  standalone: true,
  imports: [CommonModule, ButtonComponent, StatusBadgeComponent],
  templateUrl: './patient-dashboard-appointment-list.component.html',
})
export class PatientDashboardAppointmentListComponent {
  @Input() title = '';
  @Input() icon = 'fa-regular fa-calendar';
  @Input() items: PatientAppointmentItem[] = [];
  @Input() loading = false;
  @Input() loadingLabel = 'Loading appointments...';
  @Input() limit: number | null = null;
  @Input() emptyTitle = '';
  @Input() emptyMessage = '';
  @Input() emptyActionLabel = '';
  @Input() emptyVariant: 'highlight' | 'plain' = 'plain';
  @Input() actionVariant: 'primary' | 'secondary' = 'primary';

  @Output() viewAll = new EventEmitter<void>();
  @Output() emptyAction = new EventEmitter<void>();
  @Output() open = new EventEmitter<number>();

  get visibleItems(): PatientAppointmentItem[] {
    return this.limit == null ? this.items : this.items.slice(0, this.limit);
  }

  trackAppointment(_index: number, item: PatientAppointmentItem): number {
    return item.appointmentId;
  }
}
