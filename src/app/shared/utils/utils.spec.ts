import { memoByDeps } from './memo';
import { formatInr, toLocalDateKey } from './format.util';
import { doctorDisplayName, doctorInitial } from './doctor-name.util';
import { extractApiError } from './api-error.util';
import { appointmentDayKey, consultationKind, firstVisitByPatient, isCancelledStatus } from './appointment-analytics';
import { getAppointmentEpochMs, isAppointmentToday } from '../appointment-utils';

describe('memoByDeps', () => {
  it('recomputes only when a dependency changes', () => {
    let items = [1, 2, 3];
    let term = 'a';
    let calls = 0;
    const get = memoByDeps(() => { calls++; return items.filter((n) => n > 1); }, () => [items, term]);

    const first = get();
    expect(get()).toBe(first);
    expect(calls).toBe(1);

    term = 'b';
    get();
    expect(calls).toBe(2);

    items = [5];
    expect(get()).toEqual([5]);
    expect(calls).toBe(3);
  });
});

describe('format utils', () => {
  it('toLocalDateKey uses the local calendar date', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
  });

  it('formatInr formats Indian rupees and treats empty values as zero', () => {
    expect(formatInr(1500)).toBe('₹1,500');
    expect(formatInr(1500, 2)).toBe('₹1,500.00');
    expect(formatInr(null)).toBe('₹0');
    expect(formatInr('250')).toBe('₹250');
  });
});

describe('doctor name utils', () => {
  it('adds a single "Dr." prefix', () => {
    expect(doctorDisplayName({ firstName: 'Asha', lastName: 'Rao' })).toBe('Dr. Asha Rao');
    expect(doctorDisplayName({ name: 'Dr Asha Rao' })).toBe('Dr. Asha Rao');
    expect(doctorDisplayName({ name: 'dr. asha' })).toBe('Dr. asha');
    expect(doctorDisplayName({})).toBe('');
    expect(doctorDisplayName(null)).toBe('');
  });

  it('initial ignores the prefix', () => {
    expect(doctorInitial({ name: 'Dr. asha' })).toBe('A');
    expect(doctorInitial(undefined)).toBe('?');
  });
});

describe('extractApiError', () => {
  it('prefers string body, then message, then error, then fallback', () => {
    expect(extractApiError({ error: 'Plain' }, 'fb')).toBe('Plain');
    expect(extractApiError({ error: { message: 'Msg' } }, 'fb')).toBe('Msg');
    expect(extractApiError({ error: { error: 'Err' } }, 'fb')).toBe('Err');
    expect(extractApiError({}, 'fb')).toBe('fb');
    expect(extractApiError(null, 'fb')).toBe('fb');
  });
});

describe('appointment utils', () => {
  it('parses times with or without seconds', () => {
    const a = getAppointmentEpochMs({ appointmentDate: '2026-03-01', appointmentTime: '09:30' });
    const b = getAppointmentEpochMs({ appointmentDate: '2026-03-01', appointmentTime: '09:30:00' });
    expect(a).toBeGreaterThan(0);
    expect(a).toBe(b);
    expect(getAppointmentEpochMs({ appointmentDate: '', appointmentTime: '09:30' })).toBe(0);
  });

  it('detects today against an injected clock', () => {
    const now = new Date(2026, 2, 1, 12);
    expect(isAppointmentToday({ appointmentDate: '2026-03-01', appointmentTime: '18:00' }, now)).toBeTrue();
    expect(isAppointmentToday({ appointmentDate: '2026-03-02', appointmentTime: '18:00' }, now)).toBeFalse();
  });
});

describe('appointment analytics', () => {
  const appts = [
    { patientId: 1, appointmentDate: '2026-01-10', status: 'COMPLETED', reason: 'checkup' },
    { patientId: 1, appointmentDate: '2026-02-10', status: 'COMPLETED', reason: 'review' },
    { patientId: 2, appointmentDate: '2026-02-11', status: 'CANCELLED', reason: '' },
    { patientId: 3, appointmentDate: '2026-02-12T10:00:00', status: 'BOOKED', reason: 'lab results' },
  ];

  it('normalises day keys and cancellation', () => {
    expect(appointmentDayKey('2026-02-12T10:00:00')).toBe('2026-02-12');
    expect(appointmentDayKey(undefined)).toBeNull();
    expect(isCancelledStatus('CANCELLED_BY_DOCTOR')).toBeTrue();
  });

  it('classifies consultations', () => {
    const first = firstVisitByPatient(appts);
    expect(first.get(1)).toBe('2026-01-10');
    expect(first.has(2)).toBeFalse(); // cancelled visits don't count
    expect(consultationKind(appts[0], first)).toBe('New Patient');
    expect(consultationKind(appts[1], first)).toBe('Follow-up');
    expect(consultationKind(appts[3], first)).toBe('Lab Review');
  });
});
