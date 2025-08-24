export enum AppointmentStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  copay: number;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDateTime: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  insurance?: Insurance;
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  doctor?: {
    id: number;
    firstName: string;
    lastName: string;
    specialization: string;
    email: string;
    phoneNumber: string;
  };
}

export interface AppointmentCreate {
  doctorId: number;
  appointmentDateTime: string;
  reason: string;
  notes?: string;
}

export interface AppointmentUpdate {
  doctorId: number;
  appointmentDateTime: string;
  reason: string;
  notes?: string;
}

export interface AppointmentFilter {
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
  doctorId?: number;
  patientId?: number;
}

export interface AvailableSlot {
  date: string;
  timeSlots: string[];
  doctorId: number;
}

export interface AppointmentStatistics {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  averageAppointmentsPerDay: number;
  mostPopularTimeSlots: string[];
  mostPopularDays: string[];
}

export interface DoctorSchedule {
  doctorId: number;
  date: string;
  appointments: Appointment[];
  availableSlots: string[];
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
}

export interface MedicalHistory {
  id: number;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
}

export interface DoctorAppointment {
  appointmentId: number;
  patientName: string;
  patientEmail: string;
  patientContactInfo: string;
  patientIllnessDetails: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'PENDING' | 'SCHEDULED' | 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  reason: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  statusChangedBy: string;
  medicalHistory: MedicalHistory[];
}
