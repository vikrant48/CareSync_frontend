export interface VitalStatus {
  label: string;
  class: string;
  icon: string;
}

// Shared, frozen status objects: the helpers below are called several times per render from the
// templates, so they return these constants instead of building a new object on every call.
const noData: VitalStatus = Object.freeze({
  label: 'No Data',
  class: 'text-slate-700 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
  icon: 'fa-minus',
});

const NORMAL_DOWN: VitalStatus = Object.freeze({ label: 'Normal', class: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-arrow-down' });
const NORMAL_FLAT: VitalStatus = Object.freeze({ label: 'Normal', class: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-minus' });
const ELEVATED: VitalStatus = Object.freeze({ label: 'Elevated', class: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20', icon: 'fa-arrow-up' });
const HIGH: VitalStatus = Object.freeze({ label: 'High', class: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20', icon: 'fa-arrow-up' });
const STABLE: VitalStatus = Object.freeze({ label: 'Stable', class: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-arrow-down' });
const FEVER: VitalStatus = Object.freeze({ label: 'Fever', class: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20', icon: 'fa-arrow-up' });

export function getBPStatus(systolic?: number, diastolic?: number): VitalStatus {
  if (!systolic || !diastolic) return noData;
  if (systolic <= 120 && diastolic <= 80) return NORMAL_DOWN;
  if (systolic <= 130 && diastolic <= 85) return ELEVATED;
  return HIGH;
}

export function getSugarStatus(level?: number): VitalStatus {
  if (!level) return noData;
  if (level <= 100) return NORMAL_DOWN;
  if (level <= 125) return ELEVATED;
  return HIGH;
}

export function getWeightStatus(weight?: number): VitalStatus {
  if (!weight) return noData;
  return STABLE;
}

export function getTempStatus(temp?: number): VitalStatus {
  if (!temp) return noData;
  if (temp <= 99.0) return NORMAL_FLAT;
  return FEVER;
}
