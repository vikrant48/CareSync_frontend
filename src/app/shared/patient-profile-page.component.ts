import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDto, MedicalHistoryItem } from '../core/services/patient-profile.service';
import { RouterModule } from '@angular/router';

export interface AppointmentCounts {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

@Component({
  selector: 'app-patient-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Top Header -->
      <section class="panel p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <!-- Left -->
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-white">
              <img *ngIf="patient?.profileImageUrl; else initials" [src]="patient?.profileImageUrl" class="w-full h-full object-cover" (error)="onImageError()" />
              <ng-template #initials>
                <span class="text-xl font-semibold">{{ initialsFromName(patient) }}</span>
              </ng-template>
            </div>
            <div class="text-sm">
              <div class="text-lg font-semibold">{{ fullName(patient) }}</div>
              <div class="text-gray-400">ID: {{ patient?.id ?? '—' }}</div>
              <div class="text-gray-400">Email: {{ patient?.email || '—' }}</div>
              <div class="text-gray-400">Mobile: {{ patient?.contactInfo || '—' }}</div>
            </div>
          </div>

          <!-- Right: stats bar + actions -->
          <div class="flex flex-wrap gap-3 justify-start md:justify-end items-center">
            <div class="stat-pill">
              <div class="label">Total</div>
              <div class="value">{{ appointmentCounts?.total ?? 0 }}</div>
            </div>
            <div class="stat-pill">
              <div class="label">Completed</div>
              <div class="value">{{ appointmentCounts?.completed ?? 0 }}</div>
            </div>
            <div class="stat-pill">
              <div class="label">Cancelled</div>
              <div class="value">{{ appointmentCounts?.cancelled ?? 0 }}</div>
            </div>
            <div class="stat-pill">
              <div class="label">Upcoming</div>
              <div class="value">{{ appointmentCounts?.upcoming ?? 0 }}</div>
            </div>
            <a class="btn-primary" routerLink="/patient/profile/edit">Edit Patient</a>
          </div>
        </div>
      </section>

      <!-- Tabs -->
      <section class="panel p-0">
        <div class="flex items-center gap-1 border-b border-gray-700 px-4">
          <button class="tab-btn" [class.active]="activeTab==='overview'" (click)="activeTab='overview'">Overview</button>
          <button class="tab-btn" [class.active]="activeTab==='history'" (click)="activeTab='history'">Medical History</button>
          <ng-container *ngFor="let t of extraTabs">
            <button class="tab-btn" [class.active]="activeTab===t.id" (click)="activeTab=t.id">{{ t.label }}</button>
          </ng-container>
        </div>

        <div class="p-6">
          <div *ngIf="activeTab==='overview'">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <div class="section-title">Personal Details</div>
                <ul class="kv">
                  <li><span>First Name</span><strong>{{ patient?.firstName || '—' }}</strong></li>
                  <li><span>Last Name</span><strong>{{ patient?.lastName || '—' }}</strong></li>
                  <li><span>DOB</span><strong>{{ patient?.dateOfBirth | date:'mediumDate' }}</strong></li>
                  <li><span>Gender</span><strong>{{ patient?.gender || '—' }}</strong></li>
                  <li><span>Mobile</span><strong>{{ patient?.contactInfo || '—' }}</strong></li>
                  <li><span>Illness Details</span><strong>{{ patient?.illnessDetails || '—' }}</strong></li>
                </ul>
              </div>
              <div>
                <div class="section-title">Account</div>
                <ul class="kv">
                  <li><span>Username</span><strong>{{ patient?.username || '—' }}</strong></li>
                  <li><span>Email</span><strong>{{ patient?.email || '—' }}</strong></li>
                  <li><span>Status</span><strong>{{ patient?.isActive ? 'Active' : 'Inactive' }}</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab==='history'">
            <div *ngIf="(medicalHistory || []).length===0" class="text-gray-400">No medical history available.</div>
            <ul class="space-y-3" *ngIf="(medicalHistory || []).length > 0">
              <li *ngFor="let m of sortedHistory()" class="border border-gray-700 rounded p-4">
                <div class="flex items-center justify-between">
                  <div class="font-medium">Visit: {{ m.visitDate | date:'mediumDate' }}</div>
                  <div class="text-xs text-gray-400">ID: {{ m.id }}</div>
                </div>
                <div class="grid md:grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <div><span class="text-gray-400">Diagnosis:</span> {{ m.diagnosis || '—' }}</div>
                    <div><span class="text-gray-400">Symptoms:</span> {{ m.symptoms || '—' }}</div>
                    <div><span class="text-gray-400">Treatment:</span> {{ m.treatment || '—' }}</div>
                  </div>
                  <div>
                    <div><span class="text-gray-400">Medicine:</span> {{ m.medicine || '—' }}</div>
                    <div><span class="text-gray-400">Doses:</span> {{ m.doses || '—' }}</div>
                    <div><span class="text-gray-400">Notes:</span> {{ m.notes || '—' }}</div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <ng-container *ngFor="let t of extraTabs">
            <div *ngIf="activeTab===t.id">
              <ng-container *ngTemplateOutlet="t.content"></ng-container>
            </div>
          </ng-container>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .panel { background-color: rgba(17,24,39,0.6); border: 1px solid #374151; border-radius: 0.75rem; }
    .stat-pill { display:flex; align-items:center; gap:.5rem; padding:.5rem .75rem; border:1px solid #374151; border-radius:.75rem; }
    .stat-pill .label { color:#9CA3AF; font-size:.75rem; }
    .stat-pill .value { font-weight:600; font-size:1rem; }
    .tab-btn { padding:.5rem .75rem; border-radius: .5rem; color:#9CA3AF; }
    .tab-btn.active { background:#374151; color:#fff; }
    .section-title { font-weight:600; margin-bottom:.5rem; }
    .kv li { display:flex; justify-content:space-between; padding:.25rem 0; border-bottom:1px dashed #374151; }
    .kv li span { color:#9CA3AF; }
  `]
})
export class PatientProfilePageComponent {
  @Input() patient: PatientDto | null = null;
  @Input() medicalHistory: MedicalHistoryItem[] = [];
  @Input() appointmentCounts: AppointmentCounts | null = { total: 0, completed: 0, cancelled: 0, upcoming: 0 };
  @Input() extraTabs: { id: string; label: string; content: any }[] = [];

  activeTab = 'overview';

  sortedHistory() {
    return (this.medicalHistory || []).slice().sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }

  fullName(p?: PatientDto | null) {
    if (!p) return 'Patient';
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
    return name || p.username || 'Patient';
  }

  initialsFromName(p?: PatientDto | null) {
    const n = this.fullName(p);
    return n?.charAt(0) || 'P';
  }

  onImageError() {
    if (this.patient) this.patient.profileImageUrl = '';
  }
}