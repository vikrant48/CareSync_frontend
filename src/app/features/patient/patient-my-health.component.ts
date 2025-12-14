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
        <!-- Recent History -->
        <div class="panel p-5 h-full transition hover:shadow-lg hover:border-blue-500/30">
          <div class="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
            <div class="font-medium text-gray-200 flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-blue-500"></i> Recent History
            </div>
            <button class="text-xs text-blue-400 hover:text-blue-300">View All</button>
          </div>
          <ul class="space-y-2">
            <li *ngFor="let item of medicalHistoryRecent" (click)="openHistoryDetail.emit(item.id)" class="cursor-pointer bg-gray-900/40 hover:bg-gray-800/60 rounded-lg p-3 transition-colors border border-transparent hover:border-gray-700 group">
              <div class="flex items-center justify-between mb-1">
                 <div class="font-medium text-gray-200 group-hover:text-blue-400 transition-colors truncate pr-2">{{ item.diagnosis || 'Diagnosis' }}</div>
                 <div class="text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">{{ item.visitDate | date:'shortDate' }}</div>
              </div>
              <div class="text-xs text-gray-400 truncate">{{ item.symptoms || item.treatment || 'No details' }}</div>
            </li>
            <li *ngIf="medicalHistoryRecent.length === 0" class="text-gray-500 text-center py-4 text-sm">No recent history.</li>
          </ul>
        </div>

        <!-- Test Results -->
        <div class="panel p-5 h-full transition hover:shadow-lg hover:border-blue-500/30">
          <div class="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
            <div class="font-medium text-gray-200 flex items-center gap-2">
              <i class="fa-solid fa-flask text-purple-500"></i> Test Results
            </div>
            <button class="text-xs text-blue-400 hover:text-blue-300">View All</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div *ngFor="let d of patientLabReports" class="bg-gray-900/40 border border-gray-800 hover:border-purple-500/30 rounded-lg p-3 cursor-pointer hover:bg-gray-800/60 transition-all group" (click)="openDocument.emit(d)">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <i class="fa-regular fa-file-pdf"></i>
                </div>
                <div class="min-w-0">
                  <div class="font-medium text-sm text-gray-300 truncate group-hover:text-purple-400 transition-colors">{{ d.originalFilename }}</div>
                  <div class="text-[10px] text-gray-500">{{ d.uploadDate | date:'mediumDate' }}</div>
                </div>
              </div>
            </div>
            <div *ngIf="patientLabReports.length === 0" class="text-gray-500 col-span-2 text-center py-4 text-sm">No lab reports available.</div>
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