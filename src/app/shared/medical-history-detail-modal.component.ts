import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalHistoryItem } from '../core/services/patient-profile.service';

@Component({
  selector: 'app-medical-history-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-gray-900 w-full max-w-xl rounded shadow-lg">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="font-semibold">Medical History Detail</h3>
          <button class="btn-secondary" (click)="close.emit()">Close</button>
        </div>
        <div class="p-4" *ngIf="detail && doctorInfo; else loading">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-medium mb-2">Visit</h4>
              <div class="text-sm">Date: {{ detail.visitDate | date:'mediumDate' }}</div>
              <div class="text-sm">Symptoms: {{ detail.symptoms || '—' }}</div>
              <div class="text-sm">Diagnosis: {{ detail.diagnosis || '—' }}</div>
              <div class="text-sm">Treatment: {{ detail.treatment || '—' }}</div>
            </div>
            <div>
              <h4 class="font-medium mb-2">Prescription</h4>
              <div class="text-sm">Medicine: {{ detail.medicine || '—' }}</div>
              <div class="text-sm">Doses: {{ detail.doses || '—' }}</div>
              <div class="text-sm">Notes: {{ detail.notes || '—' }}</div>
            </div>
          </div>
          <div class="mt-4">
            <h4 class="font-medium mb-2">Prescribing Doctor</h4>
            <div class="text-sm">Name: {{ doctorInfo?.doctorName }}</div>
            <div class="text-sm">Specialization: {{ doctorInfo?.doctorSpecialization || '—' }}</div>
            <div class="text-sm">Mobile: {{ doctorInfo?.doctorContactInfo || '—' }}</div>
          </div>
        </div>
        <ng-template #loading>
          <div class="p-4 text-gray-400">Loading…</div>
        </ng-template>
      </div>
    </div>
  `,
})
export class MedicalHistoryDetailModalComponent {
  @Input() open = false;
  @Input() detail: Partial<MedicalHistoryItem> | null = null;
  @Input() doctorInfo: { doctorName: string; doctorSpecialization?: string; doctorContactInfo?: string } | null = null;
  @Output() close = new EventEmitter<void>();
}