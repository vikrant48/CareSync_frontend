import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface OverallAnalytics {
  totalAppointments?: number;
  totalDoctors?: number;
  totalPatients?: number;
  activeDoctors?: number;
  activePatients?: number;
  totalUsers?: number;
  activeUsers?: number;
  totalRevenue?: number;
  avgRating?: number;
  appointmentStatusDistribution?: Record<string, number>;
  dailyAppointmentTrends?: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private baseUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  getOverallAnalytics(startDateISO: string, endDateISO: string) {
    return this.http.get<OverallAnalytics>(
      `${this.baseUrl}/api/analytics/overall?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`
    );
  }

  getPeakHours(doctorId: number | string, startDateISO: string, endDateISO: string) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/analytics/doctor/${doctorId}/peak-hours?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`
    );
  }

  getDayOfWeek(doctorId: number | string, startDateISO: string, endDateISO: string) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/analytics/doctor/${doctorId}/day-of-week?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`
    );
  }

  getPatientRetention(doctorId: number | string) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/analytics/doctor/${doctorId}/patient-retention`
    );
  }

  getAppointmentDuration(doctorId: number | string, startDateISO: string, endDateISO: string) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/analytics/doctor/${doctorId}/appointment-duration?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`
    );
  }

  getFeedbackSentiment(doctorId: number | string) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/analytics/doctor/${doctorId}/feedback-sentiment`
    );
  }

  getSeasonalTrends(doctorId: number | string, year: number) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/analytics/doctor/${doctorId}/seasonal-trends?year=${year}`
    );
  }

  getPatientDemographicsByDoctor(doctorId: number | string) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/analytics/doctor/${doctorId}/patient-demographics`
    );
  }

  getCancellationPatterns(doctorId: number | string, startDateISO: string, endDateISO: string) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/analytics/doctor/${doctorId}/cancellation-patterns?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`
    );
  }
}