import { FormControl, Validators } from '@angular/forms';
import { AppValidators, validationMessage } from './validators';
import { toLocalDateKey } from './format.util';

describe('AppValidators', () => {
  const run = (fn: any, value: unknown) => fn(new FormControl(value));

  it('phone accepts an empty prefix or 10 national digits', () => {
    const v = AppValidators.phone(10);
    expect(run(v, '')).toBeNull();
    expect(run(v, '+91 ')).toBeNull();
    expect(run(v, '+91 98765 43210')).toBeNull();
    expect(run(v, '9876543210')).toBeNull();
    expect(run(v, '+91 98765')).toEqual({ phone: { digits: 10 } });
    expect(run(v, 'abc')).toEqual({ phone: { digits: 10 } });
  });

  it('date rules compare against the local calendar date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(run(AppValidators.notInFuture(), toLocalDateKey(tomorrow))).toEqual({ futureDate: true });
    expect(run(AppValidators.notInFuture(), toLocalDateKey())).toBeNull();
    expect(run(AppValidators.notInPast(), toLocalDateKey(yesterday))).toEqual({ pastDate: true });
    expect(run(AppValidators.maxAge(120), '1880-01-01')).toEqual({ tooOld: { years: 120 } });
    expect(run(AppValidators.maxAge(120), '1990-05-20')).toBeNull();
  });

  it('text rules', () => {
    expect(run(AppValidators.noWhitespace(), 'john doe')).toEqual({ whitespace: true });
    expect(run(AppValidators.noWhitespace(), 'johndoe')).toBeNull();
    expect(run(AppValidators.requiredText(), '   ')).toEqual({ required: true });
    expect(run(AppValidators.requiredText(), 'x')).toBeNull();
  });
});

describe('validationMessage', () => {
  it('maps the first error to a readable message', () => {
    const c = new FormControl('', [Validators.required]);
    expect(validationMessage(c, 'First name')).toBe('First name is required.');
    const m = new FormControl('ab', [Validators.minLength(3)]);
    expect(validationMessage(m, 'Username')).toBe('Username must be at least 3 characters.');
    const p = new FormControl('123', [AppValidators.phone(10)]);
    expect(validationMessage(p, 'Mobile number')).toBe('Enter a valid 10-digit mobile number.');
    expect(validationMessage(new FormControl('ok'), 'X')).toBe('');
  });
});
