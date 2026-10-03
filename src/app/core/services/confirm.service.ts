import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use danger styling for destructive actions */
  danger?: boolean;
  icon?: string;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private resolver: ((value: boolean) => void) | null = null;

  readonly state = signal<ConfirmState>({
    open: false,
    message: '',
  });

  /** Promise-based confirm (replaces window.confirm without changing call outcomes). */
  ask(options: ConfirmOptions | string): Promise<boolean> {
    const opts: ConfirmOptions = typeof options === 'string'
      ? { message: options }
      : options;

    // If a dialog is already open, treat previous waiter as cancelled
    if (this.resolver) {
      this.resolver(false);
      this.resolver = null;
    }

    this.state.set({
      open: true,
      title: opts.title || 'Please confirm',
      message: opts.message,
      confirmLabel: opts.confirmLabel || 'Confirm',
      cancelLabel: opts.cancelLabel || 'Cancel',
      danger: !!opts.danger,
      icon: opts.icon || (opts.danger ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-question'),
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  respond(value: boolean) {
    this.state.update((s) => ({ ...s, open: false }));
    const resolve = this.resolver;
    this.resolver = null;
    resolve?.(value);
  }
}
