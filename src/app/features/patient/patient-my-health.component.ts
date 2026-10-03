import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MedicalHistoryItem, PatientDocumentItem } from '../../core/services/patient-profile.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-patient-my-health',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-my-health.component.html',
  styleUrl: './patient-my-health.component.css'
})
export class PatientMyHealthComponent {
  @Input() medicalHistoryRecent: MedicalHistoryItem[] = [];
  @Input() patientLabReports: PatientDocumentItem[] = [];

  @Output() openHistoryDetail = new EventEmitter<number>();
  @Output() openDocument = new EventEmitter<PatientDocumentItem>();
}
