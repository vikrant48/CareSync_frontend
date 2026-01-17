import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService } from '../core/services/ai-assistant.service';
import { ClinicalMatch, DiagnosisSuggestionDto } from '../core/models/ai.models';

@Component({
   selector: 'app-medical-history-form-modal',
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
               <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <i class="fa-solid fa-file-medical-alt text-lg"></i>
               </div>
               <h3 class="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">Medical Record</h3>
            </div>
            <button (click)="close.emit()" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
             <form (ngSubmit)="onSubmit($event)" class="space-y-5">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div class="form-group">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visit Date</label>
                      <input type="date" class="input-modern" [(ngModel)]="form.visitDate" name="visitDate" [disabled]="disabled" />
                   </div>
                    <div class="form-group">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</label>
                      <input type="text" class="input-modern" placeholder="e.g. Acute Bronchitis" [(ngModel)]="form.diagnosis" name="diagnosis" [disabled]="disabled" />
                   </div>
                </div>

                <div class="form-group">
                   <div class="flex items-center justify-between mb-1">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Symptoms</label>
                      <button type="button" 
                              (click)="onSuggest()" 
                              [disabled]="disabled || loadingSuggestions || !form.symptoms"
                              class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                              title="Get AI Suggestions">
                         <i class="fa-solid fa-wand-magic-sparkles" [class.animate-pulse]="loadingSuggestions"></i>
                         AI Suggest
                      </button>
                   </div>
                   <input type="text" class="input-modern" placeholder="e.g. Cough, fever, difficulty breathing..." [(ngModel)]="form.symptoms" name="symptoms" [disabled]="disabled" />
                </div>

                <!-- AI Suggestions Area -->
                <div *ngIf="clinicalSuggestions.length > 0" class="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div class="flex items-center justify-between mb-3">
                      <h4 class="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                         <i class="fa-solid fa-robot"></i> AI Clinical Suggestions
                      </h4>
                      <button (click)="clinicalSuggestions = []" class="text-gray-400 hover:text-gray-600 text-xs">Clear</button>
                   </div>
                   <div class="space-y-3">
                      <div *ngFor="let s of clinicalSuggestions" 
                           (click)="applySuggestion(s)"
                           class="group bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-100 dark:border-indigo-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all shadow-sm hover:shadow-md">
                         <div class="flex justify-between items-start mb-1">
                            <div class="font-bold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">{{ s.diagnosis }}</div>
                            <i class="fa-solid fa-plus-circle text-indigo-300 group-hover:text-indigo-600"></i>
                         </div>
                         <div class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            <strong>Treatment:</strong> {{ s.treatment }} 
                            <span *ngIf="s.medicine">| <strong>Rx:</strong> {{ s.medicine }} ({{ s.dosage }})</span>
                         </div>
                         <div class="mt-2 text-[9px] italic text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">Click to auto-fill record</div>
                      </div>
                   </div>
                </div>

                <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Treatment Plan</label>
                   <input type="text" class="input-modern" placeholder="e.g. Rest, hydration, antibiotics" [(ngModel)]="form.treatment" name="treatment" [disabled]="disabled" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div class="form-group">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medication</label>
                      <input type="text" class="input-modern" placeholder="e.g. Amoxicillin" [(ngModel)]="form.medicine" name="medicine" [disabled]="disabled" />
                   </div>
                   <div class="form-group">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dosage</label>
                      <input type="text" class="input-modern" placeholder="e.g. 500mg, 3 times daily" [(ngModel)]="form.doses" name="doses" [disabled]="disabled" />
                   </div>
                </div>

                <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clinical Notes</label>
                   <textarea class="input-modern min-h-[100px]" rows="3" placeholder="Additional observations or patient instructions..." [(ngModel)]="form.notes" name="notes" [disabled]="disabled"></textarea>
                </div>

                <div class="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg flex gap-2 items-start" *ngIf="infoText">
                   <i class="fa-solid fa-circle-info mt-0.5"></i>
                   <span>{{ infoText }}</span>
                </div>

                <!-- Messages -->
                <div class="text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-lg text-sm flex items-center gap-2" *ngIf="saved">
                   <i class="fa-solid fa-circle-check"></i> Medical history saved successfully.
                </div>
                <div class="text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2" *ngIf="error">
                   <i class="fa-solid fa-circle-exclamation"></i> {{ error }}
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <button type="button" (click)="close.emit()" class="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Cancel
                   </button>
                   <button type="submit" [disabled]="disabled || saving" class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed">
                      <span *ngIf="!saving"><i class="fa-solid fa-save mr-2"></i> Save Record</span>
                      <span *ngIf="saving"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Saving...</span>
                   </button>
                </div>

             </form>
          </div>
        </div>
      </div>
    </div>
  `,
   styles: [`
    .input-modern {
      @apply block w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400;
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
export class MedicalHistoryFormModalComponent {
   @Input() open = false;
   @Input() form: any = {};
   @Input() disabled = false;
   @Input() saving = false;
   @Input() saved = false;
   @Input() error: string | null = null;
   @Input() infoText: string | null = null;
   @Output() close = new EventEmitter<void>();
   @Output() submit = new EventEmitter<void>();

   private aiService = inject(AiAssistantService);

   loadingSuggestions = false;
   clinicalSuggestions: ClinicalMatch[] = [];

   onSuggest() {
      if (!this.form.symptoms) return;

      this.loadingSuggestions = true;
      this.aiService.suggestDiagnosis(this.form.symptoms).subscribe({
         next: (res: DiagnosisSuggestionDto) => {
            this.loadingSuggestions = false;
            this.clinicalSuggestions = res.suggestions || [];
         },
         error: () => {
            this.loadingSuggestions = false;
            this.clinicalSuggestions = [];
         }
      });
   }

   applySuggestion(s: ClinicalMatch) {
      this.form.diagnosis = s.diagnosis;
      this.form.treatment = s.treatment;
      this.form.medicine = s.medicine;
      this.form.doses = s.dosage;
      this.form.notes = (this.form.notes || '') + (this.form.notes ? '\n\n' : '') + 'AI Reasoning: ' + s.reasoning;
      this.clinicalSuggestions = [];
   }

   onSubmit(event: Event) {
      event.preventDefault();
      if (this.disabled || this.saving) {
         return;
      }
      this.submit.emit();
   }
}