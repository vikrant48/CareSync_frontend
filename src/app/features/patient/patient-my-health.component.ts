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
  template: `
    <!-- My Health -->
    <section class="mt-6">
      <h3 class="text-lg font-semibold mb-3">My Health</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Recent History -->
        <div class="panel p-5 h-full transition hover:shadow-lg hover:border-blue-500/30">
          <div class="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
            <div class="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-blue-500"></i> Recent History
            </div>
            <a routerLink="/patient/profile" class="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 min-h-touch inline-flex items-center px-2">View All</a>
          </div>
          <ul class="space-y-2">
            <li *ngFor="let item of medicalHistoryRecent" (click)="openHistoryDetail.emit(item.id)" (keydown.enter)="openHistoryDetail.emit(item.id)" tabindex="0" role="button" class="cursor-pointer bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-lg p-3 transition-colors border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-gray-700 group focus:outline-none focus:ring-2 focus:ring-blue-500/40">
              <div class="flex items-center justify-between mb-1">
                 <div class="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-2">{{ item.diagnosis || 'Diagnosis' }}</div>
                 <div class="text-[10px] text-gray-500 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-800">{{ item.visitDate | date:'shortDate' }}</div>
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400 truncate">{{ item.symptoms || item.treatment || 'No details' }}</div>
            </li>
            <li *ngIf="medicalHistoryRecent.length === 0">
              <app-empty-state
                icon="fa-solid fa-clock-rotate-left"
                title=""
                message="No recent history."
                [compact]="true"
              ></app-empty-state>
            </li>
          </ul>
        </div>

        <!-- Test Results -->
        <div class="panel p-5 h-full transition hover:shadow-lg hover:border-blue-500/30">
          <div class="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <div class="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <i class="fa-solid fa-flask text-purple-500"></i> Test Results
            </div>
            <a routerLink="/patient/lab-bookings" class="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 min-h-touch inline-flex items-center px-2">View All</a>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div *ngFor="let d of patientLabReports" class="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 hover:border-purple-500/30 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all group focus:outline-none focus:ring-2 focus:ring-purple-500/40" (click)="openDocument.emit(d)" (keydown.enter)="openDocument.emit(d)" tabindex="0" role="button">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <i class="fa-regular fa-file-pdf"></i>
                </div>
                <div class="min-w-0">
                  <div class="font-medium text-sm text-gray-900 dark:text-gray-300 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{{ d.filename }}</div>
                  <div class="text-[10px] text-gray-500">{{ d.uploadDate | date:'mediumDate' }}</div>
                </div>
              </div>
            </div>
            <div *ngIf="patientLabReports.length === 0" class="col-span-2">
              <app-empty-state
                icon="fa-solid fa-flask"
                title=""
                message="No lab reports available."
                [compact]="true"
                iconWrapClass="bg-purple-100 dark:bg-purple-500/10 text-purple-500"
              ></app-empty-state>
            </div>
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
