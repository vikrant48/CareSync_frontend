import { DoctorAppointmentItem, PatientAppointmentItem } from '../core/services/appointment.service';

type AppointmentLike = Pick<PatientAppointmentItem | DoctorAppointmentItem, 'appointmentDate' | 'appointmentTime'>;

/**
 * Epoch milliseconds for an appointment's date + time.
 * Accepts times with or without seconds ("09:30" / "09:30:00"); falls back to the date alone,
 * and returns 0 when the date is missing or unparseable.
 */
export function getAppointmentEpochMs(a: AppointmentLike): number {
  const dateStr = (a.appointmentDate || '').trim();
  const timeStr = (a.appointmentTime || '').trim();
  if (!dateStr) return 0;

  const candidates = timeStr ? [timeStr, `${timeStr}:00`] : [];
  for (const t of candidates) {
    const parsed = Date.parse(`${dateStr}T${t}`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const fallback = Date.parse(dateStr);
  return Number.isNaN(fallback) ? 0 : fallback;
}

export function isAppointmentToday(a: AppointmentLike, now = new Date()): boolean {
  const ms = getAppointmentEpochMs(a);
  if (!ms) return false;
  const d = new Date(ms);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function isAppointmentFuture(a: AppointmentLike, now = new Date()): boolean {
  if (!a.appointmentDate) return false;
  const parts = a.appointmentDate.split('-').map(Number);
  if (parts.length < 3) return false;
  const apptDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return apptDate.getTime() > today.getTime();
}
