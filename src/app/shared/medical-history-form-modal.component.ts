import { ChangeDetectorRef, Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService } from '../core/services/ai-assistant.service';
import { ClinicalMatch, DiagnosisSuggestionDto, ClinicalDictationResponse } from '../core/models/ai.models';
import { DatePickerComponent } from './date-picker.component';
import { ClinicalDictationComponent } from './clinical-dictation.component';
import { ModalShellComponent } from './ui/modal-shell.component';
import { AppValidators } from './utils/validators';
import { parseMedicines } from './utils/medicines.util';
import { AbstractControl } from '@angular/forms';

export interface MedicationItem {
   medicine: string;
   doses: string;
}

@Component({
   selector: 'app-medical-history-form-modal',
   standalone: true,
   imports: [CommonModule, FormsModule, DatePickerComponent, ClinicalDictationComponent, ModalShellComponent],
   template: `
    <app-modal-shell
      [open]="open"
      [showHeader]="false"
      maxWidthClass="max-w-2xl"
      panelClass="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
      bodyClass="px-6 py-6"
      ariaLabel="Medical record"
      backdropClass="bg-gray-900/60"
      (close)="close.emit()"
    >
      <div modalHeader class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
         <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <i class="fa-solid fa-file-medical-alt text-lg" aria-hidden="true"></i>
            </div>
            <div>
               <h3 class="text-xl font-bold text-gray-900 dark:text-white leading-tight" id="modal-title">Medical Record</h3>
               <p class="text-xs text-gray-500 dark:text-gray-400">Patient consultation & prescription entry</p>
            </div>
         </div>
         
         <div class="flex items-center gap-2">
            <button type="button" 
                    (click)="isDictationOpen = true"
                    [disabled]="disabled"
                    class="btn-size-lg px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all transform active:scale-95 disabled:opacity-50">
               <i class="fa-solid fa-microphone-lines text-sm" aria-hidden="true"></i>
               <span class="hidden sm:inline">🎙️ AI Voice Dictation</span>
            </button>

            <button type="button" (click)="close.emit()" class="text-gray-700 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <i class="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
            </button>
         </div>
      </div>

      <form (ngSubmit)="onSubmit($event)" novalidate class="space-y-5">
         
         <!-- 1. Visit Date -->
         <div class="form-group min-h-[70px]">
            <app-date-picker
              [(ngModel)]="form.visitDate"
              name="visitDate"
              label="Visit Date *"
              placeholder="Select Date"
              [error]="fieldError('visitDate')"
              (ngModelChange)="markTouched('visitDate')"
              [disabled]="disabled">
            </app-date-picker>
         </div>

         <!-- 2. Symptoms & AI Suggest / Dictation -->
         <div class="form-group">
            <div class="flex items-center justify-between mb-1">
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="mh-symptoms">Symptoms / Patient Issues</label>
               <div class="flex items-center gap-3">
                 <button type="button" 
                         (click)="isDictationOpen = true"
                         [disabled]="disabled"
                         class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-blue-700 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                         title="Dictate Consultation Notes" aria-label="Dictate Consultation Notes">
                    <i class="fa-solid fa-microphone" aria-hidden="true"></i>
                    Voice Dictation
                 </button>
                 <button type="button" 
                         (click)="onSuggest()" 
                         [disabled]="disabled || loadingSuggestions || !form.symptoms"
                         class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                         title="Get AI Suggestions" aria-label="Get AI Suggestions">
                    <i class="fa-solid fa-wand-magic-sparkles" [class.animate-pulse]="loadingSuggestions" aria-hidden="true"></i>
                    AI Suggest
                 </button>
               </div>
            </div>
            <input type="text" class="input-modern" placeholder="e.g. Cough, fever, difficulty breathing..." [(ngModel)]="form.symptoms" name="symptoms" [disabled]="disabled" id="mh-symptoms" (blur)="markTouched('symptoms')" [attr.aria-invalid]="fieldError('symptoms') ? true : null" [attr.aria-describedby]="fieldError('symptoms') ? 'mh-symptoms-error' : null" [class.error]="!!fieldError('symptoms')" maxlength="500" />
            <p *ngIf="fieldError('symptoms')" id="mh-symptoms-error" role="alert" class="form-error">{{ fieldError('symptoms') }}</p>
         </div>

         <!-- 3. AI Suggestions Area -->
         <div *ngIf="clinicalSuggestions.length > 0" class="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div class="flex items-center justify-between mb-3">
               <h4 class="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <i class="fa-solid fa-robot" aria-hidden="true"></i> AI Clinical Suggestions
               </h4>
               <button type="button" (click)="clinicalSuggestions = []" class="text-gray-700 dark:text-gray-400 hover:text-gray-600 text-xs">Clear</button>
            </div>
            <div class="space-y-3">
               <div *ngFor="let s of clinicalSuggestions" 
                    (click)="applySuggestion(s)"
                    class="group bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-100 dark:border-indigo-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all shadow-sm hover:shadow-md">
                  <div class="flex justify-between items-start mb-1">
                     <div class="font-bold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">{{ s.diagnosis }}</div>
                     <i class="fa-solid fa-plus-circle text-indigo-600 dark:text-indigo-300 group-hover:text-indigo-600" aria-hidden="true"></i>
                  </div>
                  <div class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                     <strong>Treatment:</strong> {{ s.treatment }} 
                     <span *ngIf="s.medicine">| <strong>Rx:</strong> {{ s.medicine }} ({{ s.dosage }})</span>
                  </div>
                  <div class="mt-2 text-[9px] italic text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">Click to auto-fill record</div>
               </div>
            </div>
         </div>

         <!-- 4. Diagnosis -->
         <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="mh-diagnosis">Diagnosis <span class="text-rose-500" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>
            <input type="text" class="input-modern" placeholder="e.g. Acute Bronchitis" [(ngModel)]="form.diagnosis" name="diagnosis" [disabled]="disabled" id="mh-diagnosis" (blur)="markTouched('diagnosis')" [attr.aria-invalid]="fieldError('diagnosis') ? true : null" [attr.aria-describedby]="fieldError('diagnosis') ? 'mh-diagnosis-error' : null" [class.error]="!!fieldError('diagnosis')" maxlength="200" />
            <p *ngIf="fieldError('diagnosis')" id="mh-diagnosis-error" role="alert" class="form-error">{{ fieldError('diagnosis') }}</p>
         </div>

         <!-- 5. Treatment Plan -->
         <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="mh-treatment">Treatment Plan</label>
            <input type="text" class="input-modern" placeholder="e.g. Rest, hydration, antibiotics" [(ngModel)]="form.treatment" name="treatment" [disabled]="disabled" id="mh-treatment" (blur)="markTouched('treatment')" [attr.aria-invalid]="fieldError('treatment') ? true : null" [attr.aria-describedby]="fieldError('treatment') ? 'mh-treatment-error' : null" [class.error]="!!fieldError('treatment')" maxlength="500" />
            <p *ngIf="fieldError('treatment')" id="mh-treatment-error" role="alert" class="form-error">{{ fieldError('treatment') }}</p>
         </div>

         <!-- 6. Dynamic Medications List -->
         <div class="space-y-3">
            <div class="flex items-center justify-between">
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Medications & Dosages</label>
               <button type="button" 
                       (click)="addMedication()" 
                       [disabled]="disabled"
                       class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50">
                  <i class="fa-solid fa-plus text-xs" aria-hidden="true"></i> Add Medication
               </button>
            </div>

            <div *ngFor="let med of medicationList; let i = index" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-50/50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
               <div class="md:col-span-6">
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 md:hidden" [attr.for]="'mh-med-name-' + i">Medication Name</label>
                  <input [id]="'mh-med-name-' + i" type="text" class="input-modern" placeholder="e.g. Amoxicillin" [(ngModel)]="med.medicine" [name]="'medicine_' + i" [disabled]="disabled" (blur)="markTouched('med-' + i)" [attr.aria-invalid]="medError(i) ? true : null" [attr.aria-describedby]="medError(i) ? 'mh-med-error-' + i : null" />
               </div>
               <div class="md:col-span-5">
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 md:hidden" [attr.for]="'mh-med-dose-' + i">Dosage</label>
                  <input [id]="'mh-med-dose-' + i" type="text" class="input-modern" placeholder="e.g. 500mg, 3 times daily" [(ngModel)]="med.doses" [name]="'doses_' + i" [disabled]="disabled" (blur)="markTouched('med-' + i)" [attr.aria-invalid]="medError(i) ? true : null" [attr.aria-describedby]="medError(i) ? 'mh-med-error-' + i : null" />
               </div>
                  <p *ngIf="medError(i)" [id]="'mh-med-error-' + i" role="alert" class="form-error md:col-span-12">{{ medError(i) }}</p>
               <div class="md:col-span-1 flex items-center justify-center">
                  <button type="button" 
                          (click)="removeMedication(i)" 
                          *ngIf="medicationList.length > 1"
                          [disabled]="disabled"
                          class="w-9 h-9 flex items-center justify-center text-gray-700 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          title="Remove medication" aria-label="Remove medication">
                     <i class="fa-solid fa-trash-can text-sm" aria-hidden="true"></i>
                  </button>
               </div>
            </div>
         </div>

         <!-- 7. Clinical Notes -->
         <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="mh-notes">Clinical Notes</label>
            <textarea class="input-modern min-h-[100px]" rows="3" placeholder="Additional observations or patient instructions..." [(ngModel)]="form.notes" name="notes" [disabled]="disabled" id="mh-notes" (blur)="markTouched('notes')" [attr.aria-invalid]="fieldError('notes') ? true : null" [attr.aria-describedby]="fieldError('notes') ? 'mh-notes-error' : null" [class.error]="!!fieldError('notes')" maxlength="2000"></textarea>
            <p *ngIf="fieldError('notes')" id="mh-notes-error" role="alert" class="form-error">{{ fieldError('notes') }}</p>
         </div>

         <div class="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg flex gap-2 items-start" *ngIf="infoText">
            <i class="fa-solid fa-circle-info mt-0.5" aria-hidden="true"></i>
            <span>{{ infoText }}</span>
         </div>

         <!-- Messages -->
         <div class="text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-lg text-sm flex items-center gap-2" *ngIf="saved">
            <i class="fa-solid fa-circle-check" aria-hidden="true"></i> Medical history saved successfully.
         </div>
         <div class="text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2" *ngIf="error">
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> {{ error }}
         </div>

         <!-- Actions -->
         <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" (click)="close.emit()" class="btn-size-lg px-5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors inline-flex items-center justify-center">
               Cancel
            </button>
            <button type="submit" [disabled]="disabled || saving" class="btn-size-lg px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center">
               <span *ngIf="!saving"><i class="fa-solid fa-save mr-2" aria-hidden="true"></i> Save Record</span>
               <span *ngIf="saving"><i class="fa-solid fa-circle-notch fa-spin mr-2" aria-hidden="true"></i> Saving...</span>
            </button>
         </div>

      </form>
    </app-modal-shell>

    <!-- AI Voice Dictation Modal Popup -->
    <app-clinical-dictation
       *ngIf="open && isDictationOpen"
       (closeModal)="isDictationOpen = false"
       (dictationComplete)="onDictationComplete($event)">
    </app-clinical-dictation>
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
export class MedicalHistoryFormModalComponent implements OnChanges {
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
   // Hosted by OnPush pages (doctor dashboard, schedule): AI results request a check
   private cdr = inject(ChangeDetectorRef);

   loadingSuggestions = false;
   isDictationOpen = false;
   clinicalSuggestions: ClinicalMatch[] = [];
   clinicalDisclaimer?: string;
   medicationList: MedicationItem[] = [{ medicine: '', doses: '' }];

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['open']?.currentValue || changes['form']?.currentValue) {
         this.initMedicationList();
      }
      if (changes['open']?.currentValue) {
         this.touched.clear();
         this.submitAttempted = false;
      }
   }

   initMedicationList(): void {
      // One row per medicine (records store one medicine per line; older ones used "," or ";")
      const rows = parseMedicines(this.form?.medicine, this.form?.doses);
      this.medicationList = rows.length > 0
         ? rows.map(r => ({ medicine: r.name, doses: r.dosage || '' }))
         : [{ medicine: '', doses: String(this.form?.doses ?? '') }];
   }

   addMedication(): void {
      this.medicationList.push({ medicine: '', doses: '' });
   }

   removeMedication(index: number): void {
      if (this.medicationList.length > 1) {
         this.medicationList.splice(index, 1);
      } else {
         this.medicationList = [{ medicine: '', doses: '' }];
      }
   }

   onSuggest() {
      if (!this.form.symptoms) return;

      this.loadingSuggestions = true;
      this.aiService.suggestDiagnosis(this.form.symptoms).subscribe({
         next: (res: DiagnosisSuggestionDto) => {
            this.loadingSuggestions = false;
            this.clinicalSuggestions = res.suggestions || [];
            this.clinicalDisclaimer = res.disclaimer || 'Preliminary AI differential conditions only. Not a final diagnosis.';
            this.cdr.markForCheck();
         },
         error: () => {
            this.loadingSuggestions = false;
            this.clinicalSuggestions = [];
            this.clinicalDisclaimer = undefined;
            this.cdr.markForCheck();
         }
      });
   }

   applySuggestion(s: ClinicalMatch) {
      this.form.diagnosis = s.diagnosis;
      this.form.treatment = s.treatment;

      if (s.medicine || s.dosage) {
         const firstRow = this.medicationList[0];
         if (this.medicationList.length === 1 && (!firstRow || (!firstRow.medicine && !firstRow.doses))) {
            this.medicationList[0] = { medicine: s.medicine || '', doses: s.dosage || '' };
         } else {
            this.medicationList.push({ medicine: s.medicine || '', doses: s.dosage || '' });
         }
      }

      this.form.notes = (this.form.notes || '') + (this.form.notes ? '\n\n' : '') + 'AI Reasoning: ' + s.reasoning;
      this.clinicalSuggestions = [];
   }

   onDictationComplete(res: ClinicalDictationResponse): void {
      if (!res || !res.success) return;

      if (res.chiefComplaint) {
         this.form.symptoms = res.chiefComplaint;
      } else if (res.soapNote?.subjective) {
         this.form.symptoms = res.soapNote.subjective;
      }

      if (res.diagnosis) {
         this.form.diagnosis = res.diagnosis;
      } else if (res.soapNote?.assessment) {
         this.form.diagnosis = res.soapNote.assessment;
      }

      if (res.soapNote?.plan) {
         this.form.treatment = res.soapNote.plan;
      }

      if (res.prescriptions && res.prescriptions.length > 0) {
         this.medicationList = res.prescriptions.map(p => ({
            medicine: p.name || '',
            doses: `${p.dosage || ''} ${p.frequency || ''} ${p.duration || ''}`.trim()
         }));
      }

      let clinicalNotes = '';
      if (res.soapNote) {
         clinicalNotes += `[S] ${res.soapNote.subjective || '-'}\n[O] ${res.soapNote.objective || '-'}\n[A] ${res.soapNote.assessment || '-'}\n[P] ${res.soapNote.plan || '-'}`;
      }
      if (res.vitals) {
         clinicalNotes += `\n\nVitals: ${res.vitals}`;
      }
      if (res.labOrders && res.labOrders.length > 0) {
         clinicalNotes += `\n\nLab Orders: ${res.labOrders.join(', ')}`;
      }
      this.form.notes = clinicalNotes;
      this.isDictationOpen = false;
   }

   // ================= Inline validation =================
   private touched = new Set<string>();
   submitAttempted = false;

   markTouched(key: string) {
      this.touched.add(key);
   }

   private shows(key: string): boolean {
      return this.submitAttempted || this.touched.has(key);
   }

   fieldError(key: string): string {
      if (!this.shows(key)) return '';
      const f = this.form || {};
      const text = String(f[key] ?? '').trim();
      switch (key) {
         case 'visitDate':
            if (!f.visitDate) return 'Visit date is required.';
            return AppValidators.notInFuture()({ value: f.visitDate } as AbstractControl) ? "Visit date can't be in the future." : '';
         case 'diagnosis': return text ? '' : 'Diagnosis is required.';
         case 'symptoms': return text.length > 500 ? 'Keep this under 500 characters.' : '';
         case 'treatment': return text.length > 500 ? 'Keep this under 500 characters.' : '';
         case 'notes': return text.length > 2000 ? 'Keep this under 2000 characters.' : '';
         default: return '';
      }
   }

   /** Row-level message: a dose needs a medicine name. Commas are fine: rows are saved one per line. */
   medError(i: number): string {
      if (!this.shows('med-' + i)) return '';
      const m = this.medicationList[i];
      if (!m) return '';
      if (!m.medicine.trim() && m.doses.trim()) return 'Enter the medication name for this dosage.';
      return '';
   }

   private isValid(): boolean {
      this.submitAttempted = true;
      const fieldKeys = ['visitDate', 'symptoms', 'diagnosis', 'treatment', 'notes'];
      const firstField = fieldKeys.find((k) => this.fieldError(k));
      const firstMed = this.medicationList.findIndex((_, i) => this.medError(i));
      if (!firstField && firstMed < 0) return true;
      setTimeout(() => {
         const el = firstField ? document.getElementById(`mh-${firstField}`) : document.getElementById(`mh-med-name-${firstMed}`);
         el?.focus();
      });
      return false;
   }

   onSubmit(event: Event) {
      event.preventDefault();
      if (this.disabled || this.saving) {
         return;
      }
      if (!this.isValid()) return;
      const validMeds = this.medicationList.filter(m => m.medicine.trim() || m.doses.trim());
      // One medicine per line, its dose on the matching line (empty when not given)
      this.form.medicine = validMeds.map(m => m.medicine.trim()).join('\n');
      this.form.doses = validMeds.map(m => m.doses.trim()).join('\n');
      this.submit.emit();
   }
}
