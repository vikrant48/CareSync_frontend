import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
                      <input type="date" class="input-modern" [(ngModel)]="form.visitDate" name="visitDate" />
                   </div>
                    <div class="form-group">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</label>
                      <input type="text" class="input-modern" placeholder="e.g. Acute Bronchitis" [(ngModel)]="form.diagnosis" name="diagnosis" />
                   </div>
                </div>

                <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms</label>
                   <input type="text" class="input-modern" placeholder="e.g. Cough, fever, difficulty breathing..." [(ngModel)]="form.symptoms" name="symptoms" />
                </div>

                <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Treatment Plan</label>
                   <input type="text" class="input-modern" placeholder="e.g. Rest, hydration, antibiotics" [(ngModel)]="form.treatment" name="treatment" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div class="form-group">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medication</label>
                      <input type="text" class="input-modern" placeholder="e.g. Amoxicillin" [(ngModel)]="form.medicine" name="medicine" />
                   </div>
                   <div class="form-group">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dosage</label>
                      <input type="text" class="input-modern" placeholder="e.g. 500mg, 3 times daily" [(ngModel)]="form.doses" name="doses" />
                   </div>
                </div>

                <div class="form-group">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clinical Notes</label>
                   <textarea class="input-modern min-h-[100px]" rows="3" placeholder="Additional observations or patient instructions..." [(ngModel)]="form.notes" name="notes"></textarea>
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

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.disabled || this.saving) {
      return;
    }
    this.submit.emit();
  }
}