export interface ReportRequest {
  startDate: string;
  endDate: string;
  reportType: string;
  format?: 'PDF' | 'EXCEL' | 'CSV';
}

export interface DoctorPerformanceReport {
  doctorId: number;
  startDate: string;
  endDate: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  revenue: number;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  appointmentCompletionRate: number;
  patientSatisfactionRate: number;
  averageAppointmentDuration: number;
  patientRetentionRate: number;
  revenuePerAppointment: number;
}

export interface PatientAnalyticsReport {
  patientId: number;
  totalVisits: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  healthTrends: HealthTrend[];
  appointmentHistory: AppointmentHistory[];
  medicalSummary: MedicalSummary;
}

export interface HealthTrend {
  month: string;
  visitCount: number;
  commonDiagnoses: string[];
  averageRating: number;
}

export interface AppointmentHistory {
  date: string;
  doctorName: string;
  specialization: string;
  status: string;
  rating?: number;
}

export interface MedicalSummary {
  totalConditions: number;
  activeConditions: string[];
  medications: string[];
  allergies: string[];
  lastVisit: string;
}

export interface ClinicOverviewReport {
  startDate: string;
  endDate: string;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  averageRating: number;
  topSpecializations: SpecializationData[];
  monthlyTrends: MonthlyTrend[];
}

export interface SpecializationData {
  specialization: string;
  doctorCount: number;
  appointmentCount: number;
  averageRating: number;
  revenue: number;
}

export interface MonthlyTrend {
  month: string;
  appointments: number;
  revenue: number;
  newPatients: number;
  averageRating: number;
}

export interface AppointmentTrendsReport {
  startDate: string;
  endDate: string;
  totalAppointments: number;
  appointmentTrends: AppointmentTrend[];
  peakHours: PeakHourData[];
  popularDays: PopularDayData[];
  cancellationTrends: CancellationTrend[];
}

export interface AppointmentTrend {
  date: string;
  appointmentCount: number;
  completedCount: number;
  cancelledCount: number;
  revenue: number;
}

export interface PeakHourData {
  hour: number;
  appointmentCount: number;
  percentage: number;
}

export interface PopularDayData {
  day: string;
  appointmentCount: number;
  percentage: number;
}

export interface CancellationTrend {
  date: string;
  totalAppointments: number;
  cancelledAppointments: number;
  cancellationRate: number;
}

export interface SpecializationAnalysisReport {
  specializations: SpecializationAnalysis[];
  totalDoctors: number;
  totalAppointments: number;
  averageRating: number;
}

export interface SpecializationAnalysis {
  specialization: string;
  doctorCount: number;
  appointmentCount: number;
  averageRating: number;
  revenue: number;
  patientCount: number;
  averageAppointmentDuration: number;
}

export interface PatientDemographicsReport {
  totalPatients: number;
  ageDistribution: AgeDistribution[];
  genderDistribution: GenderDistribution[];
  locationDistribution: LocationDistribution[];
  commonConditions: CommonCondition[];
}

export interface AgeDistribution {
  ageGroup: string;
  patientCount: number;
  percentage: number;
}

export interface GenderDistribution {
  gender: string;
  patientCount: number;
  percentage: number;
}

export interface LocationDistribution {
  location: string;
  patientCount: number;
  percentage: number;
}

export interface CommonCondition {
  condition: string;
  patientCount: number;
  percentage: number;
}

export interface RevenueAnalysisReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  revenueByMonth: RevenueByMonth[];
  revenueBySpecialization: RevenueBySpecialization[];
  revenueByDoctor: RevenueByDoctor[];
  averageRevenuePerAppointment: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  appointmentCount: number;
  averageRevenuePerAppointment: number;
}

export interface RevenueBySpecialization {
  specialization: string;
  revenue: number;
  appointmentCount: number;
  averageRevenuePerAppointment: number;
}

export interface RevenueByDoctor {
  doctorId: number;
  doctorName: string;
  specialization: string;
  revenue: number;
  appointmentCount: number;
  averageRevenuePerAppointment: number;
}
