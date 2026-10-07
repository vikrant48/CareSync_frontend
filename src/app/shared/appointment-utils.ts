import { PatientAppointmentItem } from '../core/services/appointment.service';

// Date/time helpers used across patient components
export function getAppointmentEpochMs(a: PatientAppointmentItem): number {
  const iso = `${a.appointmentDate}T${a.appointmentTime}:00`;
  const d = new Date(iso);
  return d.getTime();
}

export function isAppointmentToday(a: PatientAppointmentItem): boolean {
  const d = new Date(`${a.appointmentDate}T${a.appointmentTime}:00`);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function isAppointmentFuture(a: PatientAppointmentItem): boolean {
  if (!a.appointmentDate) return false;
  const parts = a.appointmentDate.split('-').map(Number);
  if (parts.length < 3) return false;
  const apptDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return apptDate.getTime() > today.getTime();
}

// Status helpers for consistent chips/styles and labels
export function getAppointmentStatusClass(status: string): Record<string, boolean> {
  const s = (status || '').trim().toUpperCase();
  return {
    'bg-green-700 text-white': s === 'CONFIRMED' || s === 'COMPLETED',
    'bg-yellow-700 text-white': s === 'BOOKED' || s === 'SCHEDULED' || s === 'RESCHEDULED',
    'bg-red-700 text-white': s === 'CANCELLED',
    'bg-gray-700 text-white': !s,
  };
}

export function getAppointmentStatusLabel(status?: string): string {
  const s = (status || '').trim().toUpperCase();
  switch (s) {
    case 'BOOKED':
      return 'Booked';
    case 'SCHEDULED':
      return 'Scheduled';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'RESCHEDULED':
      return 'Rescheduled';
    case 'CANCELLED':
      return 'Cancelled';
    case 'COMPLETED':
      return 'Completed';
    default:
      return 'Unknown';
  }
}