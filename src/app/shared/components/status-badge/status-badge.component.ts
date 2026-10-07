import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AppointmentStatusType = 'BOOKED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING' | string;

@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span
      [ngClass]="[
        'inline-flex items-center font-bold tracking-wide rounded-full border transition-all select-none',
        getSizeClasses(),
        getStatusClasses()
      ]"
    >
      <!-- Pulse / Solid Dot -->
      <span
        *ngIf="showDot"
        [ngClass]="[
          'rounded-full shrink-0 mr-1.5',
          size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2',
          getDotClasses()
        ]"
      ></span>

      <!-- Custom Icon -->
      <i *ngIf="icon" [class]="icon" class="mr-1.5 text-xs"></i>

      <!-- Label Text -->
      <span>{{ displayLabel }}</span>
    </span>
  `
})
export class StatusBadgeComponent {
    @Input() status: AppointmentStatusType = 'PENDING';
    @Input() label?: string;
    @Input() showDot = true;
    @Input() icon?: string;
    @Input() size: 'sm' | 'md' | 'lg' = 'md';

    get displayLabel(): string {
        if (this.label) return this.label;
        const normalized = (this.status || '').toUpperCase().replace(/_/g, ' ');
        return normalized || 'UNKNOWN';
    }

    getSizeClasses(): string {
        switch (this.size) {
            case 'sm':
                return 'px-2 py-0.5 text-[10px]';
            case 'lg':
                return 'px-3.5 py-1 text-xs';
            case 'md':
            default:
                return 'px-2.5 py-0.5 text-[11px]';
        }
    }

    getStatusClasses(): string {
        const s = (this.status || '').toUpperCase();
        switch (s) {
            case 'BOOKED':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'CONFIRMED':
                return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
            case 'IN_PROGRESS':
                return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10';
            case 'COMPLETED':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'CANCELLED':
            case 'REJECTED':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            case 'PENDING':
            default:
                return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        }
    }

    getDotClasses(): string {
        const s = (this.status || '').toUpperCase();
        switch (s) {
            case 'BOOKED':
                return 'bg-blue-400';
            case 'CONFIRMED':
                return 'bg-indigo-400';
            case 'IN_PROGRESS':
                return 'bg-emerald-400 animate-pulse';
            case 'COMPLETED':
                return 'bg-emerald-400';
            case 'CANCELLED':
            case 'REJECTED':
                return 'bg-rose-400';
            case 'PENDING':
            default:
                return 'bg-amber-400';
        }
    }
}
