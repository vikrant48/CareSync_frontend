import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientDto, MedicalHistoryWithDoctorItem } from '../core/services/patient-profile.service';

@Component({
  selector: 'app-patient-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-gray-900 w-full max-w-3xl rounded shadow-lg border border-gray-800">
        <div class="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 class="font-semibold leading-tight">{{ patient ? (patient.firstName + ' ' + patient.lastName) : 'Patient Details' }}</h3>
          <button class="btn-secondary" (click)="close.emit()" aria-label="Close patient details">Close</button>
        </div>

        <!-- Tabs -->
        <div class="px-4 pt-3">
          <div class="flex gap-2 border-b border-gray-800">
            <button class="tab-btn" [class.active]="activeTab === 'overview'" (click)="activeTab='overview'">Overview</button>
            <button class="tab-btn" [class.active]="activeTab === 'history'" (click)="activeTab='history'">Medical History</button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-4" *ngIf="patient; else loadingPatient">
          <!-- Overview -->
          <div *ngIf="activeTab === 'overview'">
            <h4 class="font-medium mb-2">Basic Info</h4>
            <ul class="text-sm text-gray-300 space-y-1">
              <li><span class="text-gray-400">Name:</span> {{ patient.firstName }} {{ patient.lastName }}</li>
              <li><span class="text-gray-400">Email:</span> {{ patient.email || '—' }}</li>
              <li><span class="text-gray-400">Contact:</span> {{ patient.contactInfo || '—' }}</li>
              <li><span class="text-gray-400">Age:</span> {{ ageFromDob(patient.dateOfBirth) }}</li>
            </ul>
          </div>

          <!-- Medical History -->
          <div *ngIf="activeTab === 'history'">
            <div class="max-h-72 overflow-auto border border-gray-800 rounded">
              <button
                *ngFor="let h of sortedHistory(); trackBy: trackHistory"
                class="w-full text-left p-3 border-b border-gray-800 hover:bg-gray-800/60"
                (click)="historyClick.emit(h)"
                aria-label="View medical history item"
              >
                <p class="text-sm font-medium truncate">
                  {{ formatDate(h.visitDate) }} — {{ h.diagnosis || 'No diagnosis' }}
                </p>
                <p class="text-xs text-gray-400">
                  Prescribed by: {{ h.doctorName || 'Unknown' }}
                  <span *ngIf="h.doctorSpecialization">({{ h.doctorSpecialization }})</span>
                </p>
              </button>
              <div *ngIf="(sortedHistory() || []).length === 0" class="p-3 text-sm text-gray-400">No history.</div>
            </div>
          </div>
        </div>

        <ng-template #loadingPatient>
          <div class="p-4">
            <div class="flex items-center gap-2 text-gray-400">
              <span class="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span>
              Loading…
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
    .tab-btn { padding: 0.5rem 0.75rem; border-bottom: 2px solid transparent; color: #cbd5e1; }
    .tab-btn.active { color: #93c5fd; border-color: #93c5fd; }
    `,
  ],
})
export class PatientDetailsModalComponent {
  @Input() open = false;
  @Input() patient: PatientDto | null = null;
  @Input() history: MedicalHistoryWithDoctorItem[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() historyClick = new EventEmitter<MedicalHistoryWithDoctorItem>();

  activeTab: 'overview' | 'history' = 'overview';

  sortedHistory(): MedicalHistoryWithDoctorItem[] {
    const base = this.history || [];
    return base.slice().sort((a, b) => this.safeTime(b.visitDate) - this.safeTime(a.visitDate));
  }

  trackHistory(index: number, h: MedicalHistoryWithDoctorItem) { return (h as any)?.id ?? index; }

  formatDate(v: any): string {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v ?? '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private safeTime(v: any): number {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  ageFromDob(dob?: string | Date | null) {
    if (!dob) return '—';
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  }
}