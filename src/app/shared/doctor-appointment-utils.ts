import { DoctorAppointmentItem } from '../core/services/appointment.service';

// Returns epoch milliseconds for a DoctorAppointmentItem using robust parsing.
export function getDoctorAppointmentEpochMs(a: DoctorAppointmentItem): number {
  const dateStr = (a.appointmentDate || '').trim();
  const timeStrRaw = (a.appointmentTime || '').trim();
  if (!dateStr) return 0;

  const timeCandidates = [timeStrRaw, timeStrRaw ? `${timeStrRaw}:00` : ''];
  for (const t of timeCandidates) {
    if (t) {
      const dt = Date.parse(`${dateStr}T${t}`);
      if (!Number.isNaN(dt)) return dt;
    }
  }
  const fallback = Date.parse(dateStr);
  return Number.isNaN(fallback) ? 0 : fallback;
}

export function isDoctorAppointmentToday(a: DoctorAppointmentItem, now = new Date()): boolean {
  const ms = getDoctorAppointmentEpochMs(a);
  if (!ms) return false;
  const d = new Date(ms);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}