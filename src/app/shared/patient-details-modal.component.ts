import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientDto, MedicalHistoryWithDoctorItem } from '../core/services/patient-profile.service';

@Component({
  selector: 'app-patient-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" (click)="close.emit()"></div>

      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        
        <!-- Modal Panel -->
        <div class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
          
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div class="flex items-center gap-3">
               <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl shadow-inner">
                  {{ patient?.firstName?.charAt(0) || 'P' }}
               </div>
               <div>
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">
                     {{ patient ? (patient.firstName + ' ' + patient.lastName) : 'Patient Details' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                     <i class="fa-solid fa-id-card-clip"></i> Patient Profile
                  </p>
               </div>
            </div>
            <button (click)="close.emit()" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="flex flex-col h-[60vh] sm:h-auto">
            
            <!-- Tabs -->
            <div class="px-6 pt-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div class="flex gap-6">
                <button class="tab-btn group" [class.active]="activeTab === 'overview'" (click)="activeTab='overview'">
                   <i class="fa-solid fa-circle-info mr-2 group-hover:scale-110 transition-transform"></i> Overview
                </button>
                <button class="tab-btn group" [class.active]="activeTab === 'history'" (click)="activeTab='history'">
                   <i class="fa-solid fa-file-medical mr-2 group-hover:scale-110 transition-transform"></i> Medical History
                </button>
              </div>
            </div>

            <div class="p-6 overflow-y-auto custom-scrollbar flex-1" *ngIf="patient; else loadingPatient">
              
              <!-- Overview Tab -->
              <div *ngIf="activeTab === 'overview'" class="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                 
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="info-card">
                       <div class="label"><i class="fa-solid fa-user text-blue-500 mr-2"></i> Full Name</div>
                       <div class="value">{{ patient.firstName }} {{ patient.lastName }}</div>
                    </div>
                    <div class="info-card">
                       <div class="label"><i class="fa-solid fa-cake-candles text-pink-500 mr-2"></i> Age</div>
                       <div class="value">{{ ageFromDob(patient.dateOfBirth) }} years</div>
                    </div>
                    <div class="info-card">
                       <div class="label"><i class="fa-solid fa-envelope text-orange-500 mr-2"></i> Email</div>
                       <div class="value truncate" title="{{ patient.email }}">{{ patient.email || '—' }}</div>
                    </div>
                    <div class="info-card">
                       <div class="label"><i class="fa-solid fa-phone text-green-500 mr-2"></i> Contact</div>
                       <div class="value">{{ patient.contactInfo || '—' }}</div>
                    </div>
                    <div class="info-card md:col-span-2">
                       <div class="label"><i class="fa-solid fa-calendar-day text-purple-500 mr-2"></i> Date of Birth</div>
                       <div class="value">{{ formatDate(patient.dateOfBirth) }}</div>
                    </div>
                 </div>

              </div>

              <!-- Medical History Tab -->
              <div *ngIf="activeTab === 'history'" class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                
                <div *ngFor="let h of sortedHistory(); trackBy: trackHistory" 
                     class="group relative bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all cursor-pointer"
                     (click)="historyClick.emit(h)">
                    
                    <div class="flex justify-between items-start mb-2">
                       <div class="flex items-center gap-2">
                          <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-md font-medium">
                             {{ formatDate(h.visitDate) }}
                          </span>
                       </div>
                       <i class="fa-solid fa-chevron-right text-gray-300 group-hover:text-blue-500 transition-colors"></i>
                    </div>

                    <h4 class="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                       <i class="fa-solid fa-stethoscope text-gray-400"></i> {{ h.diagnosis || 'No Diagnosis Recorded' }}
                    </h4>
                    
                    <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600 border-dashed">
                       <div class="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs">
                          <i class="fa-solid fa-user-doctor"></i>
                       </div>
                       <span>Dr. {{ h.doctorName || 'Unknown' }}</span>
                       <span *ngIf="h.doctorSpecialization" class="text-xs bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                          {{ h.doctorSpecialization }}
                       </span>
                    </div>

                </div>

                <div *ngIf="(sortedHistory() || []).length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
                   <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                      <i class="fa-solid fa-notes-medical text-2xl"></i>
                   </div>
                   <p>No medical history records found.</p>
                </div>

              </div>

            </div>

             <ng-template #loadingPatient>
              <div class="p-12 flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500"></i>
                <p class="text-gray-500 font-medium">Loading patient details...</p>
              </div>
            </ng-template>

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
             <button (click)="close.emit()" class="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors shadow-sm">
                Close
             </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-btn {
      @apply relative py-4 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-700 dark:hover:text-gray-300 transition-colors outline-none;
    }
    .tab-btn.active {
      @apply text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400;
    }
    .info-card {
      @apply bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50;
    }
    .info-card .label {
      @apply text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center;
    }
    .info-card .value {
      @apply text-gray-900 dark:text-white font-medium text-lg break-words;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      @apply bg-gray-300 dark:bg-gray-600 rounded-full;
    }
  `]
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