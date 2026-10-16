import { toLocalDateKey } from './format.util';

interface AnalyticsAppointment {
  patientId: number;
  appointmentDate?: string;
  status?: string;
  reason?: string;
}

/** `YYYY-MM-DD` for an appointment date string (ISO date/datetime or anything `Date` parses); null if unusable. */
export function appointmentDayKey(value: string | undefined | null): string | null {
  if (!value) return null;
  const iso = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return toLocalDateKey(parsed);
}

export function isCancelledStatus(status?: string | null): boolean {
  return String(status || '').toUpperCase().includes('CANCEL');
}

/** Earliest non-cancelled visit day for each patient. */
export function firstVisitByPatient(appointments: readonly AnalyticsAppointment[]): Map<number, string> {
  const first = new Map<number, string>();
  for (const appointment of appointments) {
    if (isCancelledStatus(appointment.status) || appointment.patientId == null) continue;
    const day = appointmentDayKey(appointment.appointmentDate);
    if (!day) continue;
    const current = first.get(appointment.patientId);
    if (!current || day < current) first.set(appointment.patientId, day);
  }
  return first;
}

/** Bucket used by the consultation-type breakdowns. */
export function consultationKind(appointment: AnalyticsAppointment, firstVisits: Map<number, string>): string {
  const reason = (appointment.reason || '').toLowerCase();
  if (reason.includes('lab')) return 'Lab Review';
  const day = appointmentDayKey(appointment.appointmentDate);
  const earliest = firstVisits.get(appointment.patientId);
  if (reason.includes('follow') || (earliest && day && day !== earliest)) return 'Follow-up';
  if (earliest && day === earliest) return 'New Patient';
  return 'Others';
}
