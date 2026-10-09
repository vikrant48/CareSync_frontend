import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';

@Component({
  selector: 'app-doctor-dashboard-patients',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './doctor-dashboard-patients.component.html',
  styles: [`:host { display: block; min-width: 0; height: 100%; }`],
})
export class DoctorDashboardPatientsComponent {
  @Input() patients: any[] = [];
  @Output() openPatient = new EventEmitter<any>();

  get showAge(): boolean {
    return this.patients.some(patient => patient?.age != null && patient.age !== '' && patient.age !== '—');
  }

  trackPatient(index: number, patient: any): string {
    return `${patient?.name ?? index}-${patient?.lastVisit ?? ''}`;
  }
}
