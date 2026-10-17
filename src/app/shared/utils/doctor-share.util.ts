import { ToastService } from '../../core/services/toast.service';
import { doctorDisplayName } from './doctor-name.util';

interface ShareableDoctor {
  username: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  specialization?: string | null;
}

/** Link to a doctor's profile in this app. Holds only the doctor's username, never anything about the sharer. */
export function doctorShareUrl(username: string): string {
  return `${window.location.origin}/patient/doctor/${encodeURIComponent(username)}`;
}

/**
 * Phones and tablets: the system share sheet (WhatsApp, SMS, ...). Desktop, or when sharing is unavailable:
 * copy the link. Someone opening it without being logged in is asked to log in, then lands on the doctor.
 */
export async function shareDoctorProfile(doctor: ShareableDoctor, toast: ToastService): Promise<void> {
  const url = doctorShareUrl(doctor.username);
  const name = doctorDisplayName(doctor) || 'a doctor';
  const text = doctor.specialization ? `${name} (${doctor.specialization}) on CareSync` : `${name} on CareSync`;

  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  const touchDevice = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  if (touchDevice && typeof nav.share === 'function') {
    try {
      await nav.share({ title: name, text, url });
      return;
    } catch (err) {
      // Closing the share sheet is not an error; anything else falls back to copying
      if ((err as DOMException)?.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.showSuccess('Link copied. Anyone you send it to can open this doctor after logging in.');
  } catch {
    toast.showInfo(`Copy this link: ${url}`);
  }
}
