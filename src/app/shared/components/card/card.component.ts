import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'surface' | 'secondary' | 'outline';

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div
      [ngClass]="[
        'rounded-2xl transition-all duration-200 flex flex-col relative overflow-hidden',
        compact ? 'p-3.5 space-y-2.5' : 'p-5 space-y-4',
        getVariantClasses(),
        hoverable ? 'hover:-translate-y-0.5 hover:shadow-xl hover:border-[#3b4763] cursor-pointer' : '',
        selected ? '!border-[#5b6cf0] ring-2 ring-[#5b6cf0]/20 bg-[#151b2b]' : ''
      ]"
    >
      <!-- Top Card Header (Props or Header Slot) -->
      <div *ngIf="title || subtitle || icon || hasHeaderSlot || hasActionsSlot" class="flex items-center justify-between gap-3 pb-1 border-b border-[#2a3347]/50">
        <!-- Title & Subtitle / Icon -->
        <div class="flex items-center gap-3 truncate min-w-0">
          <div *ngIf="icon" class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center shrink-0 border border-[#5b6cf0]/20">
            <i [class]="icon" class="text-sm"></i>
          </div>

          <div class="flex flex-col truncate">
            <h3 *ngIf="title" class="font-bold text-white text-sm tracking-tight truncate">{{ title }}</h3>
            <p *ngIf="subtitle" class="text-xs text-[#9aa3b8] truncate">{{ subtitle }}</p>
          </div>

          <!-- Header Custom Slot -->
          <ng-content select="[card-header]"></ng-content>
        </div>

        <!-- Actions Custom Slot -->
        <div class="shrink-0">
          <ng-content select="[card-actions]"></ng-content>
        </div>
      </div>

      <!-- Main Card Body -->
      <div class="flex-1">
        <ng-content></ng-content>
      </div>

      <!-- Card Footer Slot -->
      <div *ngIf="hasFooterSlot" class="pt-3 border-t border-[#2a3347]/50">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {
    @Input() title?: string;
    @Input() subtitle?: string;
    @Input() icon?: string;
    @Input() variant: CardVariant = 'surface';
    @Input() hoverable = false;
    @Input() selected = false;
    @Input() compact = false;

    @Input() hasHeaderSlot = false;
    @Input() hasActionsSlot = false;
    @Input() hasFooterSlot = false;

    getVariantClasses(): string {
        switch (this.variant) {
            case 'secondary':
                return 'bg-[#1b2333] border border-[#2a3347] shadow-lg';
            case 'outline':
                return 'bg-transparent border border-[#2a3347]';
            case 'surface':
            default:
                return 'bg-[#151b2b] border border-[#2a3347] shadow-xl';
        }
    }
}
