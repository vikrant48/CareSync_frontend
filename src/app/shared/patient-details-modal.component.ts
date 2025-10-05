import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDto, MedicalHistoryWithDoctorItem } from '../core/services/patient-profile.service';

@Component({
  selector: 'app-patient-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-gray-900 w-full max-w-3xl rounded shadow-lg">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="font-semibold">Patient Details</h3>
          <button class="btn-secondary" (click)="close.emit()">Close</button>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4" *ngIf="patient; else loadingPatient">
          <div>
            <h4 class="font-medium mb-2">Basic Info</h4>
            <ul class="text-sm text-gray-300 space-y-1">
              <li>Name: {{ patient?.firstName }} {{ patient?.lastName }}</li>
              <li>Email: {{ patient?.email || '—' }}</li>
              <li>Contact: {{ patient?.contactInfo || '—' }}</li>
              <li>Age: {{ ageFromDob(patient?.dateOfBirth) }}</li>
            </ul>
            <h4 class="font-medium mt-4 mb-2">Medical History</h4>
            <div class="max-h-48 overflow-auto border rounded">
              <button
                *ngFor="let h of history"
                class="w-full text-left p-2 border-b hover:bg-gray-800"
                (click)="historyClick.emit(h)"
              >
                <p class="text-sm">
                  {{ h.visitDate }} — {{ h.diagnosis || 'No diagnosis' }}
                </p>
                <p class="text-xs text-gray-400">
                  Prescribed by: {{ h.doctorName }}
                  <span *ngIf="h.doctorSpecialization">({{ h.doctorSpecialization }})</span>
                </p>
              </button>
              <div *ngIf="(history || []).length === 0" class="p-2 text-sm text-gray-400">No history.</div>
            </div>
          </div>
        </div>
        <ng-template #loadingPatient>
          <div class="p-4 text-gray-400">Loading…</div>
        </ng-template>
      </div>
    </div>
  `,
})
export class PatientDetailsModalComponent {
  @Input() open = false;
  @Input() patient: PatientDto | null = null;
  @Input() history: MedicalHistoryWithDoctorItem[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() historyClick = new EventEmitter<MedicalHistoryWithDoctorItem>();

  ageFromDob(dob?: string | Date | null) {
    if (!dob) return '—';
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  }
}