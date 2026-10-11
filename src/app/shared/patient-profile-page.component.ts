import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDto, MedicalHistoryItem } from '../core/services/patient-profile.service';
import { RouterModule } from '@angular/router';
import { PatientProfileHistoryComponent } from './patient-profile-history.component';

export interface AppointmentCounts {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

@Component({
  selector: 'app-patient-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PatientProfileHistoryComponent],
  template: `
    <div class="max-w-[1400px] mx-auto p-3 sm:p-5 space-y-4" *ngIf="patient; else loading">
      
      <!-- Top Hero Header Card -->
      <section class="relative overflow-hidden bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        
        <!-- Left: Identity & Profile Strength -->
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full lg:w-auto text-center sm:text-left">
          
          <!-- Avatar with Camera Overlay & Active Dot -->
          <div class="relative shrink-0">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--bg)] border-4 border-[var(--border)] shadow-xl overflow-hidden flex items-center justify-center text-[var(--text)] text-2xl font-bold">
              <img *ngIf="patient.profileImageUrl; else initials" [src]="patient.profileImageUrl" class="w-full h-full object-cover transition-transform hover:scale-110 duration-500" (error)="onImageError()" />
              <ng-template #initials>
                <span>{{ initialsFromName(patient) }}</span>
              </ng-template>
            </div>
            
            <!-- Active Status Indicator -->
            <div class="absolute bottom-1 left-1 w-4 h-4 bg-emerald-500 border-2 border-[var(--panel)] rounded-full" title="Active"></div>
          </div>
          
          <!-- Identity Details & Strength Bar -->
          <div class="space-y-1.5 flex-1 min-w-0">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight truncate">{{ fullName(patient) }}</h1>
            
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
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

        <!-- Right: 4 Appointment Stat KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          <!-- TOTAL -->
          <div class="bg-[var(--bg)] border border-[var(--border)] p-3 sm:p-4 rounded-xl text-center shadow-sm min-w-[85px]">
            <div class="text-[9px] sm:text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">Appointments</div>
            <div class="text-lg sm:text-xl font-extrabold text-[var(--text)] mt-0.5">{{ appointmentCounts?.total ?? 0 }}</div>
          </div>

          <!-- DONE -->
          <div class="bg-emerald-500/10 border border-emerald-500/20 p-3 sm:p-4 rounded-xl text-center shadow-sm min-w-[85px]">
            <div class="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <i class="fa-solid fa-circle-check text-[8px]"></i> DONE
            </div>
            <div class="text-lg sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{{ appointmentCounts?.completed ?? 0 }}</div>
          </div>

          <!-- UPCOMING -->
          <div class="bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 rounded-xl text-center shadow-sm min-w-[85px]">
            <div class="text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <i class="fa-solid fa-clock text-[8px]"></i> UPCOMING
            </div>
            <div class="text-lg sm:text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">{{ appointmentCounts?.upcoming ?? 0 }}</div>
          </div>

          <!-- CANCELLED -->
          <div class="bg-rose-500/10 border border-rose-500/20 p-3 sm:p-4 rounded-xl text-center shadow-sm min-w-[85px]">
            <div class="text-[9px] sm:text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <i class="fa-solid fa-circle-xmark text-[8px]"></i> CANCELLED
            </div>
            <div class="text-lg sm:text-xl font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">{{ appointmentCounts?.cancelled ?? 0 }}</div>
          </div>
        </div>
      </section>

      <!-- Main Navigation Tabs -->
      <section class="bg-[var(--panel)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        
        <!-- Tab Headers -->
        <div class="flex items-center justify-between border-b border-[var(--border)] px-4 sm:px-6 pt-2 pb-2 sm:pb-0 gap-3">
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
            <button (click)="activeTab='overview'"
              [ngClass]="activeTab === 'overview' 
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold' 
                : 'text-[var(--muted)] hover:text-[var(--text)] font-semibold'"
              class="px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap outline-none flex items-center gap-2">
              <i class="fa-solid fa-user text-xs"></i>
              <span>Overview</span>
            </button>

            <button (click)="activeTab='history'"
              [ngClass]="activeTab === 'history' 
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold' 
                : 'text-[var(--muted)] hover:text-[var(--text)] font-semibold'"
              class="px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap outline-none flex items-center gap-2">
              <i class="fa-solid fa-notes-medical text-xs"></i>
              <span>Medical History</span>
            </button>

            <a routerLink="/patient/appointments"
              class="px-4 py-3 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors whitespace-nowrap flex items-center gap-2">
              <i class="fa-solid fa-calendar-days text-xs"></i>
              <span>Appointments</span>
            </a>

            <a routerLink="/patient/lab-bookings"
              class="px-4 py-3 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors whitespace-nowrap flex items-center gap-2">
              <i class="fa-solid fa-flask text-xs"></i>
              <span>Lab Tests</span>
            </a>
          </div>

          <!-- Edit Button in Tab Bar: Only visible when activeTab === 'overview' -->
          <a *ngIf="activeTab === 'overview'" routerLink="/patient/profile/edit" 
            class="shrink-0 bg-[var(--primary)] hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2 sm:mb-2 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
            <span>Edit</span>
          </a>
        </div>

        <!-- Tab Body Content -->
        <div class="p-6 sm:p-8 min-h-[400px]">
          
          <!-- OVERVIEW TAB -->
          <div *ngIf="activeTab==='overview'" class="animate-in fade-in duration-200 space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <!-- Left 6-col: Personal Details Card -->
              <div class="lg:col-span-6 bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div class="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-user text-[var(--primary)] text-sm"></i>
                    <h2 class="text-base font-bold text-[var(--text)] tracking-tight">Personal Details</h2>
                  </div>
                </div>

                <div class="space-y-3.5 text-xs sm:text-sm">
                  <div class="flex justify-between border-b border-[var(--border)]/60 pb-2.5">
                    <span class="text-[var(--muted)]">Full Name</span>
                    <span class="font-bold text-[var(--text)]">{{ fullName(patient) }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[var(--border)]/60 pb-2.5">
                    <span class="text-[var(--muted)]">Email</span>
                    <span class="font-bold text-[var(--text)]">{{ patient.email || 'NA' }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[var(--border)]/60 pb-2.5">
                    <span class="text-[var(--muted)]">Date of Birth</span>
                    <span class="font-bold text-[var(--text)]">{{ formatDateOfBirth(patient.dateOfBirth) }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[var(--border)]/60 pb-2.5">
                    <span class="text-[var(--muted)]">Gender</span>
                    <span class="font-bold text-[var(--text)]">{{ patient.gender || 'NA' }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[var(--border)]/60 pb-2.5">
                    <span class="text-[var(--muted)]">Blood Group</span>
                    <span class="font-bold text-[var(--text)]">{{ patient.bloodGroup || 'NA' }}</span>
                  </div>

                  <div class="flex justify-between border-b border-[var(--border)]/60 pb-2.5">
                    <span class="text-[var(--muted)]">Contact Number</span>
                    <span class="font-bold text-[var(--text)] font-mono">{{ patient.contactInfo || 'NA' }}</span>
                  </div>
                </div>
              </div>

              <!-- Right 6-col: Account Status Card -->
              <div class="lg:col-span-6 bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
                <div class="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-shield-halved text-emerald-700 dark:text-emerald-400 text-sm"></i>
                    <h2 class="text-base font-bold text-[var(--text)] tracking-tight">Account Status</h2>
                  </div>
                  <span class="border text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                        [ngClass]="patient.isActive === false
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'">
                    <i class="fa-solid text-[10px]" [ngClass]="patient.isActive === false ? 'fa-circle-xmark' : 'fa-circle-check'"></i>
                    <span>{{ accountStatus(patient) }}</span>
                  </span>
                </div>

                            <!-- Profile Strength Progress Bar -->
            <div class="w-full sm:w-64 pt-2">
              <div class="flex justify-between items-center text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
                <span>PROFILE STRENGTH</span>
                <span class="text-[var(--primary)] font-mono">{{ patient.completionPercentage }}%</span>
              </div>
              <div class="w-full bg-[var(--bg)] border border-[var(--border)] rounded-full h-2 overflow-hidden">
                <div class="bg-[var(--primary)] h-full rounded-full transition-all duration-1000" [style.width.%]="patient.completionPercentage"></div>
              </div>
            </div>

                <div class="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 space-y-3.5 text-xs sm:text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-[var(--muted)]">Username</span>
                    <span class="font-mono text-xs bg-[var(--bg)] px-2.5 py-1 rounded border border-[var(--border)] text-[var(--text)]">
                      {{ patient.username || 'username' }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-[var(--muted)]">Email Preference</span>
                    <span class="font-medium text-[var(--text)]">{{ patient.email || 'Not provided' }}</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-[var(--muted)]">Account Status</span>
                    <span class="border text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                          [ngClass]="patient.isActive === false
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'">
                      {{ accountStatus(patient) }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-[var(--muted)]">Member Since</span>
                    <span class="font-medium text-[var(--text)]">{{ formatDateTime(patient.createdAt, false) }}</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-[var(--muted)]">Last Login</span>
                    <span class="font-medium text-[var(--text)]">{{ formatDateTime(patient.lastLogin, true) }}</span>
                  </div>
                </div>
              </div>

              <!-- Row 2 Left (6-col): Critical Info Card -->
              <div class="lg:col-span-6 bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div class="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-file-medical text-rose-500 text-sm"></i>
                    <h2 class="text-base font-bold text-[var(--text)] tracking-tight">Critical Info</h2>
                  </div>
                </div>

                <div class="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-1">
                  <div class="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 tracking-wider">ILLNESS DETAILS</div>
                  <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {{ patient.illnessDetails || 'No critical illness details recorded.' }}
                  </p>
                </div>
              </div>

              <!-- Row 2 Right (6-col): Quick Actions Card -->
              <div class="lg:col-span-6 bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div class="flex items-center gap-2.5 border-b border-[var(--border)] pb-4">
                  <i class="fa-solid fa-bolt text-amber-700 dark:text-amber-400 text-sm"></i>
                  <h2 class="text-base font-bold text-[var(--text)] tracking-tight">Quick Actions</h2>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <!-- Action 1: Change Password -->
                  <a routerLink="/patient/change-password" 
                    class="bg-[var(--bg)] hover:bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 transition-all group flex flex-col justify-between space-y-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[var(--primary)]">
                      <i class="fa-solid fa-lock text-xs"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-between">
                        <span>Change Password</span>
                        <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                      <p class="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">Update your account password</p>
                    </div>
                  </a>

                  <!-- Action 2: Notification Settings -->
                  <div class="bg-[var(--bg)] hover:bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 transition-all group flex flex-col justify-between space-y-3 cursor-pointer">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <i class="fa-solid fa-bell text-xs"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[var(--text)] group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                        <span>Notification</span>
                        <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                      <p class="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">Manage your preferences</p>
                    </div>
                  </div>

                  <!-- Action 3: Privacy Settings -->
                  <div class="bg-[var(--bg)] hover:bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 transition-all group flex flex-col justify-between space-y-3 cursor-pointer">
                    <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                      <i class="fa-solid fa-shield-halved text-xs"></i>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[var(--text)] group-hover:text-emerald-700 dark:text-emerald-400 transition-colors flex items-center justify-between">
                        <span>Privacy Settings</span>
                        <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                      <p class="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">Control your data & privacy</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- MEDICAL HISTORY TAB -->
          <div *ngIf="activeTab==='history'" class="animate-in fade-in duration-200">
            <app-patient-profile-history [medicalHistory]="medicalHistory"></app-patient-profile-history>
          </div>

        </div>
      </section>
    </div>

    <!-- Loading Skeleton -->
    <ng-template #loading>
      <div class="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 animate-pulse">
        <div class="bg-[var(--panel)] rounded-2xl p-6 border border-[var(--border)] h-40"></div>
        <div class="bg-[var(--panel)] rounded-2xl p-6 border border-[var(--border)] h-96"></div>
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
    if (!dob) return 'Not provided';
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return String(dob);
      const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
      return `${dateFormatted} (${age} years)`;
    } catch {
      return String(dob);
    }
  }

  accountStatus(patient: PatientDto): string {
    return patient.isActive === false ? 'Inactive' : 'Active';
  }

  formatDateTime(value?: string, includeTime = false): string {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString('en-IN', includeTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onImageError() {
    if (this.patient) this.patient.profileImageUrl = '';
  }
}
