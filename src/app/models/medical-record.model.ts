export interface MedicalRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  visitDate: Date;
  symptoms: string[];
  diagnosis: string;
  treatment: Treatment[];
  prescriptions?: Prescription[];
  vitalSigns?: VitalSigns;
  notes?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Treatment {
  id: string;
  name: string;
  description: string;
  duration?: string;
  frequency?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface VitalSigns {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface CreateMedicalRecordRequest {
  appointmentId: string;
  symptoms: string[];
  diagnosis: string;
  treatment: Omit<Treatment, 'id'>[];
  prescriptions?: Omit<Prescription, 'id'>[];
  vitalSigns?: VitalSigns;
  notes?: string;
  followUpDate?: Date;
}

export interface UpdateMedicalRecordRequest {
  symptoms?: string[];
  diagnosis?: string;
  treatment?: Treatment[];
  prescriptions?: Prescription[];
  vitalSigns?: VitalSigns;
  notes?: string;
  followUpDate?: Date;
}

export interface MedicalRecordSummary {
  id: string;
  patientName: string;
  patientId: string;
  visitDate: Date;
  diagnosis: string;
  doctorName: string;
}

export interface TodayAppointmentForRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  appointmentTime: string;
  appointmentDate: Date;
  status: 'CONFIRMED';
  hasExistingRecord: boolean;
  medicalRecordId?: string;
}

export enum MedicalRecordStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED'
}

export interface CommonSymptoms {
  category: string;
  symptoms: string[];
}

export const COMMON_SYMPTOMS: CommonSymptoms[] = [
  {
    category: 'General',
    symptoms: ['Fever', 'Fatigue', 'Headache', 'Nausea', 'Vomiting', 'Dizziness']
  },
  {
    category: 'Respiratory',
    symptoms: ['Cough', 'Shortness of breath', 'Chest pain', 'Sore throat', 'Runny nose']
  },
  {
    category: 'Gastrointestinal',
    symptoms: ['Abdominal pain', 'Diarrhea', 'Constipation', 'Loss of appetite', 'Heartburn']
  },
  {
    category: 'Musculoskeletal',
    symptoms: ['Joint pain', 'Muscle pain', 'Back pain', 'Stiffness', 'Swelling']
  },
  {
    category: 'Neurological',
    symptoms: ['Dizziness', 'Memory problems', 'Numbness', 'Tingling', 'Weakness']
  }
];

export const COMMON_TREATMENTS = [
  'Rest and hydration',
  'Physical therapy',
  'Medication therapy',
  'Lifestyle modifications',
  'Follow-up monitoring',
  'Surgical consultation',
  'Dietary changes',
  'Exercise program'
];