import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Label + control + hint/error wrapper for the `.form-input` system.
 *
 * Give the projected control the same id as `forId` so the label is bound, and wire
 * the messages with `[attr.aria-describedby]="field.describedBy"` and
 * `[attr.aria-invalid]="!!error"`, e.g.:
 *
 *   <app-form-field #f label="Email" forId="email" [required]="true" [error]="emailError">
 *     <input id="email" class="form-input" [attr.aria-describedby]="f.describedBy"
 *            [attr.aria-invalid]="!!emailError" />
 *   </app-form-field>
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <label *ngIf="label" class="form-label" [attr.for]="forId || null">
      {{ label }}
      <span *ngIf="required" class="text-red-500" aria-hidden="true"> *</span>
      <span *ngIf="required" class="sr-only"> (required)</span>
    </label>
    <ng-content></ng-content>
    <p *ngIf="error" class="form-error" role="alert" [id]="errorId">{{ error }}</p>
    <p *ngIf="!error && hint" class="form-hint" [id]="hintId">{{ hint }}</p>
    <p *ngIf="max" class="form-hint text-right">{{ count }}/{{ max }}</p>
  `,
})
export class FormFieldComponent {
  @Input() label = '';
  /** id of the projected control (binds the label) */
  @Input() forId = '';
  @Input() required = false;
  @Input() error = '';
  @Input() hint = '';
  /** Optional character counter */
  @Input() count = 0;
  @Input() max = 0;

  get errorId(): string { return this.forId ? `${this.forId}-error` : ''; }
  get hintId(): string { return this.forId ? `${this.forId}-hint` : ''; }

  /** Value for the control's aria-describedby */
  get describedBy(): string | null {
    const id = this.error ? this.errorId : this.hint ? this.hintId : '';
    return id || null;
  }
}
