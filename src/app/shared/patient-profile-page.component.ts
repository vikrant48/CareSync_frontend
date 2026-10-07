import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDto, MedicalHistoryItem } from '../core/services/patient-profile.service';
import { RouterModule } from '@angular/router';
import { EmptyStateComponent } from './ui/empty-state.component';

export interface AppointmentCounts {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

@Component({
  selector: 'app-patient-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8" *ngIf="patient; else loading">
      
      <!-- Top Hero Header Card -->
      <section class="relative overflow-hidden bg-[#151b2b] border border-[#2a3347] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        
        <!-- Left: Identity & Profile Strength -->
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full lg:w-auto text-center sm:text-left">
          
          <!-- Avatar with Camera Overlay & Active Dot -->
          <div class="relative shrink-0">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1b2333] border-4 border-[#2a3347] shadow-xl overflow-hidden flex items-center justify-center text-white text-2xl font-bold">
              <img *ngIf="patient.profileImageUrl; else initials" [src]="patient.profileImageUrl" class="w-full h-full object-cover transition-transform hover:scale-110 duration-500" (error)="onImageError()" />
              <ng-template #initials>
                <span>{{ initialsFromName(patient) }}</span>
              </ng-template>
            </div>
            
            <!-- Active Status Indicator -->
            <div class="absolute bottom-1 left-1 w-4 h-4 bg-emerald-500 border-2 border-[#151b2b] rounded-full" title="Active"></div>
          </div>
          
          <!-- Identity Details & Strength Bar -->
          <div class="space-y-1.5 flex-1 min-w-0">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">{{ fullName(patient) }}</h1>
            
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-[#9aa3b8]">
              <span class="flex items-center gap-1 font-mono">
                <i class="fa-solid fa-hashtag text-[10px]"></i> {{ patient.id }}
              </span>
              <span class="flex items-center gap-1">
                <i class="fa-solid fa-envelope text-[10px]"></i> {{ patient.email || 'NA' }}
              </span>
              <span class="flex items-center gap-1">
                <i class="fa-solid fa-phone text-[10px]"></i> {{ patient.contactInfo || 'NA' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Middle: 4 Appointment Stat KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          <!-- TOTAL -->
          <div class="bg-[#1b2333] border border-[#2a3347] p-3 sm:p-4 rounded-xl text-center shadow-sm min-w-[85px]">
            <div class="text-[9px] sm:text-[10px] text-[#9aa3b8] font-bold uppercase tracking-wider">Appointments</div>
            <div class="text-lg sm:text-xl font-extrabold text-white mt-0.5">{{ appointmentCounts?.total ?? 0 }}</div>
          </div>

          <!-- DONE -->
          <div class="bg-emerald-500/10 border border-emerald-500/20 p-3 sm:p-4 rounded-xl text-center shadow-sm min-w-[85px]">
            <div class="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <i class="fa-solid fa-circle-check text-[8px]"></i> DONE
            </div>
            <div class="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5">{{ appointmentCounts?.completed ?? 0 }}</div>
          </div>

          <!-- UPCOMING -->
          <div class="bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 rounded-xl text-center shadow-sm min-w-[85px]">
            <div class="text-[9px] sm:text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <i class="fa-solid fa-clock text-[8px]"></i> UPCOMING
            </div>
            <div class="text-lg sm:text-xl font-extrabold text-amber-400 mt-0.5">{{ appointmentCounts?.upcoming ?? 0 }}</div>
          </div>

          <!-- CANCELLED -->
          <div class="bg-rose-500/10 border border-rose-500/20 p-3 sm:p-4 rounded-xl text-center shadow-sm min-w-[85px]">
            <div class="text-[9px] sm:text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <i class="fa-solid fa-circle-xmark text-[8px]"></i> CANCELLED
            </div>
            <div class="text-lg sm:text-xl font-extrabold text-rose-400 mt-0.5">{{ appointmentCounts?.cancelled ?? 0 }}</div>
          </div>
        </div>

        <!-- Right: Edit Profile Button -->
        <div class="w-full lg:w-auto flex justify-end">
          <a routerLink="/patient/profile/edit" 
            class="w-full sm:w-auto bg-[#5b6cf0] hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
            <span>Edit</span>
          </a>
        </div>
      </section>

      <!-- Main Navigation Tabs -->
      <section class="bg-[#151b2b] border border-[#2a3347] rounded-2xl overflow-hidden shadow-sm">
        
        <!-- Tab Headers -->
        <div class="flex items-center gap-2 border-b border-[#2a3347] px-4 sm:px-6 pt-3 overflow-x-auto scrollbar-none">
          <button (click)="activeTab='overview'"
            [ngClass]="activeTab === 'overview' 
              ? 'border-b-2 border-[#5b6cf0] text-[#5b6cf0] font-bold' 
              : 'text-[#9aa3b8] hover:text-white font-semibold'"
            class="px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap outline-none flex items-center gap-2">
            <i class="fa-solid fa-user text-xs"></i>
            <span>Overview</span>
          </button>

          <button (click)="activeTab='history'"
            [ngClass]="activeTab === 'history' 
              ? 'border-b-2 border-[#5b6cf0] text-[#5b6cf0] font-bold' 
              : 'text-[#9aa3b8] hover:text-white font-semibold'"
            class="px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap outline-none flex items-center gap-2">
            <i class="fa-solid fa-notes-medical text-xs"></i>
            <span>Medical History</span>
          </button>

          <a routerLink="/patient/appointments"
            class="px-4 py-3 text-xs sm:text-sm font-semibold text-[#9aa3b8] hover:text-white transition-colors whitespace-nowrap flex items-center gap-2">
            <i class="fa-solid fa-calendar-days text-xs"></i>
            <span>Appointments</span>
          </a>

          <a routerLink="/patient/lab-bookings"
            class="px-4 py-3 text-xs sm:text-sm font-semibold text-[#9aa3b8] hover:text-white transition-colors whitespace-nowrap flex items-center gap-2">
            <i class="fa-solid fa-flask text-xs"></i>
            <span>Lab Tests</span>
          </a>
        </div>

        <!-- Tab Body Content -->
        <div class="p-6 sm:p-8 min-h-[400px]">
          
          <!-- OVERVIEW TAB -->
          <div *ngIf="activeTab==='overview'" class="animate-in fade-in duration-200 space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <!-- Left 6-col: Personal Details Card -->
              <div class="lg:col-span-6 bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div class="flex items-center justify-between border-b border-[#2a3347] pb-4">
                  <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-user text-[#5b6cf0] text-sm"></i>
                    <h2 class="text-base font-bold text-white tracking-tight">Personal Details</h2>
                  </div>
                </div>

                <div class="space-y-3.5 text-xs sm:text-sm">
                  <div class="flex justify-between border-b border-[#2a3347]/60 pb-2.5">
                    <span class="text-[#9aa3b8]">Full Name</span>
                    <span class="font-bold text-white">{{ fullName(patient) }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[#2a3347]/60 pb-2.5">
                    <span class="text-[#9aa3b8]">Email</span>
                    <span class="font-bold text-white">{{ patient.email || 'NA' }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[#2a3347]/60 pb-2.5">
                    <span class="text-[#9aa3b8]">Date of Birth</span>
                    <span class="font-bold text-white">{{ formatDateOfBirth(patient.dateOfBirth) }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[#2a3347]/60 pb-2.5">
                    <span class="text-[#9aa3b8]">Gender</span>
                    <span class="font-bold text-white">{{ patient.gender || 'NA' }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[#2a3347]/60 pb-2.5">
                    <span class="text-[#9aa3b8]">Blood Group</span>
                    <span class="font-bold text-white">{{ patient.bloodGroup || 'NA' }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[#2a3347]/60 pb-2.5">
                    <span class="text-[#9aa3b8]">Contact Number</span>
                    <span class="font-bold text-white font-mono">{{ patient.contactInfo || 'NA' }}</span>
                  </div>
                </div>
              </div>

              <!-- Right 6-col: Account Status Card -->
              <div class="lg:col-span-6 bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div class="flex items-center justify-between border-b border-[#2a3347] pb-4">
                  <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-shield-halved text-emerald-400 text-sm"></i>
                    <h2 class="text-base font-bold text-white tracking-tight">Account Status</h2>
                  </div>
                  <span class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-[10px]"></i>
                    <span>Active(to be added)</span>
                  </span>
                </div>

                            <!-- Profile Strength Progress Bar -->
            <div class="w-full sm:w-64 pt-2">
              <div class="flex justify-between items-center text-[10px] font-bold text-[#9aa3b8] uppercase tracking-wider mb-1">
                <span>PROFILE STRENGTH</span>
                <span class="text-[#5b6cf0] font-mono">{{ patient.completionPercentage }}%</span>
              </div>
              <div class="w-full bg-[#1b2333] border border-[#2a3347] rounded-full h-2 overflow-hidden">
                <div class="bg-[#5b6cf0] h-full rounded-full transition-all duration-1000" [style.width.%]="patient.completionPercentage"></div>
              </div>
            </div>

                <div class="bg-[#1b2333] border border-[#2a3347] rounded-xl p-4 space-y-3.5 text-xs sm:text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-[#9aa3b8]">Username</span>
                    <span class="font-mono text-xs bg-[#0b0f1a] px-2.5 py-1 rounded border border-[#2a3347] text-white">
                      {{ patient.username || 'username' }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-[#9aa3b8]">Email Preference</span>
                    <span class="font-medium text-white">{{ patient.email || 'shruti@gmail.com' }}</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-[#9aa3b8]">Account Status</span>
                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Active(to be added)
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-[#9aa3b8]">Member Since</span>
                    <span class="font-medium text-white">15 Jan 2024(to be added)</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-[#9aa3b8]">Last Login</span>
                    <span class="font-medium text-white">04 Oct 2026, 10:24 AM(to be added)</span>
                  </div>
                </div>
              </div>

              <!-- Row 2 Left (6-col): Critical Info Card -->
              <div class="lg:col-span-6 bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div class="flex items-center justify-between border-b border-[#2a3347] pb-4">
                  <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-file-medical text-rose-500 text-sm"></i>
                    <h2 class="text-base font-bold text-white tracking-tight">Critical Info</h2>
                  </div>
                </div>

                <div class="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-1">
                  <div class="text-[10px] font-bold uppercase text-rose-400 tracking-wider">ILLNESS DETAILS</div>
                  <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {{ patient.illnessDetails || 'No critical illness details recorded.' }}
                  </p>
                </div>
              </div>

              <!-- Row 2 Right (6-col): Quick Actions Card -->
              <div class="lg:col-span-6 bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div class="flex items-center gap-2.5 border-b border-[#2a3347] pb-4">
                  <i class="fa-solid fa-bolt text-amber-400 text-sm"></i>
                  <h2 class="text-base font-bold text-white tracking-tight">Quick Actions</h2>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <!-- Action 1: Change Password -->
                  <a routerLink="/patient/change-password" 
                    class="bg-[#1b2333] hover:bg-[#253047] border border-[#2a3347] rounded-xl p-3.5 transition-all group flex flex-col justify-between space-y-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#5b6cf0]">
                      <i class="fa-solid fa-lock text-xs"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-white group-hover:text-[#5b6cf0] transition-colors flex items-center justify-between">
                        <span>Change Password</span>
                        <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                      <p class="text-[10px] text-[#9aa3b8] mt-0.5 line-clamp-1">Update your account password</p>
                    </div>
                  </a>

                  <!-- Action 2: Notification Settings -->
                  <div class="bg-[#1b2333] hover:bg-[#253047] border border-[#2a3347] rounded-xl p-3.5 transition-all group flex flex-col justify-between space-y-3 cursor-pointer">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <i class="fa-solid fa-bell text-xs"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                        <span>Notification</span>
                        <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                      <p class="text-[10px] text-[#9aa3b8] mt-0.5 line-clamp-1">Manage your preferences</p>
                    </div>
                  </div>

                  <!-- Action 3: Privacy Settings -->
                  <div class="bg-[#1b2333] hover:bg-[#253047] border border-[#2a3347] rounded-xl p-3.5 transition-all group flex flex-col justify-between space-y-3 cursor-pointer">
                    <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <i class="fa-solid fa-shield-halved text-xs"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                        <span>Privacy Settings</span>
                        <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                      <p class="text-[10px] text-[#9aa3b8] mt-0.5 line-clamp-1">Control your data & privacy</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- MEDICAL HISTORY TAB -->
          <div *ngIf="activeTab==='history'" class="animate-in fade-in duration-200 space-y-4">
            <app-empty-state
              *ngIf="(medicalHistory || []).length===0"
              icon="fa-solid fa-folder-open"
              message="No medical history records found."
            ></app-empty-state>
            
            <div class="grid gap-4" *ngIf="(medicalHistory || []).length > 0">
              <div *ngFor="let m of sortedHistory()" class="bg-[#151b2b] border border-[#2a3347] rounded-xl p-5 hover:border-[#5b6cf0]/50 transition-colors shadow-sm">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                   <div class="flex items-center gap-3">
                       <div class="w-10 h-10 rounded-full bg-[#5b6cf0]/10 border border-[#5b6cf0]/20 flex items-center justify-center text-[#5b6cf0]">
                           <i class="fa-solid fa-stethoscope"></i>
                       </div>
                       <div>
                           <div class="font-bold text-white text-sm">Visit Date: {{ m.visitDate | date:'mediumDate' }}</div>
                           <div class="text-xs text-[#9aa3b8]">Record ID: #{{ m.id }}</div>
                       </div>
                   </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6 text-xs sm:text-sm">
                   <div class="space-y-3">
                       <div><span class="block text-[10px] font-bold uppercase text-[#9aa3b8] mb-1">Diagnosis</span> <span class="text-white font-medium">{{ m.diagnosis || '—' }}</span></div>
                       <div><span class="block text-[10px] font-bold uppercase text-[#9aa3b8] mb-1">Symptoms</span> <span class="text-slate-300">{{ m.symptoms || '—' }}</span></div>
                       <div><span class="block text-[10px] font-bold uppercase text-[#9aa3b8] mb-1">Treatment</span> <span class="text-slate-300">{{ m.treatment || '—' }}</span></div>
                   </div>
                   <div class="space-y-3">
                       <div><span class="block text-[10px] font-bold uppercase text-[#9aa3b8] mb-1">Medicine</span> <span class="text-emerald-400 font-mono">{{ m.medicine || '—' }}</span></div>
                       <div><span class="block text-[10px] font-bold uppercase text-[#9aa3b8] mb-1">Doses</span> <span class="text-slate-300">{{ m.doses || '—' }}</span></div>
                       <div><span class="block text-[10px] font-bold uppercase text-[#9aa3b8] mb-1">Notes</span> <span class="text-[#9aa3b8] italic">{{ m.notes || '—' }}</span></div>
                   </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>

    <!-- Loading Skeleton -->
    <ng-template #loading>
      <div class="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 animate-pulse">
        <div class="bg-[#151b2b] rounded-2xl p-6 border border-[#2a3347] h-40"></div>
        <div class="bg-[#151b2b] rounded-2xl p-6 border border-[#2a3347] h-96"></div>
      </div>
    </ng-template>
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

  formatDateOfBirth(dob?: string | Date): string {
    if (!dob) return 'Oct 12, 2010 (15 years)';
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return String(dob);
      const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const age = new Date().getFullYear() - d.getFullYear();
      return `${dateFormatted} (${age} years)`;
    } catch {
      return String(dob);
    }
  }

  onImageError() {
    if (this.patient) this.patient.profileImageUrl = '';
  }
}
