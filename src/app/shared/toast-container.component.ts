import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="absolute bottom-4 right-4 z-50 w-full max-w-xl space-y-2">
      <div *ngFor="let t of toasts" class="px-4 py-3 rounded shadow border flex items-center justify-between"
           [ngClass]="t.type === 'success' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'">
        <div class="flex items-center gap-2">
          <span *ngIf="t.type === 'success'">✅</span>
          <span *ngIf="t.type === 'error'">⚠️</span>
          <span class="text-sm">{{ t.message }}</span>
        </div>
        <button class="text-xs opacity-70 hover:opacity-100" (click)="dismiss(t.id)">Dismiss</button>
      </div>
    </div>
  `,
})
export class ToastContainerComponent {
  toasts: Toast[] = [];
  constructor(private toast: ToastService) {
    this.toast.toasts$.subscribe(list => (this.toasts = list));
  }
  dismiss(id: number) {
    this.toast.dismiss(id);
  }
}
