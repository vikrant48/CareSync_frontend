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

  // Default display duration: 2000ms
  showSuccess(message: string, durationMs: number = 2000) {
    this.show(message, 'success', durationMs);
  }

  showError(message: string, durationMs: number = 2000) {
    this.show(message, 'error', durationMs);
  }

  show(message: string, type: ToastType, durationMs: number = 2000) {
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