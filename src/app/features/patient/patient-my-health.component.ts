import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalHistoryItem, PatientDocumentItem } from '../../core/services/patient-profile.service';

@Component({
  selector: 'app-patient-my-health',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- My Health -->
    <section class="mt-6">
      <h3 class="text-lg font-semibold mb-3">My Health</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="panel p-4">
          <div class="text-sm text-gray-400 mb-2">Recent Medical History</div>
          <ul class="text-sm space-y-2">
            <li *ngFor="let item of medicalHistoryRecent" (click)="openHistoryDetail.emit(item.id)" class="cursor-pointer hover:bg-gray-800 rounded px-2 py-1">
              <div class="font-medium">{{ item.diagnosis || item.symptoms || item.treatment }}</div>
              <div class="text-gray-500">{{ item.visitDate }}</div>
            </li>
            <li *ngIf="medicalHistoryRecent.length === 0" class="text-gray-500">No recent history.</li>
          </ul>
        </div>
        <div class="panel p-4">
          <div class="text-sm text-gray-400 mb-2">Test Results</div>
          <div class="grid grid-cols-2 gap-2">
            <div *ngFor="let d of patientLabReports" class="border rounded p-2 text-sm cursor-pointer hover:bg-gray-800" (click)="openDocument.emit(d)">
              <div class="font-medium truncate">{{ d.originalFilename }}</div>
              <div class="text-gray-500">{{ d.uploadDate | date:'mediumDate' }}</div>
            </div>
            <div *ngIf="patientLabReports.length === 0" class="text-gray-500">No lab reports available.</div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class PatientMyHealthComponent {
  @Input() medicalHistoryRecent: MedicalHistoryItem[] = [];
  @Input() patientLabReports: PatientDocumentItem[] = [];

  @Output() openHistoryDetail = new EventEmitter<number>();
  @Output() openDocument = new EventEmitter<PatientDocumentItem>();
}