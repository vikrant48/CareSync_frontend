import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
    label?: string;
}

export type PresetRangeKey = 'today' | 'tomorrow' | 'last7' | 'last30' | 'thisMonth' | 'custom';

@Component({
    selector: 'app-date-range-picker',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="w-full flex flex-col space-y-1.5 relative">
      <!-- Label -->
      <label *ngIf="label" class="text-xs font-semibold text-[#9aa3b8] flex items-center gap-1">
        <span>{{ label }}</span>
      </label>

      <!-- Input Trigger -->
      <div
        tabindex="0"
        (click)="toggleOpen()"
        [ngClass]="[
          'w-full bg-[#151b2b] text-[#f5f7ff] text-sm rounded-xl py-2.5 px-3.5 border transition-all duration-200 flex items-center justify-between cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#5b6cf0]/20',
          disabled ? 'opacity-50 !cursor-not-allowed bg-[#151b2b]/50' : 'hover:border-[#3b4763]',
          isOpen ? '!border-[#5b6cf0] ring-2 ring-[#5b6cf0]/20' : 'border-[#2a3347]'
        ]"
      >
        <div class="flex items-center gap-2.5 truncate">
          <i class="fa-solid fa-calendar-range text-[#5b6cf0] text-sm" aria-hidden="true"></i>
          <span *ngIf="displayText" class="font-medium text-white text-xs">
            {{ displayText }}
          </span>
          <span *ngIf="!displayText" class="text-[#9aa3b8]/50 text-xs">
            {{ placeholder }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-[#9aa3b8]">
          <button
            *ngIf="range.startDate && !disabled"
            type="button"
            (click)="clearRange($event)"
            class="hover:text-white transition-colors focus:outline-none"
            title="Clear range" aria-label="Clear range">
            <i class="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
          </button>
          <i class="fa-solid fa-chevron-down text-xs transition-transform duration-200" [class.rotate-180]="isOpen" aria-hidden="true"></i>
        </div>
      </div>

      <!-- Date Range Popup Box -->
      <div
        *ngIf="isOpen"
        class="absolute top-full left-0 mt-1 z-50 bg-[#1b2333] border border-[#2a3347] rounded-2xl shadow-2xl p-4 w-[340px] space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
      >
        <!-- Presets Row -->
        <div class="flex flex-wrap gap-1.5 pb-3 border-b border-[#2a3347]">
          <button
            *ngFor="let p of presets"
            type="button"
            (click)="applyPreset(p.key, $event)"
            [ngClass]="[
              'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all',
              activePreset === p.key ? 'bg-[#5b6cf0] text-white shadow-sm' : 'bg-[#151b2b] text-[#9aa3b8] hover:text-white hover:bg-[#252f44]'
            ]"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Custom Range Calendar Display -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold text-[#9aa3b8]">
            <span>Select Date Range</span>
            <span class="text-[10px] text-[#5b6cf0] uppercase font-bold">{{ activePreset }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-[#151b2b] p-2 rounded-xl border border-[#2a3347] flex flex-col">
              <span class="text-[10px] text-[#9aa3b8] uppercase font-bold">Start Date</span>
              <span class="font-semibold text-white truncate mt-0.5">
                {{ range.startDate ? formatDate(range.startDate) : 'Not set' }}
              </span>
            </div>
            <div class="bg-[#151b2b] p-2 rounded-xl border border-[#2a3347] flex flex-col">
              <span class="text-[10px] text-[#9aa3b8] uppercase font-bold">End Date</span>
              <span class="font-semibold text-white truncate mt-0.5">
                {{ range.endDate ? formatDate(range.endDate) : 'Not set' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="pt-2 border-t border-[#2a3347] flex items-center justify-between">
          <button
            type="button"
            (click)="clearRange($event)"
            class="text-[11px] text-[#9aa3b8] hover:text-rose-400 font-medium"
          >
            Reset Range
          </button>
          <button
            type="button"
            (click)="isOpen = false"
            class="px-3 py-1 bg-[#5b6cf0] hover:bg-[#4c5ee0] text-white rounded-lg text-xs font-semibold shadow-md"
          >
            Apply Range
          </button>
        </div>
      </div>
    </div>
  `
})
export class DateRangePickerComponent {
    @Input() label?: string;
    @Input() placeholder = 'Select date range...';
    @Input() disabled = false;

    @Output() rangeChange = new EventEmitter<DateRange>();

    range: DateRange = { startDate: null, endDate: null };
    activePreset: PresetRangeKey = 'last7';
    isOpen = false;

    presets: { key: PresetRangeKey; label: string }[] = [
        { key: 'today', label: 'Today' },
        { key: 'tomorrow', label: 'Tomorrow' },
        { key: 'last7', label: 'Last 7 Days' },
        { key: 'last30', label: 'Last 30 Days' },
        { key: 'thisMonth', label: 'This Month' }
    ];

    constructor(private elementRef: ElementRef) {
        this.applyPreset('last7');
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    get displayText(): string {
        if (!this.range.startDate) return '';
        const startStr = this.formatDate(this.range.startDate);
        if (!this.range.endDate) return startStr;
        const endStr = this.formatDate(this.range.endDate);
        return `${startStr}  →  ${endStr}`;
    }

    toggleOpen() {
        if (this.disabled) return;
        this.isOpen = !this.isOpen;
    }

    applyPreset(presetKey: PresetRangeKey, event?: MouseEvent) {
        if (event) event.stopPropagation();
        this.activePreset = presetKey;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let start: Date | null = null;
        let end: Date | null = null;

        switch (presetKey) {
            case 'today':
                start = new Date(today);
                end = new Date(today);
                break;
            case 'tomorrow':
                start = new Date(today);
                start.setDate(today.getDate() + 1);
                end = new Date(start);
                break;
            case 'last7':
                end = new Date(today);
                start = new Date(today);
                start.setDate(today.getDate() - 6);
                break;
            case 'last30':
                end = new Date(today);
                start = new Date(today);
                start.setDate(today.getDate() - 29);
                break;
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
        }

        this.range = { startDate: start, endDate: end, label: presetKey };
        this.rangeChange.emit(this.range);
    }

    clearRange(event: MouseEvent) {
        event.stopPropagation();
        this.range = { startDate: null, endDate: null };
        this.activePreset = 'custom';
        this.rangeChange.emit(this.range);
    }

    formatDate(d: Date): string {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
}
