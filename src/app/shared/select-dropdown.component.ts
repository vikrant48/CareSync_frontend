import { Component, Input, HostListener, PLATFORM_ID, inject, forwardRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectDropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-1 relative" [class.z-50]="isOpen" [id]="dropdownId">
      <label *ngIf="label" class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
        {{ label }}
      </label>
      
      <button type="button" 
              (click)="toggle($event)"
              [disabled]="disabled"
              class="input-modern py-2 text-sm pl-4 pr-10 w-full text-left bg-white dark:bg-gray-800 relative transition-all duration-300 group min-h-[42px]"
              [class.opacity-50]="disabled"
              [class.cursor-not-allowed]="disabled">
        <span [class.text-gray-400]="!selectedValue" class="block truncate">
          {{ getDisplayLabel() || placeholder }}
        </span>
        <i class="fa-solid fa-chevron-down text-[10px] absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-300"
           [class.rotate-180]="isOpen"></i>
      </button>

      <!-- Custom Dropdown List -->
      <div *ngIf="isOpen" 
           class="absolute z-[100] left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
           [ngClass]="listClass">
        <div class="max-h-[220px] overflow-y-auto custom-scrollbar">
          <div *ngFor="let option of normalizedOptions" 
               (click)="select($event, option.value)"
               class="px-4 py-2.5 text-sm cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between group">
            <span class="font-medium" [class.capitalize]="autoCapitalize">{{ option.label }}</span>
            <i class="fa-solid fa-check text-[10px] opacity-0 group-hover:opacity-100" 
               [class.opacity-100]="isOptionSelected(option.value)"
               *ngIf="isOptionSelected(option.value)"></i>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SelectDropdownComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() options: (string | SelectOption)[] = [];
  @Input() placeholder: string = 'Select option';
  @Input() dropdownId: string = 'custom-dropdown-' + Math.random().toString(36).substr(2, 9);
  @Input() listClass: string = '';
  @Input() autoCapitalize: boolean = true;

  private platformId = inject(PLATFORM_ID);

  isOpen = false;
  selectedValue: any = null;
  disabled = false;

  get normalizedOptions(): SelectOption[] {
    return this.options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }

  getDisplayLabel(): string {
    const found = this.normalizedOptions.find(opt => opt.value === this.selectedValue);
    return found ? found.label : '';
  }

  isOptionSelected(value: any): boolean {
    return this.selectedValue === value;
  }

  // ControlValueAccessor implementation
  onChange: any = () => { };
  onTouched: any = () => { };

  writeValue(value: any): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle(event: Event) {
    if (this.disabled) return;
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  select(event: Event, value: any) {
    event.stopPropagation();
    event.preventDefault();
    this.selectedValue = value;
    this.onChange(value);
    this.onTouched();
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const target = event.target as HTMLElement;
      const element = document.getElementById(this.dropdownId);
      if (element && !element.contains(target)) {
        this.isOpen = false;
      }
    }
  }
}
