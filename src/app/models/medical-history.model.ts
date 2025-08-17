export interface MedicalHistory {
  id: number;
  patientId: number;
  doctorId?: number;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalHistoryCreate {
  patientId: number;
  doctorId?: number;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
}

export interface MedicalHistoryUpdate extends MedicalHistoryCreate {}

export interface MedicalHistoryUpdate {
  patientId: number;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
}

export interface MedicalHistoryFilter {
  startDate?: string;
  endDate?: string;
  diagnosis?: string;
  limit?: number;
}

export interface MedicalHistorySummary {
  totalVisits: number;
  lastVisit: string;
  commonDiagnoses: string[];
  activeConditions: string[];
  medications: string[];
  allergies: string[];
  recentVisits: MedicalHistory[];
}
