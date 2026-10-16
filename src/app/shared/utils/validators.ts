import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toLocalDateKey } from './format.util';

/**
 * Shared form validators. They are deliberately lenient (they only reject clearly wrong input)
 * so they never contradict the backend's own rules. Empty values pass; combine with
 * Validators.required where a field is mandatory.
 */
export class AppValidators {
  /**
   * Phone number with an optional country-code prefix ("+91 98765 43210").
   * A bare prefix ("+91 ") counts as empty. Otherwise the national part must be `digits` long.
   */
  static phone(digits = 10, countryCode = '91'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = String(control.value ?? '').replace(/[\s-]/g, '');
      if (!raw || raw === '+' || raw === `+${countryCode}`) return null;
      const national = raw.startsWith(`+${countryCode}`) ? raw.slice(countryCode.length + 1) : raw.replace(/^\+/, '');
      return /^\d+$/.test(national) && national.length === digits ? null : { phone: { digits } };
    };
  }

  /** Date (YYYY-MM-DD or anything Date parses) that is not after today. */
  static notInFuture(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const key = AppValidators.dateKey(control.value);
      return key && key > toLocalDateKey() ? { futureDate: true } : null;
    };
  }

  /** Date (YYYY-MM-DD) that is today or later. */
  static notInPast(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const key = AppValidators.dateKey(control.value);
      return key && key < toLocalDateKey() ? { pastDate: true } : null;
    };
  }

  /** Date of birth no more than `years` ago. */
  static maxAge(years = 120): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const key = AppValidators.dateKey(control.value);
      if (!key) return null;
      const limit = new Date();
      limit.setFullYear(limit.getFullYear() - years);
      return key < toLocalDateKey(limit) ? { tooOld: { years } } : null;
    };
  }

  /** No whitespace anywhere (usernames, ids). */
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      control.value && /\s/.test(String(control.value)) ? { whitespace: true } : null;
  }

  /** Required, and not just spaces. */
  static requiredText(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      String(control.value ?? '').trim() ? null : { required: true };
  }

  private static dateKey(value: unknown): string | null {
    if (!value) return null;
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : toLocalDateKey(d);
  }
}

/**
 * Standard user-facing message for the first error on a control.
 * `label` is the field name used in "X is required."
 */
export function validationMessage(control: AbstractControl | null | undefined, label: string): string {
  const e = control?.errors;
  if (!e) return '';
  if (e['required']) return `${label} is required.`;
  if (e['email']) return 'Enter a valid email address.';
  if (e['minlength']) return `${label} must be at least ${e['minlength'].requiredLength} characters.`;
  if (e['maxlength']) return `${label} must be at most ${e['maxlength'].requiredLength} characters.`;
  if (e['min']) return `${label} must be at least ${e['min'].min}.`;
  if (e['max']) return `${label} must be at most ${e['max'].max}.`;
  if (e['phone']) return `Enter a valid ${e['phone'].digits}-digit mobile number.`;
  if (e['futureDate']) return `${label} can't be in the future.`;
  if (e['pastDate']) return `${label} can't be in the past.`;
  if (e['tooOld']) return `Enter a ${label.toLowerCase()} within the last ${e['tooOld'].years} years.`;
  if (e['whitespace']) return `${label} can't contain spaces.`;
  if (e['pattern']) return `Enter a valid ${label.toLowerCase()}.`;
  return `Check ${label.toLowerCase()}.`;
}
