import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientAppointmentItem } from '../../core/services/appointment.service';

@Component({
  selector: 'app-patient-dashboard-metrics-cards',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-dashboard-metrics-cards.component.html',
  styleUrl: './patient-dashboard-metrics-cards.component.css'
})
export class PatientDashboardMetricsCardsComponent {
  @Input() loadingPending = false;
  @Input() pendingFeedbackCount = 0;

  @Input() loadingAppointments = false;
  @Input() appointments: PatientAppointmentItem[] = [];
  @Input() todayAppointmentsCount = 0;

  @Input() loadingLabTests = false;
  @Input() labTestCount = 0;

  @Output() openFeedback = new EventEmitter<void>();
  @Output() openMyAppointments = new EventEmitter<void>();
  @Output() openTodayAppointments = new EventEmitter<void>();
  @Output() openLabTests = new EventEmitter<void>();
}
