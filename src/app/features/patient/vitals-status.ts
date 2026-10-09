export interface VitalStatus {
  label: string;
  class: string;
  icon: string;
}

const noData: VitalStatus = {
  label: 'No Data',
  class: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  icon: 'fa-minus',
};

export function getBPStatus(systolic?: number, diastolic?: number): VitalStatus {
  if (!systolic || !diastolic) return noData;
  if (systolic <= 120 && diastolic <= 80) {
    return { label: 'Normal', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-arrow-down' };
  }
  if (systolic <= 130 && diastolic <= 85) {
    return { label: 'Elevated', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: 'fa-arrow-up' };
  }
  return { label: 'High', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: 'fa-arrow-up' };
}

export function getSugarStatus(level?: number): VitalStatus {
  if (!level) return noData;
  if (level <= 100) {
    return { label: 'Normal', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-arrow-down' };
  }
  if (level <= 125) {
    return { label: 'Elevated', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: 'fa-arrow-up' };
  }
  return { label: 'High', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: 'fa-arrow-up' };
}

export function getWeightStatus(weight?: number): VitalStatus {
  if (!weight) return noData;
  return { label: 'Stable', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-arrow-down' };
}

export function getTempStatus(temp?: number): VitalStatus {
  if (!temp) return noData;
  if (temp <= 99.0) {
    return { label: 'Normal', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: 'fa-minus' };
  }
  return { label: 'Fever', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: 'fa-arrow-up' };
}
