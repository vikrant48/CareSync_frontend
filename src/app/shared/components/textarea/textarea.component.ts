import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type TextareaState = 'default' | 'success' | 'error';
export type TextareaResize = 'none' | 'vertical' | 'both';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ],
  template: `
    <div class="w-full flex flex-col space-y-1.5">
      <!-- Header Label & Char Counter -->
      <div class="flex items-center justify-between text-xs">
        <label *ngIf="label" class="font-semibold text-[#9aa3b8] flex items-center gap-1">
          <span>{{ label }}</span>
          <span *ngIf="required" class="text-rose-400 font-bold">*</span>
        </label>
        <span *ngIf="showCharCount && maxLength" class="text-[#9aa3b8]/70 font-mono text-[11px]">
          {{ value.length }}/{{ maxLength }}
        </span>
      </div>

      <!-- Textarea HTML Element -->
      <textarea
        [rows]="rows"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readOnly]="readonly"
        [attr.maxlength]="maxLength || null"
        [value]="value"
        (input)="onTextareaChange($event)"
        (blur)="onBlur()"
        [ngClass]="[
          'w-full bg-[#151b2b] text-[#f5f7ff] placeholder-[#9aa3b8]/50 text-sm rounded-xl p-3 border transition-all duration-200 focus:outline-none custom-scrollbar',
          getResizeClasses(),
          disabled ? 'opacity-50 cursor-not-allowed bg-[#151b2b]/50' : '',
          getStateClasses()
        ]"
      ></textarea>

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
export class TextareaComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() rows = 4;
  @Input() maxLength?: number;
  @Input() showCharCount = true;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() state: TextareaState = 'default';
  @Input() resize: TextareaResize = 'vertical';

  @Output() valueChange = new EventEmitter<string>();

  value = '';

  onChange: (val: string) => void = () => { };
  onTouched: () => void = () => { };

  onTextareaChange(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value = val;
    this.onChange(val);
    this.valueChange.emit(val);
  }

  onBlur() {
    this.onTouched();
  }

  getResizeClasses(): string {
    switch (this.resize) {
      case 'none':
        return 'resize-none';
      case 'both':
        return 'resize';
      case 'vertical':
      default:
        return 'resize-y';
    }
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
