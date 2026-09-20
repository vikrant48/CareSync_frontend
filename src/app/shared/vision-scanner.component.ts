import { Component, EventEmitter, Input, Output, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiAssistantService } from '../core/services/ai-assistant.service';
import { VisionScanResponse } from '../core/models/ai.models';

@Component({
    selector: 'app-vision-scanner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto">
      <div class="relative w-full max-w-3xl my-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh] transition-all">
        
        <!-- Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-between text-white shrink-0 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
              ✨
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold leading-tight tracking-wide">{{ modalTitle }}</h3>
              <p class="text-xs text-blue-100/90 font-medium">Powered by Gemini 1.5 Multimodal Vision AI</p>
            </div>
          </div>
          <button type="button" (click)="closeModal.emit()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>

        <!-- Body Scroll Area -->
        <div class="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          <!-- Upload Dropzone (When no result and not scanning) -->
          <div *ngIf="!scanResult() && !isScanning()" 
               (dragover)="onDragOver($event)" 
               (dragleave)="onDragLeave($event)" 
               (drop)="onDrop($event)"
               [ngClass]="{ 'border-blue-500 bg-blue-500/10': isDragging(), 'border-slate-700 bg-slate-800/40': !isDragging() }"
               class="relative border-2 border-dashed hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center transition-all hover:bg-slate-800/80 cursor-pointer group shadow-inner">
            
            <input type="file" (change)="onFileSelected($event)" accept="image/*,.pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />

            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-lg">
              <i class="fas fa-file-medical"></i>
            </div>
            <h4 class="text-base sm:text-lg font-bold text-slate-100 mb-1">Upload Medical Document or Prescription</h4>
            <p class="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Drag & drop or click to upload a photo of a doctor's prescription, lab test report, or clinical note.
            </p>

            <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-500/20 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all">
              <i class="fas fa-camera text-sm"></i> Select File to Scan
            </div>
          </div>

          <!-- Scanning Laser Animation -->
          <div *ngIf="isScanning()" class="relative rounded-2xl overflow-hidden bg-slate-950 p-8 text-center border border-slate-800 shadow-2xl">
            <div class="relative w-44 h-56 mx-auto mb-6 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
              <img *ngIf="previewUrl()" [src]="previewUrl()" alt="Medical Preview" class="w-full h-full object-cover opacity-60">
              <div *ngIf="!previewUrl()" class="w-full h-full flex items-center justify-center text-4xl text-slate-700">
                <i class="fas fa-file-medical-alt"></i>
              </div>

              <!-- Scanning Laser Beam -->
              <div class="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,1)] animate-pulse"
                   style="animation: scanLaser 2s ease-in-out infinite;"></div>
            </div>

            <div class="space-y-2">
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/30 animate-pulse">
                <i class="fas fa-microchip"></i> Gemini Vision AI Extracting Data...
              </div>
              <p class="text-xs sm:text-sm font-medium text-slate-300">Parsing handwriting, medications, dosages & lab metrics...</p>
            </div>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage()" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center gap-3">
            <i class="fas fa-exclamation-triangle text-lg text-rose-500"></i>
            <div>
              <p class="font-bold">Scan Error</p>
              <p class="text-xs opacity-90">{{ errorMessage() }}</p>
            </div>
          </div>

          <!-- Scan Results View -->
          <div *ngIf="scanResult() && scanResult()!.success" class="space-y-6">
            
            <!-- Metadata Header Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <div class="flex items-center gap-3">
                <span class="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm"
                      [ngClass]="{
                        'bg-purple-900/50 text-purple-300 border border-purple-700/50': scanResult()!.documentType === 'PRESCRIPTION',
                        'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50': scanResult()!.documentType === 'LAB_REPORT',
                        'bg-blue-900/50 text-blue-300 border border-blue-700/50': scanResult()!.documentType === 'MEDICAL_NOTE',
                        'bg-slate-800 text-slate-300 border border-slate-700': !scanResult()!.documentType || scanResult()!.documentType === 'UNKNOWN'
                      }">
                  <i class="fas mr-1" [ngClass]="{
                    'fa-prescription': scanResult()!.documentType === 'PRESCRIPTION',
                    'fa-vials': scanResult()!.documentType === 'LAB_REPORT',
                    'fa-notes-medical': scanResult()!.documentType === 'MEDICAL_NOTE',
                    'fa-file': !scanResult()!.documentType || scanResult()!.documentType === 'UNKNOWN'
                  }"></i> {{ scanResult()!.documentType || 'DOCUMENT' }}
                </span>

                <span *ngIf="scanResult()!.patientName" class="text-xs font-medium text-slate-300">
                  <i class="fas fa-user text-slate-500 mr-1"></i> Patient: <strong>{{ scanResult()!.patientName }}</strong>
                </span>

                <span *ngIf="scanResult()!.doctorName" class="text-xs font-medium text-slate-300">
                  <i class="fas fa-user-md text-slate-500 mr-1"></i> Doctor: <strong>{{ scanResult()!.doctorName }}</strong>
                </span>
              </div>

              <span *ngIf="scanResult()!.date" class="text-xs font-mono text-slate-400">
                <i class="far fa-calendar-alt mr-1"></i> {{ scanResult()!.date }}
              </span>
            </div>

            <!-- Executive Summary -->
            <div *ngIf="scanResult()!.rawSummary" class="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-xs leading-relaxed text-blue-200">
              <strong class="font-bold block mb-1 text-blue-300 text-sm">✨ AI Executive Summary:</strong>
              {{ scanResult()!.rawSummary }}
            </div>

            <!-- Warnings Alert Box -->
            <div *ngIf="scanResult()!.warnings && scanResult()!.warnings!.length > 0" class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <i class="fas fa-exclamation-circle text-amber-400"></i> Clinical Flags & Safety Notes:
              </div>
              <ul class="list-disc list-inside text-xs space-y-1 opacity-90">
                <li *ngFor="let w of scanResult()!.warnings">{{ w }}</li>
              </ul>
            </div>

            <!-- Extracted Medications Table -->
            <div *ngIf="scanResult()!.medications && scanResult()!.medications!.length > 0" class="space-y-3">
              <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <i class="fas fa-pills text-purple-400"></i> Extracted Medications ({{ scanResult()!.medications!.length }})
              </h5>
              <div class="overflow-x-auto rounded-2xl border border-slate-800 shadow-md">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-800/90 font-semibold text-slate-300">
                    <tr>
                      <th class="p-3">Medication</th>
                      <th class="p-3">Dosage</th>
                      <th class="p-3">Frequency</th>
                      <th class="p-3">Duration</th>
                      <th class="p-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 bg-slate-900/60">
                    <tr *ngFor="let med of scanResult()!.medications" class="hover:bg-slate-800/50">
                      <td class="p-3 font-bold text-purple-400">{{ med.name }}</td>
                      <td class="p-3 font-mono text-slate-300">{{ med.dosage || '-' }}</td>
                      <td class="p-3 text-slate-300">{{ med.frequency || '-' }}</td>
                      <td class="p-3 text-slate-300">{{ med.duration || '-' }}</td>
                      <td class="p-3 text-slate-400 italic">{{ med.instructions || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Extracted Lab Results Table -->
            <div *ngIf="scanResult()!.labResults && scanResult()!.labResults!.length > 0" class="space-y-3">
              <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <i class="fas fa-microscope text-emerald-400"></i> Extracted Lab Test Metrics ({{ scanResult()!.labResults!.length }})
              </h5>
              <div class="overflow-x-auto rounded-2xl border border-slate-800 shadow-md">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-800/90 font-semibold text-slate-300">
                    <tr>
                      <th class="p-3">Test Metric</th>
                      <th class="p-3">Result Value</th>
                      <th class="p-3">Reference Range</th>
                      <th class="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 bg-slate-900/60">
                    <tr *ngFor="let lab of scanResult()!.labResults" class="hover:bg-slate-800/50">
                      <td class="p-3 font-medium text-slate-200">{{ lab.testName }}</td>
                      <td class="p-3 font-bold font-mono text-slate-100">{{ lab.resultValue || '-' }}</td>
                      <td class="p-3 font-mono text-slate-400">{{ lab.referenceRange || '-' }}</td>
                      <td class="p-3">
                        <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase"
                              [ngClass]="{
                                'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50': lab.status === 'NORMAL',
                                'bg-rose-900/50 text-rose-300 border border-rose-700/50': lab.status === 'HIGH' || lab.status === 'ABNORMAL',
                                'bg-amber-900/50 text-amber-300 border border-amber-700/50': lab.status === 'LOW'
                              }">
                          {{ lab.status || 'NORMAL' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button type="button" *ngIf="scanResult()" (click)="resetScanner()" class="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
            <i class="fas fa-redo mr-1.5"></i> Scan Another
          </button>

          <div class="flex items-center gap-3 ml-auto">
            <button type="button" (click)="closeModal.emit()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              Close
            </button>
            <button type="button" *ngIf="scanResult() && scanResult()!.success" (click)="onConfirm()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all">
              <i class="fas fa-check mr-1.5"></i> Done & Import
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    @keyframes scanLaser {
      0% { top: 0%; }
      50% { top: 96%; }
      100% { top: 0%; }
    }
  `]
})
export class VisionScannerComponent {
    @Input() modalTitle: string = 'Vision AI Prescription & Lab Scanner';
    @Output() closeModal = new EventEmitter<void>();
    @Output() scanComplete = new EventEmitter<VisionScanResponse>();

    private aiService = inject(AiAssistantService);
    private cdr = inject(ChangeDetectorRef);

    isDragging = signal(false);
    isScanning = signal(false);
    errorMessage = signal<string | null>(null);
    scanResult = signal<VisionScanResponse | null>(null);
    previewUrl = signal<string | null>(null);

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(false);
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.processFile(event.dataTransfer.files[0]);
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.processFile(input.files[0]);
        }
    }

    processFile(file: File) {
        this.errorMessage.set(null);
        this.scanResult.set(null);
        this.isScanning.set(true);
        this.cdr.detectChanges();

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewUrl.set(e.target?.result as string);
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        } else {
            this.previewUrl.set(null);
        }

        this.aiService.scanMedicalDocument(file).subscribe({
            next: (res) => {
                this.isScanning.set(false);
                if (res && res.success) {
                    this.scanResult.set(res);
                } else {
                    this.errorMessage.set(res?.error || 'Failed to analyze document.');
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isScanning.set(false);
                this.errorMessage.set(err?.error?.message || err?.message || 'Server error while scanning file.');
                this.cdr.detectChanges();
            }
        });
    }

    resetScanner() {
        this.scanResult.set(null);
        this.previewUrl.set(null);
        this.errorMessage.set(null);
        this.isScanning.set(false);
        this.cdr.detectChanges();
    }

    onConfirm() {
        const result = this.scanResult();
        if (result) {
            this.scanComplete.emit(result);
        }
        this.closeModal.emit();
    }
}
