import { Component, Input, Output, EventEmitter, ElementRef, HostListener, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SearchableOption {
  id: any;
  label: string;
  subtitle?: string;
  avatar?: string;
  icon?: string;
  rawData?: any;
}

@Component({
  selector: 'app-searchable-select-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectFieldComponent),
      multi: true
    }
  ],
  template: `
    <div class="w-full flex flex-col space-y-1.5 relative">
      <!-- Label -->
      <label *ngIf="label" class="text-xs font-semibold text-[#9aa3b8] flex items-center gap-1">
        <span>{{ label }}</span>
        <span *ngIf="required" class="text-rose-400 font-bold">*</span>
      </label>

      <!-- Searchable Select Trigger -->
      <div
        tabindex="0"
        (click)="toggleOpen()"
        (keydown)="onKeyDown($event)"
        [ngClass]="[
          'w-full bg-[#151b2b] text-[#f5f7ff] text-sm rounded-xl py-2.5 px-3.5 border transition-all duration-200 flex items-center justify-between cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#5b6cf0]/20',
          disabled ? 'opacity-50 !cursor-not-allowed bg-[#151b2b]/50' : 'hover:border-[#3b4763]',
          isOpen ? '!border-[#5b6cf0] ring-2 ring-[#5b6cf0]/20' : '',
          errorMessage ? 'border-rose-500/80' : 'border-[#2a3347]'
        ]"
      >
        <!-- Selected Content Rendering -->
        <div class="flex items-center gap-2.5 truncate flex-1 min-w-0">
          <img
            *ngIf="selectedOption?.avatar"
            [src]="selectedOption?.avatar"
            alt="Avatar"
            class="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-[#2a3347]"
          />
          <i *ngIf="!selectedOption?.avatar && selectedOption?.icon" [class]="selectedOption?.icon" class="text-[#9aa3b8] text-sm shrink-0"></i>

          <div *ngIf="selectedOption" class="flex flex-col truncate">
            <span class="truncate font-semibold text-white text-xs leading-tight">{{ selectedOption.label }}</span>
            <span *ngIf="selectedOption.subtitle" class="truncate text-[10px] text-[#9aa3b8] leading-tight">
              {{ selectedOption.subtitle }}
            </span>
          </div>

          <span *ngIf="!selectedOption" class="text-[#9aa3b8]/50 truncate text-sm">
            {{ placeholder }}
          </span>
        </div>

        <!-- Icons Right: Clear & Chevron -->
        <div class="flex items-center gap-2 shrink-0 text-[#9aa3b8] ml-2">
          <button
            *ngIf="clearable && selectedValue !== null && selectedValue !== undefined && !disabled"
            type="button"
            (click)="onClear($event)"
            class="hover:text-white transition-colors focus:outline-none"
            title="Clear selection"
          >
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>

          <i
            class="fa-solid fa-chevron-down text-xs transition-transform duration-200"
            [class.rotate-180]="isOpen"
          ></i>
        </div>
      </div>

      <!-- Dropdown Popup Window -->
      <div
        *ngIf="isOpen"
        class="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1b2333] border border-[#2a3347] rounded-xl shadow-2xl overflow-hidden p-2 space-y-2 max-h-72 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
      >
        <!-- Embedded Search Input Field -->
        <div class="relative flex items-center shrink-0">
          <i class="fa-solid fa-magnifying-glass absolute left-3 text-xs text-[#9aa3b8]"></i>
          <input
            #searchInput
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            placeholder="Search..."
            class="w-full bg-[#151b2b] text-xs text-white placeholder-[#9aa3b8]/50 rounded-lg pl-8 pr-3 py-2 border border-[#2a3347] focus:outline-none focus:border-[#5b6cf0]"
          />
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="py-4 text-center text-xs text-[#9aa3b8] flex items-center justify-center gap-2">
          <i class="fa-solid fa-spinner animate-spin text-[#5b6cf0]"></i>
          <span>Loading results...</span>
        </div>

        <!-- Options Scrollable Container -->
        <div *ngIf="!loading" class="overflow-y-auto custom-scrollbar space-y-1 flex-1 pr-1">
          <div
            *ngFor="let opt of filteredOptions; let i = index"
            (click)="selectOption(opt, $event)"
            [ngClass]="[
              'px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer select-none',
              highlightedIndex === i ? 'bg-[#5b6cf0]/15 text-white' : 'text-[#9aa3b8] hover:bg-[#151b2b] hover:text-white',
              isSelected(opt) ? '!bg-[#5b6cf0] !text-white font-medium' : ''
            ]"
          >
            <div class="flex items-center gap-2.5 truncate min-w-0">
              <img
                *ngIf="opt.avatar"
                [src]="opt.avatar"
                alt="Avatar"
                class="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-[#2a3347]"
              />
              <i *ngIf="!opt.avatar && opt.icon" [class]="opt.icon" class="text-sm shrink-0"></i>

              <div class="flex flex-col truncate">
                <span class="truncate font-medium text-white">{{ opt.label }}</span>
                <span *ngIf="opt.subtitle" class="truncate text-[10px] text-[#9aa3b8] group-hover:text-gray-300">
                  {{ opt.subtitle }}
                </span>
              </div>
            </div>

            <i *ngIf="isSelected(opt)" class="fa-solid fa-check text-xs shrink-0 ml-2"></i>
          </div>

          <!-- Empty Result State -->
          <div *ngIf="filteredOptions.length === 0" class="py-6 text-center text-xs text-[#9aa3b8] space-y-1">
            <i class="fa-solid fa-magnifying-glass text-lg opacity-40"></i>
            <p class="font-medium">No results found</p>
            <p class="text-[10px] opacity-70">Try a different search term</p>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <p *ngIf="errorMessage" class="text-xs text-rose-400 flex items-center gap-1 font-medium mt-1">
        <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
        <span>{{ errorMessage }}</span>
      </p>
    </div>
  `
})
export class SearchableSelectFieldComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = 'Search and select option...';
  @Input() options: SearchableOption[] = [];
  @Input() required = false;
  @Input() disabled = false;
  @Input() clearable = true;
  @Input() loading = false;
  @Input() errorMessage?: string;

  @Output() selectionChange = new EventEmitter<any>();

  selectedValue: any = null;
  searchQuery = '';
  isOpen = false;
  filteredOptions: SearchableOption[] = [];
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

  get selectedOption(): SearchableOption | undefined {
    return this.options.find((opt) => opt.id === this.selectedValue);
  }

  isSelected(opt: SearchableOption): boolean {
    return opt.id === this.selectedValue;
  }

  toggleOpen() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchQuery = '';
      this.filteredOptions = [...this.options];
      this.highlightedIndex = this.filteredOptions.findIndex((opt) => opt.id === this.selectedValue);
    }
  }

  onSearchInput() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredOptions = [...this.options];
    } else {
      this.filteredOptions = this.options.filter(
        (opt) => opt.label.toLowerCase().includes(q) || (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
      );
    }
    this.highlightedIndex = 0;
  }

  selectOption(opt: SearchableOption, event: MouseEvent) {
    event.stopPropagation();
    this.selectedValue = opt.id;
    this.onChange(opt.id);
    this.selectionChange.emit(opt.id);
    this.isOpen = false;
  }

  onClear(event: MouseEvent) {
    event.stopPropagation();
    this.selectedValue = null;
    this.onChange(null);
    this.selectionChange.emit(null);
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.disabled) return;

    if (!this.isOpen && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
      event.preventDefault();
      this.toggleOpen();
      return;
    }

    if (this.isOpen) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredOptions.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
          break;
        case 'Enter':
          event.preventDefault();
          if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
            this.selectOption(this.filteredOptions[this.highlightedIndex], event as any);
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.isOpen = false;
          break;
      }
    }
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
