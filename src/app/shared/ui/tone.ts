/** Semantic colour tones shared by the ui primitives (stat-card, pill, icon-button). */
export type UiTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Tinted background + readable text, with a light/dark pair for each tone. */
export const TONE_SOFT: Record<UiTone, string> = {
  primary: 'bg-[var(--primary-soft)] text-[var(--primary)]',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-400',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  neutral: 'bg-gray-500/10 text-gray-600 dark:text-gray-300',
};

/** Matching border colour for outlined chips. */
export const TONE_BORDER: Record<UiTone, string> = {
  primary: 'border-[var(--primary)]/30',
  success: 'border-emerald-500/25',
  warning: 'border-amber-500/25',
  danger: 'border-red-500/25',
  info: 'border-sky-500/25',
  neutral: 'border-gray-500/20',
};
