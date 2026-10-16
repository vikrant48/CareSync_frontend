interface DoctorNameSource {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}

const DR_PREFIX = /^dr\.?\s+/i;

/** Name as stored, without any "Dr" prefix added. Empty string when nothing is known. */
function baseName(d: DoctorNameSource | null | undefined): string {
  if (!d) return '';
  return (d.name || `${d.firstName || ''} ${d.lastName || ''}`).trim() || (d.username || '').trim();
}

/**
 * Display name with a single "Dr." prefix ("Dr. Asha Rao"); never doubles an existing prefix.
 * Returns '' when the doctor has no usable name, so callers can choose their own fallback.
 */
export function doctorDisplayName(d: DoctorNameSource | null | undefined): string {
  const base = baseName(d);
  if (!base) return '';
  return DR_PREFIX.test(base) ? base.replace(/^dr\.?\s+/i, 'Dr. ') : `Dr. ${base}`;
}

/** Upper-case first letter of the name (ignoring "Dr"), or '?' when unknown. */
export function doctorInitial(d: DoctorNameSource | null | undefined): string {
  const stripped = baseName(d).replace(DR_PREFIX, '');
  return (stripped.charAt(0) || '?').toUpperCase();
}
