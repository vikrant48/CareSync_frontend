import { Component, Input, Output, EventEmitter, ElementRef, HostListener, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="w-full flex flex-col space-y-1.5 relative">
      <!-- Label -->
      <label *ngIf="label" class="text-xs font-semibold text-[var(--muted)] flex items-center gap-1">
        <span>{{ label }}</span>
        <span *ngIf="required" class="text-rose-500 font-bold">*</span>
      </label>

      <!-- Custom Select Trigger Button -->
      <div
        tabindex="0"
        (click)="toggleOpen()"
        (keydown)="onKeyDown($event)"
        [ngClass]="[
          'w-full bg-[var(--bg)] text-[var(--text)] text-sm rounded-xl py-2.5 px-3.5 border transition-all duration-200 flex items-center justify-between cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20',
          disabled ? 'opacity-50 !cursor-not-allowed' : 'hover:border-[var(--primary)]/40',
          isOpen ? '!border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : '',
          getStateClasses()
        ]"
      >
        <!-- Left Selected Content -->
        <div class="flex items-center gap-2 truncate">
          <i *ngIf="selectedOption?.icon" [class]="selectedOption?.icon" class="text-[var(--muted)] text-sm"></i>
          <span *ngIf="selectedOption" class="truncate font-medium text-[var(--text)]">
            {{ selectedOption.label }}
          </span>
          <span *ngIf="!selectedOption" class="text-[var(--muted)] truncate">
            {{ placeholder }}
          </span>
        </div>

        <!-- Right Chevron Icon -->
        <i
          class="fa-solid fa-chevron-down text-xs text-[var(--muted)] transition-transform duration-200"
          [class.rotate-180]="isOpen"
        ></i>
      </div>

      <!-- Dropdown Options Popup -->
      <div
        *ngIf="isOpen"
        class="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150"
      >
        <div
          *ngFor="let opt of options; let i = index"
          (click)="selectOption(opt, $event)"
          [ngClass]="[
            'px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors cursor-pointer select-none',
            opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
            highlightedIndex === i ? 'bg-[var(--primary-soft)] text-[var(--text)]' : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]',
            isSelected(opt) ? '!bg-[var(--primary)] !text-[var(--primary-fg)] font-semibold' : ''
          ]"
        >
          <div class="flex items-center gap-2.5 truncate">
            <i *ngIf="opt.icon" [class]="opt.icon" class="text-sm"></i>
            <span class="truncate">{{ opt.label }}</span>
          </div>
          <i *ngIf="isSelected(opt)" class="fa-solid fa-check text-xs ml-2"></i>
        </div>

        <div *ngIf="!options || options.length === 0" class="px-3.5 py-3 text-xs text-[var(--muted)] text-center italic">
          No options available
        </div>
      </div>

      <!-- Error / Helper text -->
      <p *ngIf="errorMessage" class="text-xs text-rose-400 flex items-center gap-1 font-medium mt-1">
        <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
        <span>{{ errorMessage }}</span>
      </p>
    </div>
  `
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = 'Select an option';
  @Input() options: SelectOption[] = [];
  @Input() required = false;
  @Input() disabled = false;
  @Input() errorMessage?: string;
  @Input() state: 'default' | 'error' = 'default';

  @Output() selectionChange = new EventEmitter<any>();

  selectedValue: any = null;
  isOpen = false;
  highlightedIndex = -1;

  onChange: (val: any) => void = () => { };
  onTouched: () => void = () => { };

  constructor(private elementRef: ElementRef) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  get selectedOption(): SelectOption | undefined {
    return this.options.find((opt) => opt.value === this.selectedValue);
  }

  isSelected(opt: SelectOption): boolean {
    return opt.value === this.selectedValue;
  }

  toggleOpen() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.highlightedIndex = this.options.findIndex((opt) => opt.value === this.selectedValue);
    }
  }

  selectOption(opt: SelectOption, event: MouseEvent) {
    event.stopPropagation();
    if (opt.disabled) return;

    this.selectedValue = opt.value;
    this.onChange(opt.value);
    this.selectionChange.emit(opt.value);
    this.isOpen = false;
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.disabled) return;

    if (!this.isOpen && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
      event.preventDefault();
      this.isOpen = true;
      return;
    }

    if (this.isOpen) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.options.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
            this.selectOption(this.options[this.highlightedIndex], event as any);
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.isOpen = false;
          break;
      }
    }
  }

  getStateClasses(): string {
    if (this.errorMessage || this.state === 'error') {
      return 'border-rose-500/80 focus:border-rose-500';
    }
    return 'border-[var(--border)]';
  }

  // ControlValueAccessor Interface
  writeValue(value: any): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
