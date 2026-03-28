import { 
  Component, 
  Input, 
  PLATFORM_ID, 
  inject, 
  forwardRef, 
  ViewChild, 
  ElementRef, 
  AfterViewInit, 
  OnDestroy,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { 
  ControlValueAccessor, 
  NG_VALUE_ACCESSOR, 
  FormsModule 
} from '@angular/forms';
import flatpickr from 'flatpickr';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-1.5 relative" [id]="containerId">
      <label *ngIf="label" class="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
        {{ label }}
      </label>
      
      <div class="relative group">
        <input #dateInput
               type="text"
               [placeholder]="placeholder"
               [disabled]="disabled"
               class="input-modern py-2 text-sm pl-4 pr-10 w-full cursor-pointer"
               [class.error]="error"
               [class.opacity-50]="disabled"
               [class.cursor-not-allowed]="disabled">
        
        <i class="fa-solid fa-calendar text-sm absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors pointer-events-none"
           [class.text-red-400]="error"></i>
      </div>
      
      <p *ngIf="error" class="error-msg animate-in fade-in slide-in-from-top-1 duration-200">
        {{ error }}
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DatePickerComponent implements ControlValueAccessor, AfterViewInit, OnDestroy, OnChanges {
  @Input() label: string = '';
  @Input() placeholder: string = 'Select date';
  @Input() containerId: string = 'date-picker-' + Math.random().toString(36).substr(2, 9);
  @Input() config: any = {};
  @Input() error: string = '';
  
  // Flatpickr specific configs
  @Input() dateFormat: string = 'Y-m-d';
  @Input() altFormat: string = 'd-m-Y';
  @Input() enableTime: boolean = false;
  @Input() minDate?: string | Date;
  @Input() maxDate?: string | Date;
  @Input() mode: 'single' | 'multiple' | 'range' = 'single';
  
  @Output() dateChange = new EventEmitter<string>();

  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;

  private platformId = inject(PLATFORM_ID);
  private fpInstance: any;
  private value: any;
  disabled = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnChanges(changes: SimpleChanges) {
    if (this.fpInstance) {
      if (changes['minDate']) this.fpInstance.set('minDate', this.minDate);
      if (changes['maxDate']) this.fpInstance.set('maxDate', this.maxDate);
      if (changes['error']) this.updateAltInputClass();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initFlatpickr();
    }
  }

  ngOnDestroy() {
    if (this.fpInstance) {
      this.fpInstance.destroy();
    }
  }

  private initFlatpickr() {
    this.fpInstance = flatpickr(this.dateInput.nativeElement, {
      ...this.config,
      dateFormat: this.dateFormat,
      altInput: true,
      altFormat: this.altFormat,
      enableTime: this.enableTime,
      minDate: this.minDate,
      maxDate: this.maxDate,
      mode: this.mode,
      altInputClass: this.getAltInputClass(),
      onChange: (selectedDates, dateStr) => {
        this.value = dateStr;
        this.onChange(dateStr);
        this.onTouched();
        this.dateChange.emit(dateStr);
      }
    });

    if (this.value) {
      this.fpInstance.setDate(this.value, false);
    }
  }

  private getAltInputClass(): string {
    return 'input-modern py-2 text-sm pl-4 pr-10 w-full cursor-pointer' + (this.error ? ' error' : '');
  }

  private updateAltInputClass() {
    if (this.fpInstance && this.fpInstance.altInput) {
      this.fpInstance.altInput.className = this.getAltInputClass();
    }
  }

  writeValue(value: any): void {
    this.value = value;
    if (this.fpInstance) {
      this.fpInstance.setDate(value, false);
    }
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
}
