import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private nextId = 1;

  /** Default display time per type: long enough to read; errors/warnings stay longer. */
  private static readonly DEFAULT_DURATION: Record<ToastType, number> = {
    success: 4000,
    info: 4000,
    warning: 6000,
    error: 6000,
  };

  showSuccess(message: string, durationMs?: number) {
    this.show(message, 'success', durationMs);
  }

  showError(message: string, durationMs?: number) {
    this.show(message, 'error', durationMs);
  }

  showInfo(message: string, durationMs?: number) {
    this.show(message, 'info', durationMs);
  }

  showWarning(message: string, durationMs?: number) {
    this.show(message, 'warning', durationMs);
  }

  show(message: string, type: ToastType, durationMs: number = ToastService.DEFAULT_DURATION[type]) {
    const id = this.nextId++;
    const expiresAt = Date.now() + durationMs;
    const toast: Toast = { id, message, type, expiresAt };
    const list = this.toastsSubject.getValue();
    this.toastsSubject.next([...list, toast]);

    // Auto-remove after duration
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number) {
    const list = this.toastsSubject.getValue();
    this.toastsSubject.next(list.filter(t => t.id !== id));
  }

  clearAll() {
    this.toastsSubject.next([]);
  }
}