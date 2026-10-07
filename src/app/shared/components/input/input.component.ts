import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type InputState = 'default' | 'success' | 'error';

@Component({
    selector: 'app-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true
        }
    ],
    template: `
    <div class="w-full flex flex-col space-y-1.5">
      <!-- Label -->
      <label *ngIf="label" class="text-xs font-semibold text-[#9aa3b8] flex items-center gap-1">
        <span>{{ label }}</span>
        <span *ngIf="required" class="text-rose-400 font-bold">*</span>
      </label>

      <!-- Input Field Wrapper -->
      <div class="relative flex items-center w-full">
        <!-- Left Icon -->
        <div *ngIf="leftIcon" class="absolute left-3.5 text-[#9aa3b8] pointer-events-none flex items-center justify-center text-sm">
          <i [class]="leftIcon"></i>
        </div>

        <!-- HTML Input Element -->
        <input
          [type]="actualType"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readOnly]="readonly"
          [value]="value"
          (input)="onInputChange($event)"
          (blur)="onBlur()"
          [ngClass]="[
            'w-full bg-[#151b2b] text-[#f5f7ff] placeholder-[#9aa3b8]/50 text-sm rounded-xl py-2.5 px-3.5 border transition-all duration-200 focus:outline-none',
            leftIcon ? '!pl-10' : '',
            rightIcon || clearable || type === 'password' ? '!pr-10' : '',
            disabled ? 'opacity-50 cursor-not-allowed bg-[#151b2b]/50' : '',
            getStateClasses()
          ]"
        />

        <!-- Right Icon / Password Toggle / Clear Button -->
        <div class="absolute right-3.5 flex items-center gap-2 text-[#9aa3b8]">
          <!-- Clearable Button -->
          <button
            *ngIf="clearable && value && !disabled && !readonly"
            type="button"
            (click)="onClear()"
            class="hover:text-white transition-colors focus:outline-none"
            title="Clear text"
          >
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>

          <!-- Password Toggle -->
          <button
            *ngIf="type === 'password'"
            type="button"
            (click)="togglePasswordVisibility()"
            class="hover:text-white transition-colors focus:outline-none"
          >
            <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-sm"></i>
          </button>

          <!-- Right Icon -->
          <i *ngIf="rightIcon && type !== 'password'" [class]="rightIcon" class="text-sm pointer-events-none"></i>
        </div>
      </div>

      <!-- Helper / Error Message -->
      <div *ngIf="errorMessage || helperText" class="text-xs">
        <p *ngIf="errorMessage" class="text-rose-400 flex items-center gap-1 font-medium">
          <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
          <span>{{ errorMessage }}</span>
        </p>
        <p *ngIf="!errorMessage && helperText" class="text-[#9aa3b8]/80">
          {{ helperText }}
        </p>
      </div>
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
    @Input() type: 'text' | 'email' | 'password' | 'phone' | 'search' | 'number' = 'text';
    @Input() label?: string;
    @Input() placeholder = '';
    @Input() helperText?: string;
    @Input() errorMessage?: string;
    @Input() required = false;
    @Input() disabled = false;
    @Input() readonly = false;
    @Input() clearable = false;
    @Input() leftIcon?: string;
    @Input() rightIcon?: string;
    @Input() state: InputState = 'default';

    @Output() valueChange = new EventEmitter<string>();
    @Output() clear = new EventEmitter<void>();

    value = '';
    showPassword = false;

    onChange: (val: string) => void = () => { };
    onTouched: () => void = () => { };

    get actualType(): string {
        if (this.type === 'password') {
            return this.showPassword ? 'text' : 'password';
        }
        return this.type;
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    onInputChange(event: Event) {
        const val = (event.target as HTMLInputElement).value;
        this.value = val;
        this.onChange(val);
        this.valueChange.emit(val);
    }

    onBlur() {
        this.onTouched();
    }

    onClear() {
        this.value = '';
        this.onChange('');
        this.valueChange.emit('');
        this.clear.emit();
    }

    getStateClasses(): string {
        if (this.errorMessage || this.state === 'error') {
            return 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20';
        }
        if (this.state === 'success') {
            return 'border-emerald-500/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
        }
        return 'border-[#2a3347] focus:border-[#5b6cf0] focus:ring-2 focus:ring-[#5b6cf0]/20 hover:border-[#3b4763]';
    }

    // ControlValueAccessor Interface
    writeValue(value: any): void {
        this.value = value !== null && value !== undefined ? String(value) : '';
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
