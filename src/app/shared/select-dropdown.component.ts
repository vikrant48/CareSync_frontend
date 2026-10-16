import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  forwardRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  /** Optional Font Awesome classes shown before the label */
  icon?: string;
  disabled?: boolean;
}

let nextSelectId = 0;

/**
 * The app's single custom select (ControlValueAccessor).
 * Works with [(ngModel)] / formControlName, or one-way [value]-style use via ngModel + (selectionChange).
 * Keyboard: Enter/Space/ArrowDown open; Arrow keys/Home/End move; Enter/Space pick; Escape/Tab close.
 */
@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectDropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-0.5 relative" [class.z-50]="isOpen" [id]="dropdownId">
      <label *ngIf="label" [id]="labelId" [attr.for]="buttonId" [class]="customLabelClass || 'filter-label'">
        {{ label }}<span *ngIf="required" class="text-rose-500 font-bold" aria-hidden="true"> *</span>
      </label>

      <button type="button" [id]="buttonId"
              (click)="toggle($event)"
              (keydown)="onKeyDown($event)"
              [disabled]="isDisabled"
              role="combobox"
              aria-haspopup="listbox"
              [attr.aria-expanded]="isOpen"
              [attr.aria-controls]="isOpen ? listId : null"
              [attr.aria-labelledby]="label ? labelId + ' ' + buttonId : null"
              [attr.aria-activedescendant]="isOpen && highlightedIndex >= 0 ? optionId(highlightedIndex) : null"
              [attr.aria-required]="required || null"
              [attr.aria-invalid]="errorMessage ? true : null"
              [class]="customButtonClass || 'w-full filter-control-height rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 text-xs sm:text-sm cursor-pointer relative transition-all duration-200 group flex items-center justify-between text-left font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 dark:hover:border-gray-500'"
              [class.!border-rose-500]="!!errorMessage"
              [class.opacity-50]="isDisabled"
              [class.cursor-not-allowed]="isDisabled">
        <span class="flex items-center gap-2 min-w-0 pr-5">
          <i *ngIf="selectedOption?.icon" [class]="selectedOption!.icon" class="text-xs opacity-70" aria-hidden="true"></i>
          <span [class.text-gray-400]="!hasSelection" class="block truncate" [class.capitalize]="autoCapitalize && hasSelection">
            {{ selectedOption?.label || placeholder }}
          </span>
        </span>
        <i class="fa-solid fa-chevron-down text-[10px] absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform duration-300 text-gray-700 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
           [class.rotate-180]="isOpen" aria-hidden="true"></i>
      </button>

      <!-- Options list -->
      <div *ngIf="isOpen"
           class="absolute z-[9999] left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
           [ngClass]="listClass">
        <ul [id]="listId" role="listbox" class="max-h-[220px] overflow-y-auto custom-scrollbar py-1"
            [attr.aria-labelledby]="label ? labelId : null">
          <li *ngFor="let option of normalizedOptions; let i = index; trackBy: trackOption"
              [id]="optionId(i)"
              role="option"
              [attr.aria-selected]="isOptionSelected(option.value)"
              [attr.aria-disabled]="option.disabled || null"
              (mousedown)="$event.preventDefault()"
              (click)="select($event, option)"
              (mouseenter)="highlightedIndex = i"
              class="px-3 min-h-[44px] py-2 text-xs sm:text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 group"
              [ngClass]="[
                highlightedIndex === i ? 'bg-blue-50 dark:bg-blue-950/30' : '',
                highlightedIndex === i || isOptionSelected(option.value) ? 'text-blue-600 dark:text-blue-400' : '',
                option.disabled ? 'opacity-40 cursor-not-allowed' : ''
              ]">
            <span class="flex items-center gap-2 min-w-0">
              <i *ngIf="option.icon" [class]="option.icon" class="text-xs" aria-hidden="true"></i>
              <span class="font-medium truncate" [class.capitalize]="autoCapitalize">{{ option.label }}</span>
            </span>
            <i *ngIf="isOptionSelected(option.value)" class="fa-solid fa-check text-[10px] text-blue-600 dark:text-blue-400" aria-hidden="true"></i>
          </li>
          <li *ngIf="normalizedOptions.length === 0" class="px-3 py-3 text-xs text-gray-700 dark:text-gray-400 text-center italic" role="presentation">
            No options available
          </li>
        </ul>
      </div>

      <p *ngIf="errorMessage" class="form-error flex items-center gap-1" role="alert">
        <i class="fa-solid fa-circle-exclamation text-[10px]" aria-hidden="true"></i>{{ errorMessage }}
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; }
  `]
})
export class SelectDropdownComponent implements ControlValueAccessor {
  private host = inject(ElementRef<HTMLElement>);
  private readonly uid = ++nextSelectId;

  @Input() label: string = '';
  @Input() options: (string | SelectOption)[] = [];
  @Input() placeholder: string = 'Select option';
  @Input() dropdownId: string = `custom-dropdown-${this.uid}`;
  @Input() listClass: string = '';
  @Input() customButtonClass: string = '';
  @Input() customLabelClass: string = '';
  @Input() autoCapitalize: boolean = true;
  @Input() required = false;
  /** Disable from the template (forms can also disable via setDisabledState) */
  @Input() disabled = false;
  @Input() errorMessage = '';

  /** Fires with the picked value (in addition to the ControlValueAccessor change) */
  @Output() selectionChange = new EventEmitter<any>();

  @HostBinding('style.position') hostPosition = 'relative';
  @HostBinding('style.zIndex') get hostZIndex() {
    return this.isOpen ? '9999' : 'auto';
  }

  readonly buttonId = `select-${this.uid}-button`;
  readonly labelId = `select-${this.uid}-label`;
  readonly listId = `select-${this.uid}-list`;

  isOpen = false;
  selectedValue: any = null;
  highlightedIndex = -1;
  private formDisabled = false;

  get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /**
   * Cached: the list keeps the same object identities until `options` changes. Rebuilding it on every
   * change detection made *ngFor re-create the <li> elements between mousedown and mouseup, so a real
   * mouse click landed on a removed element and the option was never selected.
   */
  private lastOptionsRef: (string | SelectOption)[] | null = null;
  private lastNormalized: SelectOption[] = [];
  private lastLength = 0;

  get normalizedOptions(): SelectOption[] {
    if (this.options !== this.lastOptionsRef || (this.options?.length ?? 0) !== this.lastLength) {
      this.lastOptionsRef = this.options;
      this.lastLength = this.options?.length ?? 0;
      this.lastNormalized = (this.options || []).map(opt => typeof opt === 'string' ? { value: opt, label: opt } : opt);
    }
    return this.lastNormalized;
  }

  trackOption(_: number, option: SelectOption): unknown {
    return option.value;
  }

  get selectedOption(): SelectOption | undefined {
    return this.normalizedOptions.find(opt => opt.value === this.selectedValue);
  }

  get hasSelection(): boolean {
    return !!this.selectedOption;
  }

  /** Kept for existing callers */
  getDisplayLabel(): string {
    return this.selectedOption?.label ?? '';
  }

  isOptionSelected(value: any): boolean {
    return this.selectedValue === value;
  }

  optionId(index: number): string {
    return `select-${this.uid}-option-${index}`;
  }

  // ControlValueAccessor implementation
  onChange: (value: any) => void = () => { };
  onTouched: () => void = () => { };

  writeValue(value: any): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
  }

  toggle(event: Event) {
    if (this.isDisabled) return;
    event.stopPropagation();
    this.isOpen ? this.close() : this.open();
  }

  select(event: Event | null, option: SelectOption) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (option.disabled) return;
    this.selectedValue = option.value;
    this.onChange(option.value);
    this.selectionChange.emit(option.value);
    this.close();
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.isDisabled) return;
    const options = this.normalizedOptions;

    if (!this.isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.open();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = this.nextEnabled(this.highlightedIndex, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = this.nextEnabled(this.highlightedIndex, -1);
        break;
      case 'Home':
        event.preventDefault();
        this.highlightedIndex = this.nextEnabled(-1, 1);
        break;
      case 'End':
        event.preventDefault();
        this.highlightedIndex = this.nextEnabled(options.length, -1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < options.length) {
          this.select(null, options[this.highlightedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation(); // don't also close a surrounding modal
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private open() {
    this.isOpen = true;
    const options = this.normalizedOptions;
    const current = options.findIndex(o => o.value === this.selectedValue);
    this.highlightedIndex = current >= 0 ? current : this.nextEnabled(-1, 1);
  }

  private close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.highlightedIndex = -1;
    this.onTouched();
  }

  /** Next non-disabled option index from `from` in direction `step`; stays put at the ends. */
  private nextEnabled(from: number, step: 1 | -1): number {
    const options = this.normalizedOptions;
    for (let i = from + step; i >= 0 && i < options.length; i += step) {
      if (!options[i].disabled) return i;
    }
    return from >= 0 && from < options.length ? from : -1;
  }
}
