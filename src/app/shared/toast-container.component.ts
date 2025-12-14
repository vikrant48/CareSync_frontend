import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] w-full max-w-sm flex flex-col gap-3 pointer-events-none px-4 sm:px-0">
      <div *ngFor="let t of toasts" 
           class="pointer-events-auto transform transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-2 fade-in"
           [class.translate-x-full]="t.dismissed"
           role="alert">
        
        <div class="relative overflow-hidden rounded-xl shadow-lg border backdrop-blur-md p-4 pr-10 min-h-[60px] flex items-start gap-3"
             [ngClass]="getToastClasses(t.type)">
          
          <!-- Icon -->
          <div class="shrink-0 mt-0.5">
            <i class="fa-solid text-lg" [ngClass]="getIconClass(t.type)"></i>
          </div>

          <!-- Content -->
          <div class="flex-1">
            <h4 class="text-sm font-semibold capitalize" [ngClass]="getTitleClass(t.type)">{{ t.type }}</h4>
            <p class="text-xs mt-1 leading-relaxed opacity-90 font-medium">{{ t.message }}</p>
          </div>

          <!-- Progress Bar (Optional, simpler visual cue) -->
          <div class="absolute bottom-0 left-0 h-0.5 w-full bg-current opacity-20"></div>

          <!-- Dismiss Button -->
          <button 
            (click)="dismiss(t.id)" 
            class="absolute top-2 right-2 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-all focus:outline-none"
            title="Dismiss">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

      </div>
    </div>
  `,
})
export class ToastContainerComponent {
  toasts: (Toast & { dismissed?: boolean })[] = [];

  constructor(private toast: ToastService) {
    this.toast.toasts$.subscribe(list => (this.toasts = list));
  }

  dismiss(id: number) {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.dismissed = true;
      // Allow animation to play before actual removal
      setTimeout(() => this.toast.dismiss(id), 300);
    } else {
      this.toast.dismiss(id);
    }
  }

  getToastClasses(type: 'success' | 'error' | 'info' | 'warning'): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-600 dark:bg-red-950/40 dark:border-red-500/30 dark:text-red-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-400';
      default: // info
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:bg-blue-950/40 dark:border-blue-500/30 dark:text-blue-400';
    }
  }

  getIconClass(type: 'success' | 'error' | 'info' | 'warning'): string {
    switch (type) {
      case 'success': return 'fa-circle-check';
      case 'error': return 'fa-circle-xmark';
      case 'warning': return 'fa-triangle-exclamation';
      default: return 'fa-circle-info';
    }
  }

  getTitleClass(type: 'success' | 'error' | 'info' | 'warning'): string {
    switch (type) {
      case 'success': return 'text-emerald-700 dark:text-emerald-300';
      case 'error': return 'text-red-700 dark:text-red-300';
      case 'warning': return 'text-amber-700 dark:text-amber-300';
      default: return 'text-blue-700 dark:text-blue-300';
    }
  }
}
