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
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Top Header -->
      <section class="panel p-6 sm:p-8 animate-fade-in">
        <div class="flex flex-col md:flex-row gap-6 items-start justify-between">
          <!-- Left: Identity -->
          <div class="flex items-start gap-5 w-full md:w-auto">
            <div class="relative shrink-0">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 ring-4 ring-gray-800/50 shadow-xl overflow-hidden flex items-center justify-center text-white text-2xl font-bold">
                <img *ngIf="patient?.profileImageUrl; else initials" [src]="patient?.profileImageUrl" class="w-full h-full object-cover transition-transform hover:scale-110 duration-500" (error)="onImageError()" />
                <ng-template #initials>
                  <span>{{ initialsFromName(patient) }}</span>
                </ng-template>
              </div>
              <div class="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-gray-900 rounded-full" title="Active"></div>
            </div>
            
            <div class="flex-1 min-w-0 space-y-1">
              <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">{{ fullName(patient) }}</h2>
              <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400">
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-hashtag text-gray-600"></i> {{ patient?.id ?? '—' }}</span>
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-envelope text-gray-600"></i> {{ patient?.email || '—' }}</span>
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-phone text-gray-600"></i> {{ patient?.contactInfo || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Action & Stats -->
          <div class="w-full md:w-auto flex flex-col items-start md:items-end gap-4">
             <a class="btn-primary w-full md:w-auto shadow-lg shadow-blue-500/20" routerLink="/patient/profile/edit">
               <i class="fa-solid fa-pen-to-square mr-2"></i> Edit Profile
             </a>
             
             <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
               <div class="bg-gray-800/50 rounded-lg p-3 text-center min-w-[80px] border border-gray-800">
                 <div class="text-xs text-gray-400 uppercase tracking-wider font-medium">Total</div>
                 <div class="text-lg font-bold text-white">{{ appointmentCounts?.total ?? 0 }}</div>
               </div>
               <div class="bg-emerald-500/10 rounded-lg p-3 text-center min-w-[80px] border border-emerald-500/20">
                 <div class="text-xs text-emerald-400 uppercase tracking-wider font-medium">Done</div>
                 <div class="text-lg font-bold text-emerald-400">{{ appointmentCounts?.completed ?? 0 }}</div>
               </div>
               <div class="bg-amber-500/10 rounded-lg p-3 text-center min-w-[80px] border border-amber-500/20">
                 <div class="text-xs text-amber-400 uppercase tracking-wider font-medium">Upcoming</div>
                 <div class="text-lg font-bold text-amber-400">{{ appointmentCounts?.upcoming ?? 0 }}</div>
               </div>
               <div class="bg-red-500/10 rounded-lg p-3 text-center min-w-[80px] border border-red-500/20">
                 <div class="text-xs text-red-400 uppercase tracking-wider font-medium">Cancel</div>
                 <div class="text-lg font-bold text-red-400">{{ appointmentCounts?.cancelled ?? 0 }}</div>
               </div>
             </div>
          </div>
        </div>
      </section>

      <!-- Content Tabs -->
      <section class="panel overflow-hidden">
        <!-- Tab Headers -->
        <div class="flex items-center gap-1 border-b border-gray-800 px-2 sm:px-6 pt-2 overflow-x-auto no-scrollbar">
          <button class="px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap outline-none focus:bg-gray-800/50 rounded-t-lg"
            [class.border-blue-500]="activeTab==='overview'" 
            [class.text-blue-400]="activeTab==='overview'"
            [class.border-transparent]="activeTab!=='overview'"
            [class.text-gray-400]="activeTab!=='overview'"
            [class.hover:text-gray-200]="activeTab!=='overview'"
            (click)="activeTab='overview'">
            <i class="fa-solid fa-address-card mr-2"></i> Overview
          </button>
          <button class="px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap outline-none focus:bg-gray-800/50 rounded-t-lg"
            [class.border-blue-500]="activeTab==='history'" 
            [class.text-blue-400]="activeTab==='history'"
            [class.border-transparent]="activeTab!=='history'"
            [class.text-gray-400]="activeTab!=='history'"
            [class.hover:text-gray-200]="activeTab!=='history'"
            (click)="activeTab='history'">
            <i class="fa-solid fa-notes-medical mr-2"></i> Medical History
          </button>
          <ng-container *ngFor="let t of extraTabs">
            <button class="px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap outline-none focus:bg-gray-800/50 rounded-t-lg"
              [class.border-blue-500]="activeTab===t.id" 
              [class.text-blue-400]="activeTab===t.id"
              [class.border-transparent]="activeTab!==t.id"
              [class.text-gray-400]="activeTab!==t.id"
              [class.hover:text-gray-200]="activeTab!==t.id"
              (click)="activeTab=t.id">
              {{ t.label }}
            </button>
          </ng-container>
        </div>

        <div class="p-6 sm:p-8 min-h-[400px]">
          <!-- Overview Tab -->
          <div *ngIf="activeTab==='overview'" class="animate-fade-in">
            <div class="grid md:grid-cols-2 gap-8 md:gap-12">
              <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-user-check text-blue-500"></i> Personal Details
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between border-b border-gray-800/50 pb-2">
                            <span class="text-gray-400">First Name</span>
                            <span class="font-medium text-gray-200">{{ patient?.firstName || '—' }}</span>
                        </div>
                        <div class="flex justify-between border-b border-gray-800/50 pb-2">
                            <span class="text-gray-400">Last Name</span>
                            <span class="font-medium text-gray-200">{{ patient?.lastName || '—' }}</span>
                        </div>
                        <div class="flex justify-between border-b border-gray-800/50 pb-2">
                            <span class="text-gray-400">Date of Birth</span>
                            <span class="font-medium text-gray-200">{{ patient?.dateOfBirth | date:'mediumDate' }}</span>
                        </div>
                        <div class="flex justify-between border-b border-gray-800/50 pb-2">
                            <span class="text-gray-400">Gender</span>
                            <span class="font-medium text-gray-200">{{ patient?.gender || '—' }}</span>
                        </div>
                        <div class="flex justify-between border-b border-gray-800/50 pb-2">
                            <span class="text-gray-400">Contact</span>
                            <span class="font-medium text-gray-200">{{ patient?.contactInfo || '—' }}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                         <i class="fa-solid fa-file-medical text-red-400"></i> Critical Info
                    </h3>
                    <div class="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                        <div class="text-xs text-red-300 font-bold uppercase tracking-wider mb-1">Illness Details</div>
                        <p class="text-gray-300 leading-relaxed">{{ patient?.illnessDetails || 'No critical illness details recorded.' }}</p>
                    </div>
                </div>
              </div>

              <div class="space-y-6">
                <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-shield-halved text-emerald-500"></i> Account Status
                </h3>
                <div class="bg-gray-800/30 rounded-xl p-6 border border-gray-800 space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-400">Username</span>
                        <span class="font-mono text-sm bg-gray-900 px-2 py-1 rounded text-gray-300">{{ patient?.username || '—' }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-400">Email Preference</span>
                        <span class="font-medium text-gray-200">{{ patient?.email || '—' }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-400">Account Status</span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" *ngIf="patient?.isActive">
                            Active
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" *ngIf="!patient?.isActive">
                            Inactive
                        </span>
                    </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Medical History Tab -->
          <div *ngIf="activeTab==='history'" class="animate-fade-in space-y-4">
            <div *ngIf="(medicalHistory || []).length===0" class="flex flex-col items-center justify-center py-12 text-gray-500">
                <i class="fa-solid fa-folder-open text-4xl mb-3 opacity-50"></i>
                <p>No medical history records found.</p>
            </div>
            
            <div class="grid gap-4" *ngIf="(medicalHistory || []).length > 0">
              <div *ngFor="let m of sortedHistory()" class="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-colors">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                   <div class="flex items-center gap-3">
                       <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                           <i class="fa-solid fa-stethoscope"></i>
                       </div>
                       <div>
                           <div class="font-semibold text-gray-200">Visit Date: {{ m.visitDate | date:'mediumDate' }}</div>
                           <div class="text-xs text-gray-500">Record ID: #{{ m.id }}</div>
                       </div>
                   </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6 text-sm">
                   <div class="space-y-3">
                       <div><span class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Diagnosis</span> <span class="text-gray-200 font-medium">{{ m.diagnosis || '—' }}</span></div>
                       <div><span class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Symptoms</span> <span class="text-gray-300">{{ m.symptoms || '—' }}</span></div>
                       <div><span class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Treatment</span> <span class="text-gray-300">{{ m.treatment || '—' }}</span></div>
                   </div>
                   <div class="space-y-3">
                       <div><span class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Medicine</span> <span class="text-gray-300 font-mono">{{ m.medicine || '—' }}</span></div>
                       <div><span class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Doses</span> <span class="text-gray-300">{{ m.doses || '—' }}</span></div>
                       <div><span class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Notes</span> <span class="text-gray-400 italic">{{ m.notes || '—' }}</span></div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <ng-container *ngFor="let t of extraTabs">
            <div *ngIf="activeTab===t.id" class="animate-fade-in">
              <ng-container *ngTemplateOutlet="t.content"></ng-container>
            </div>
          </ng-container>
        </div>
      </section>
    </div>
  `,
  styles: []
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