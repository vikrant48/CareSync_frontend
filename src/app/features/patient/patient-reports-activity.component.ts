import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientAppointmentItem } from '../../core/services/appointment.service';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { UserAvatarComponent } from '../../shared/components/user-avatar.component';

@Component({
  selector: 'app-patient-reports-activity',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, UserAvatarComponent],
  host: { class: 'block' },
  templateUrl: './patient-reports-activity.component.html',
})
export class PatientReportsActivityComponent {
  @Input() appointments: PatientAppointmentItem[] = [];
  @Output() view = new EventEmitter<number>();

  get visibleAppointments(): PatientAppointmentItem[] {
    return this.appointments.slice(0, 5);
  }

  trackAppointment(_index: number, item: PatientAppointmentItem): number {
    return item.appointmentId;
  }

  visitLabel(item: PatientAppointmentItem): string {
    return item.videoRoomId ? 'Video' : '';
  }
}
