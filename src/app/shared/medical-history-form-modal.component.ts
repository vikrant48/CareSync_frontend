import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-medical-history-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-gray-900 w-full max-w-xl rounded shadow-lg">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="font-semibold">Create Medical Description</h3>
          <button class="btn-secondary" (click)="close.emit()">Close</button>
        </div>
        <div class="p-4">
          <form class="space-y-2" (ngSubmit)="submit.emit()">
            <input type="date" class="input w-full" [(ngModel)]="form.visitDate" name="visitDate" />
            <input type="text" class="input w-full" placeholder="Symptoms" [(ngModel)]="form.symptoms" name="symptoms" />
            <input type="text" class="input w-full" placeholder="Diagnosis" [(ngModel)]="form.diagnosis" name="diagnosis" />
            <input type="text" class="input w-full" placeholder="Treatment" [(ngModel)]="form.treatment" name="treatment" />
            <input type="text" class="input w-full" placeholder="Medicine" [(ngModel)]="form.medicine" name="medicine" />
            <input type="text" class="input w-full" placeholder="Doses" [(ngModel)]="form.doses" name="doses" />
            <textarea class="input w-full" rows="3" placeholder="Notes" [(ngModel)]="form.notes" name="notes"></textarea>
            <div class="text-xs text-gray-400 mb-1" *ngIf="infoText">
              {{ infoText }}
            </div>
            <button
              class="btn-primary w-full"
              type="submit"
              [disabled]="disabled || saving"
            >
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
            <div class="text-green-500 text-sm mt-2" *ngIf="saved">Medical history saved successfully.</div>
            <div class="text-red-500 text-sm mt-2" *ngIf="error">{{ error }}</div>
          </form>
        </div>
      </div>
    </div>
  `,
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
}