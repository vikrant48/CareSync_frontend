export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
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
