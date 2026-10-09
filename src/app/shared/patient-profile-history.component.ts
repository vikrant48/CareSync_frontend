import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalHistoryItem } from '../core/services/patient-profile.service';
import { EmptyStateComponent } from './ui/empty-state.component';

@Component({
  selector: 'app-patient-profile-history',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './patient-profile-history.component.html',
})
export class PatientProfileHistoryComponent {
  @Input() medicalHistory: MedicalHistoryItem[] = [];

  get sortedHistory(): MedicalHistoryItem[] {
    return (this.medicalHistory || []).slice().sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }

  trackHistory(_index: number, item: MedicalHistoryItem): number {
    return item.id;
  }
}
