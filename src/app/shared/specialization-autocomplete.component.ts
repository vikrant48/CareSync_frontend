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
      
      <!-- Dropdown -->
      <div 
        *ngIf="showDropdown && (filteredSpecializations.length > 0 || canAddNew)"
        class="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <!-- Existing specializations -->
        <div
          *ngFor="let spec of filteredSpecializations; let i = index"
          class="px-3 py-2 cursor-pointer hover:bg-gray-700 text-gray-100"
          [class.bg-gray-700]="selectedIndex === i"
          (mousedown)="selectSpecialization(spec)"
          (mouseenter)="selectedIndex = i"
        >
          {{ spec }}
        </div>
        
        <!-- Add new option -->
        <div
          *ngIf="canAddNew && inputValue.trim()"
          class="px-3 py-2 cursor-pointer hover:bg-gray-700 text-emerald-400 border-t border-gray-600"
          [class.bg-gray-700]="selectedIndex === filteredSpecializations.length"
          (mousedown)="addNewSpecialization()"
          (mouseenter)="selectedIndex = filteredSpecializations.length"
        >
          <i class="fa-solid fa-plus mr-2"></i>
          Add "{{ inputValue.trim() }}"
        </div>
        
        <!-- No results -->
        <div
          *ngIf="filteredSpecializations.length === 0 && !canAddNew"
          class="px-3 py-2 text-gray-400 text-sm"
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
  
  @Output() specializationSelected = new EventEmitter<string>();
  @Output() specializationAdded = new EventEmitter<string>();
  
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  inputValue: string = '';
  showDropdown: boolean = false;
  filteredSpecializations: string[] = [];
  selectedIndex: number = -1;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  // ControlValueAccessor implementation
  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor(private specializationService: SpecializationService) {}

  ngOnInit(): void {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterSpecializations(query);
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
    this.specializationService.filterSpecializations(query).subscribe(filtered => {
      this.filteredSpecializations = filtered;
    });
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
    const exactMatch = this.filteredSpecializations.some(spec => 
      spec.toLowerCase() === query
    );
    
    return !exactMatch;
  }
}