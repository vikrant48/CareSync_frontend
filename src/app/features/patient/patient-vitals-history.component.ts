import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VitalLog } from '../../core/services/vitals.service';
import { getBPStatus as bpStatus, getSugarStatus as sugarStatus, getTempStatus as tempStatus, getWeightStatus as weightStatus } from './vitals-status';

@Component({
  selector: 'app-patient-vitals-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-vitals-history.component.html',
})
export class PatientVitalsHistoryComponent {
  @Input() vitals: VitalLog[] = [];
  @Output() logReading = new EventEmitter<void>();
  @Output() view = new EventEmitter<VitalLog>();

  getBPStatus = bpStatus;
  getSugarStatus = sugarStatus;
  getWeightStatus = weightStatus;
  getTempStatus = tempStatus;

  trackVital(index: number, vital: VitalLog): number | string {
    return vital.id ?? vital.recordedAt ?? index;
  }
}
