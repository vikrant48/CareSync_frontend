import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="onClick($event)"
      [ngClass]="[
        'inline-flex items-center justify-center flex-nowrap whitespace-nowrap max-w-full font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5b6cf0]/50 select-none cursor-pointer',
        fullWidth ? 'w-full' : '',
        getSizeClasses(),
        getVariantClasses(),
        disabled || loading ? 'opacity-50 !cursor-not-allowed pointer-events-none' : 'active:scale-[0.98]'
      ]"
    >
      <!-- Loading Spinner -->
      <span *ngIf="loading" class="inline-block animate-spin mr-2">
        <i class="fa-solid fa-spinner text-current" aria-hidden="true"></i>
      </span>

      <!-- Left Icon -->
      <i *ngIf="icon && iconPosition === 'left' && !loading" [class]="icon" [ngClass]="hasText ? 'mr-2' : ''"></i>

      <!-- Button Content / Label -->
      <span #contentWrapper [class.hidden]="!hasText" class="min-w-0 whitespace-nowrap">
        <ng-content></ng-content>
      </span>

      <!-- Right Icon -->
      <i *ngIf="icon && iconPosition === 'right' && !loading" [class]="icon" [ngClass]="hasText ? 'ml-2' : ''"></i>
    </button>
  `
})
export class ButtonComponent {
    @Input() variant: ButtonVariant = 'primary';
    @Input() size: ButtonSize = 'md';
    @Input() icon?: string;
    @Input() iconPosition: 'left' | 'right' = 'left';
    @Input() loading = false;
    @Input() disabled = false;
    @Input() fullWidth = false;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() hasText = true;

    @Output() btnClick = new EventEmitter<MouseEvent>();

    onClick(event: MouseEvent) {
        if (!this.disabled && !this.loading) {
            this.btnClick.emit(event);
        }
    }

    getSizeClasses(): string {
        switch (this.size) {
            case 'sm':
                return 'btn-size-sm px-2.5 py-0 text-[11px] rounded-lg gap-1';
            case 'lg':
                return 'btn-size-lg px-4 sm:px-5 py-0 text-sm rounded-xl gap-2';
            case 'md':
            default:
                return 'btn-size-md px-3 sm:px-4 py-0 text-xs rounded-lg gap-1.5';
        }
    }

    getVariantClasses(): string {
        switch (this.variant) {
            case 'secondary':
                return 'bg-[#1b2333] hover:bg-[#252f44] text-[#f5f7ff] border border-[#2a3347] shadow-sm';
            case 'outline':
                return 'bg-transparent border border-[#5b6cf0] text-[#5b6cf0] hover:bg-[#5b6cf0]/10';
            case 'ghost':
                return 'bg-transparent hover:bg-[#1b2333] text-[#f5f7ff]';
            case 'text':
                return 'bg-transparent hover:underline text-[#5b6cf0] !p-0';
            case 'success':
                return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20';
            case 'warning':
                return 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20';
            case 'danger':
                return 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20';
            case 'primary':
            default:
                return 'bg-[#5b6cf0] hover:bg-[#4c5ee0] text-white shadow-lg shadow-[#5b6cf0]/25';
        }
    }
}
