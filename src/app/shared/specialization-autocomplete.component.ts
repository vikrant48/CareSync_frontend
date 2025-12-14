import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpecializationService } from '../core/services/specialization.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-specialization-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpecializationAutocompleteComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative group" (clickOutside)="showDropdown = false">
      <div class="relative">
        <input
          #inputRef
          type="text"
          [class]="inputClass"
          [placeholder]="placeholder"
          [(ngModel)]="inputValue"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown)="onKeyDown($event)"
          [disabled]="disabled"
          autocomplete="off"
        />
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
           <i class="fa-solid fa-chevron-down text-xs text-gray-600 transition-transform duration-300" [class.rotate-180]="showDropdown"></i>
        </div>
      </div>
      
      <!-- Dropdown -->
      <div 
        *ngIf="showDropdown && (filteredSpecializations.length > 0 || canAddNew)"
        class="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden animate-fade-in"
      >
        <div class="max-h-60 overflow-y-auto custom-scrollbar p-1">
          <!-- Existing specializations -->
          <div
            *ngFor="let spec of filteredSpecializations; let i = index"
            class="px-3 py-2 cursor-pointer flex items-center justify-between rounded-lg transition-colors group/item"
            [class.bg-blue-600]="selectedIndex === i"
            [class.text-white]="selectedIndex === i"
            [class.hover:bg-gray-800]="selectedIndex !== i"
            [class.text-gray-200]="selectedIndex !== i"
            (mousedown)="selectSpecialization(spec)"
            (mouseenter)="selectedIndex = i"
          >
            <span>{{ spec }}</span>
            <i class="fa-solid fa-check text-sm opacity-0 group-hover/item:opacity-100 transition-opacity" [class.opacity-100]="selectedIndex === i" *ngIf="selectedIndex === i"></i>
          </div>
          
          <!-- Add new option -->
          <div
            *ngIf="canAddNew && inputValue.trim()"
            class="px-3 py-2 cursor-pointer mt-1 border-t border-gray-700/50 text-emerald-400 rounded-lg hover:bg-gray-800/50 transition-colors flex items-center gap-2"
            [class.bg-gray-800]="selectedIndex === filteredSpecializations.length"
            (mousedown)="addNewSpecialization()"
            (mouseenter)="selectedIndex = filteredSpecializations.length"
          >
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">
               <i class="fa-solid fa-plus"></i>
            </div>
            <span>Add "<span class="font-bold border-b border-emerald-500/30">{{ inputValue.trim() }}</span>"</span>
          </div>
        </div>
        
        <!-- No results -->
        <div
          *ngIf="filteredSpecializations.length === 0 && !canAddNew"
          class="px-4 py-3 text-gray-500 text-sm text-center italic border-t border-gray-800"
        >
          No specializations found
        </div>
      </div>
    </div>
  `,
  styleUrls: []
})
export class SpecializationAutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() placeholder: string = 'Enter specialization';
  @Input() inputClass: string = 'input';
  @Input() disabled: boolean = false;
  @Input() allowAddNew: boolean = true;
  @Input() required: boolean = false;
  @Input() options: string[] | null = null;

  @Output() specializationSelected = new EventEmitter<string>();
  @Output() specializationAdded = new EventEmitter<string>();

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  inputValue: string = '';
  showDropdown: boolean = false;
  filteredSpecializations: string[] = [];
  selectedIndex: number = -1;
  private allSpecializations: string[] = [];

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // ControlValueAccessor implementation
  private onChange = (value: string) => { };
  private onTouched = () => { };

  constructor(private specializationService: SpecializationService) { }

  ngOnInit(): void {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterSpecializations(query);
    });

    this.specializationService.getAllSpecializations()
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.allSpecializations = list || [];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.inputValue = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: any): void {
    const value = event.target.value;
    this.inputValue = value;
    this.onChange(value);
    this.searchSubject.next(value);
    this.showDropdown = true;
    this.selectedIndex = -1;
  }

  onFocus(): void {
    this.showDropdown = true;
    this.filterSpecializations(this.inputValue);
  }

  onBlur(): void {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => {
      this.showDropdown = false;
      this.onTouched();
    }, 150);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showDropdown) return;

    const totalItems = this.filteredSpecializations.length + (this.canAddNew ? 1 : 0);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, totalItems - 1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;

      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          if (this.selectedIndex < this.filteredSpecializations.length) {
            this.selectSpecialization(this.filteredSpecializations[this.selectedIndex]);
          } else if (this.canAddNew) {
            this.addNewSpecialization();
          }
        }
        break;

      case 'Escape':
        this.showDropdown = false;
        this.selectedIndex = -1;
        break;
    }
  }

  private filterSpecializations(query: string): void {
    const source = (this.options && this.options.length > 0) ? this.options : this.allSpecializations;
    const search = (query || '').toLowerCase().trim();
    const base = source || [];
    const filtered = search ? base.filter(spec => spec.toLowerCase().includes(search)) : base.slice();
    this.filteredSpecializations = filtered;
  }

  selectSpecialization(specialization: string): void {
    this.inputValue = specialization;
    this.onChange(specialization);
    this.showDropdown = false;
    this.selectedIndex = -1;
    this.specializationSelected.emit(specialization);
  }

  addNewSpecialization(): void {
    const newSpec = this.inputValue.trim();
    if (newSpec) {
      this.specializationService.addSpecialization(newSpec);
      this.selectSpecialization(newSpec);
      this.specializationAdded.emit(newSpec);
    }
  }

  get canAddNew(): boolean {
    if (!this.allowAddNew || !this.inputValue.trim()) {
      return false;
    }

    const query = this.inputValue.trim().toLowerCase();
    const exactMatch = this.filteredSpecializations.some(spec => spec.toLowerCase() === query);

    return !exactMatch;
  }
}