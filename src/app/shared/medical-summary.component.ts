import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiAssistantService } from '../core/services/ai-assistant.service';

@Component({
    selector: 'app-medical-summary',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
      <!-- Header -->
      <div class="px-5 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <i class="fas fa-file-medical-alt text-indigo-600 dark:text-indigo-400"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 italic">AI Medical Summary</h3>
            <p class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Powered by CareSync AI</p>
          </div>
        </div>
        <button 
          (click)="loadSummary()" 
          [disabled]="isLoading()"
          class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <i class="fas fa-sync-alt" [class.animate-spin]="isLoading()"></i>
          <span>{{ summary() ? 'Refresh' : 'Generate' }}</span>
        </button>
      </div>

      <!-- Content -->
      <div class="p-5">
        <!-- Skeleton Loading -->
        <div *ngIf="isLoading()" class="space-y-4 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6"></div>
            <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/6"></div>
          </div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
            <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading() && !summary() && !error()" class="py-8 text-center">
          <div class="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto mb-3 text-gray-300">
            <i class="fas fa-magic text-xl"></i>
          </div>
          <p class="text-sm text-gray-500">Click generate to see an AI-powered summary of the patient's history.</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex gap-3">
          <i class="fas fa-exclamation-circle text-red-500 mt-0.5"></i>
          <div>
            <h4 class="text-sm font-bold text-red-800 dark:text-red-300">Summarization Failed</h4>
            <p class="text-xs text-red-700 dark:text-red-400 mt-1">{{ error() }}</p>
          </div>
        </div>

        <!-- Summary Text -->
        <div *ngIf="!isLoading() && summary()" class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-headings:text-indigo-600 dark:prose-headings:text-indigo-400 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-p:leading-relaxed prose-li:my-1">
          <div [innerHTML]="formattedSummary()" class="whitespace-pre-wrap"></div>
        </div>

        <!-- Disclaimer -->
        <div *ngIf="summary()" class="mt-6 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded border border-blue-100/50 dark:border-blue-800/30 flex gap-3">
          <i class="fas fa-info-circle text-blue-500 text-xs mt-0.5"></i>
          <p class="text-[10px] text-blue-700 dark:text-blue-400 leading-tight">
            <strong>Medical Disclaimer:</strong> This summary is AI-generated and intended for informational purposes. Please verify all critical clinical information with source records before making medical decisions.
          </p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
    ::ng-deep .prose ul { padding-left: 1.25rem; list-style-type: disc; }
    ::ng-deep .prose h2, ::ng-deep .prose h3 { margin-top: 1.5rem; }
  `]
})
export class MedicalSummaryComponent implements OnInit {
    @Input({ required: true }) patientId!: number;

    private aiService = inject(AiAssistantService);

    summary = signal<string | null>(null);
    isLoading = signal(false);
    error = signal<string | null>(null);

    ngOnInit() {
        // Optionally auto-load on init
        // this.loadSummary();
    }

    loadSummary() {
        this.isLoading.set(true);
        this.error.set(null);

        this.aiService.getMedicalSummary(this.patientId).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                if (res.success) {
                    this.summary.set(res.summary ?? null);
                } else {
                    this.error.set(res.error || 'Failed to generate summary.');
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                this.error.set('Connection error. Could not reach AI service.');
                console.error('Summary error:', err);
            }
        });
    }

    formattedSummary() {
        const text = this.summary();
        if (!text) return '';

        // Basic Markdown-like formatting for AI output
        return text
            .replace(/^### (.*$)/gim, '<h3 class="text-base mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-lg mt-6 mb-3">$2</h2>')
            .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
    }
}
