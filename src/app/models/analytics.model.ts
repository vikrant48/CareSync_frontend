export interface AnalyticsData {
  doctorId: number;
  startDate: string;
  endDate: string;
}

export interface PeakHoursAnalysis {
  doctorId: number;
  startDate: string;
  endDate: string;
  peakHours: PeakHourData[];
  totalAppointments: number;
  averageAppointmentsPerHour: number;
}

export interface PeakHourData {
  hour: number;
  appointmentCount: number;
  percentage: number;
  timeSlot: string;
}

export interface DayOfWeekAnalysis {
  doctorId: number;
  startDate: string;
  endDate: string;
  dayOfWeekData: DayOfWeekData[];
  totalAppointments: number;
  averageAppointmentsPerDay: number;
}

export interface DayOfWeekData {
  day: string;
  appointmentCount: number;
  percentage: number;
  dayNumber: number;
}

export interface PatientRetentionAnalysis {
  doctorId: number;
  retentionRate: number;
  totalPatients: number;
  returningPatients: number;
  newPatients: number;
  retentionByMonth: RetentionByMonth[];
}

export interface RetentionByMonth {
  month: string;
  retentionRate: number;
  totalPatients: number;
  returningPatients: number;
  newPatients: number;
}

export interface PatientRetentionData {
  patientId: number;
  patientName: string;
  totalVisits: number;
  lastVisitDate: string;
  retentionScore: number;
}

export interface AppointmentDurationAnalysis {
  doctorId: number;
  startDate: string;
  endDate: string;
  averageDuration: number;
  durationBreakdown: DurationBreakdown[];
  totalAppointments: number;
}

export interface DurationBreakdown {
  durationRange: string;
  appointmentCount: number;
  percentage: number;
}

export interface FeedbackSentimentAnalysis {
  doctorId: number;
  positiveSentiment: number;
  negativeSentiment: number;
  neutralSentiment: number;
  totalFeedbacks: number;
  sentimentTrends: SentimentTrend[];
}

export interface SentimentTrend {
  month: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface SeasonalTrendsAnalysis {
  doctorId: number;
  year: number;
  seasonalData: SeasonalData[];
  totalAppointments: number;
  averageAppointmentsPerSeason: number;
}

export interface SeasonalData {
  season: string;
  appointmentCount: number;
  percentage: number;
  months: string[];
}

export interface PatientDemographicsAnalysis {
  doctorId: number;
  ageGroups: AgeGroupData[];
  genderDistribution: GenderData[];
  totalPatients: number;
}

export interface AgeGroupData {
  ageGroup: string;
  patientCount: number;
  percentage: number;
}

export interface GenderData {
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

export interface CancellationPatternsAnalysis {
  doctorId: number;
  startDate: string;
  endDate: string;
  cancellationRate: number;
  totalAppointments: number;
  cancelledAppointments: number;
  cancellationReasons: CancellationReason[];
  cancellationByDay: CancellationByDay[];
}

export interface CancellationReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface CancellationByDay {
  day: string;
  cancellationCount: number;
  totalAppointments: number;
  cancellationRate: number;
}

export interface CancellationByHour {
  hour: number;
  totalAppointments: number;
  cancelledAppointments: number;
  cancellationRate: number;
}
