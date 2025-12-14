import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalHistoryItem } from '../core/services/patient-profile.service';

@Component({
  selector: 'app-medical-history-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="panel rounded-2xl shadow-2xl w-full max-w-xl border border-gray-700/50 flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between p-5 border-b border-gray-700/50">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
               <i class="fa-solid fa-file-medical text-xl"></i>
             </div>
             <h3 class="font-bold text-lg text-gray-100">Medical History Detail</h3>
          </div>
          <button class="btn-secondary text-sm py-1.5 px-3" (click)="close.emit()">
             <i class="fa-solid fa-xmark mr-1"></i> Close
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto custom-scrollbar" *ngIf="detail && doctorInfo; else loading">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-6">
              <div>
                 <h4 class="font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <i class="fa-regular fa-calendar-check text-blue-400"></i> Visit Information
                 </h4>
                 <div class="space-y-3 pl-2 border-l-2 border-gray-800">
                    <div>
                       <div class="text-xs text-gray-500 uppercase tracking-wider">Date</div>
                       <div class="text-gray-200">{{ detail.visitDate | date:'mediumDate' }}</div>
                    </div>
                    <div>
                       <div class="text-xs text-gray-500 uppercase tracking-wider">Symptoms</div>
                       <div class="text-gray-200">{{ detail.symptoms || '—' }}</div>
                    </div>
                    <div>
                       <div class="text-xs text-gray-500 uppercase tracking-wider">Diagnosis</div>
                       <div class="text-gray-200 font-medium text-emerald-300">{{ detail.diagnosis || '—' }}</div>
                    </div>
                 </div>
              </div>

              <div>
                 <h4 class="font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-user-doctor text-blue-400"></i> Doctor Details
                 </h4>
                 <div class="bg-gray-800/40 rounded-lg p-3 text-sm space-y-1">
                    <div class="font-medium text-white">{{ doctorInfo.doctorName }}</div>
                    <div class="text-gray-400">{{ doctorInfo.doctorSpecialization || 'General Practice' }}</div>
                    <div class="text-gray-500 text-xs">{{ doctorInfo.doctorContactInfo || 'No contact info' }}</div>
                 </div>
              </div>
            </div>

            <div class="space-y-6">
               <div>
                 <h4 class="font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-prescription-bottle-medical text-blue-400"></i> Prescription
                 </h4>
                 <div class="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10 space-y-4">
                    <div>
                        <div class="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Medicines</div>
                        <div class="text-gray-200 font-medium">{{ detail.medicine || '—' }}</div>
                    </div>
                     <div>
                        <div class="text-xs text-blue-300/70 uppercase tracking-wider mb-1">Dosage</div>
                        <div class="text-gray-200">{{ detail.doses || '—' }}</div>
                    </div>
                 </div>
               </div>
               
               <div *ngIf="detail.notes">
                  <h4 class="font-semibold text-gray-300 mb-2">Doctor's Notes</h4>
                  <div class="text-gray-400 text-sm italic bg-gray-900/50 p-3 rounded border border-gray-800">
                     "{{ detail.notes }}"
                  </div>
               </div>
            </div>
          </div>
        </div>
        <ng-template #loading>
          <div class="p-12 flex flex-col items-center justify-center">
             <span class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></span>
             <span class="text-gray-400">Loading details...</span>
          </div>
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