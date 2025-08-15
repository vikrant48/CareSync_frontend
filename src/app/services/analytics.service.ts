import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PeakHoursAnalysis,
  DayOfWeekAnalysis,
  PatientRetentionAnalysis,
  AppointmentDurationAnalysis,
  FeedbackSentimentAnalysis,
  SeasonalTrendsAnalysis,
  PatientDemographicsAnalysis,
  CancellationPatternsAnalysis
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private baseUrl = `${environment.apiUrl}/api/analytics`;

  constructor(private http: HttpClient) {}

  // Peak Hours Analysis
  getPeakHoursAnalysis(doctorId: number, startDate: string, endDate: string): Observable<PeakHoursAnalysis> {
    return this.http.get<PeakHoursAnalysis>(`${this.baseUrl}/doctor/${doctorId}/peak-hours`, {
      params: { startDate, endDate }
    });
  }

  // Day of Week Analysis
  getDayOfWeekAnalysis(doctorId: number, startDate: string, endDate: string): Observable<DayOfWeekAnalysis> {
    return this.http.get<DayOfWeekAnalysis>(`${this.baseUrl}/doctor/${doctorId}/day-of-week`, {
      params: { startDate, endDate }
    });
  }

  // Patient Retention Analysis
  getPatientRetentionAnalysis(doctorId: number): Observable<PatientRetentionAnalysis> {
    return this.http.get<PatientRetentionAnalysis>(`${this.baseUrl}/doctor/${doctorId}/patient-retention`);
  }

  // Appointment Duration Analysis
  getAppointmentDurationAnalysis(doctorId: number, startDate: string, endDate: string): Observable<AppointmentDurationAnalysis> {
    return this.http.get<AppointmentDurationAnalysis>(`${this.baseUrl}/doctor/${doctorId}/appointment-duration`, {
      params: { startDate, endDate }
    });
  }

  // Feedback Sentiment Analysis
  getFeedbackSentimentAnalysis(doctorId: number): Observable<FeedbackSentimentAnalysis> {
    return this.http.get<FeedbackSentimentAnalysis>(`${this.baseUrl}/doctor/${doctorId}/feedback-sentiment`);
  }

  // Seasonal Trends Analysis
  getSeasonalTrendsAnalysis(doctorId: number, year: number): Observable<SeasonalTrendsAnalysis> {
    return this.http.get<SeasonalTrendsAnalysis>(`${this.baseUrl}/doctor/${doctorId}/seasonal-trends`, {
      params: { year: year.toString() }
    });
  }

  // Patient Demographics Analysis
  getPatientDemographicsAnalysis(doctorId: number): Observable<PatientDemographicsAnalysis> {
    return this.http.get<PatientDemographicsAnalysis>(`${this.baseUrl}/doctor/${doctorId}/patient-demographics`);
  }

  // Cancellation Patterns Analysis
  getCancellationPatternsAnalysis(doctorId: number, startDate: string, endDate: string): Observable<CancellationPatternsAnalysis> {
    return this.http.get<CancellationPatternsAnalysis>(`${this.baseUrl}/doctor/${doctorId}/cancellation-patterns`, {
      params: { startDate, endDate }
    });
  }

  // General Analytics
  getOverallAnalytics(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/overall`, {
      params: { startDate, endDate }
    });
  }

  getClinicAnalytics(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/clinic`, {
      params: { startDate, endDate }
    });
  }

  // Revenue Analytics
  getRevenueAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/revenue`, {
      params: { startDate, endDate }
    });
  }

  getRevenueBySpecialization(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/revenue/specialization`, {
      params: { startDate, endDate }
    });
  }

  getRevenueTrends(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/revenue/trends`, {
      params: { startDate, endDate }
    });
  }

  // Appointment Analytics
  getAppointmentAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/appointments`, {
      params: { startDate, endDate }
    });
  }

  getAppointmentTrends(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/appointments/trends`, {
      params: { startDate, endDate }
    });
  }

  getAppointmentBySpecialization(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/appointments/specialization`, {
      params: { startDate, endDate }
    });
  }

  // Patient Analytics
  getPatientAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/patients`, {
      params: { startDate, endDate }
    });
  }

  getNewPatientTrends(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/patients/new-trends`, {
      params: { startDate, endDate }
    });
  }

  getPatientSatisfactionAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/satisfaction`, {
      params: { startDate, endDate }
    });
  }

  // Performance Analytics
  getDoctorPerformanceAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/performance`, {
      params: { startDate, endDate }
    });
  }

  getDoctorComparisonAnalytics(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctors/comparison`, {
      params: { startDate, endDate }
    });
  }

  getTopPerformers(startDate: string, endDate: string, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctors/top-performers`, {
      params: { startDate, endDate, limit: limit.toString() }
    });
  }

  // Time-based Analytics
  getHourlyAnalytics(doctorId: number, date: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/hourly`, {
      params: { date }
    });
  }

  getDailyAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/daily`, {
      params: { startDate, endDate }
    });
  }

  getWeeklyAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/weekly`, {
      params: { startDate, endDate }
    });
  }

  getMonthlyAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/monthly`, {
      params: { startDate, endDate }
    });
  }

  getYearlyAnalytics(doctorId: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/yearly`, {
      params: { year: year.toString() }
    });
  }

  // Specialization Analytics
  getSpecializationAnalytics(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/specialization`, {
      params: { startDate, endDate }
    });
  }

  getSpecializationComparison(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/specialization/comparison`, {
      params: { startDate, endDate }
    });
  }

  // Location Analytics
  getLocationAnalytics(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/location`, {
      params: { startDate, endDate }
    });
  }

  getLocationTrends(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/location/trends`, {
      params: { startDate, endDate }
    });
  }

  // Quality Metrics
  getQualityMetrics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/quality`, {
      params: { startDate, endDate }
    });
  }

  getPatientOutcomeAnalytics(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/outcomes`, {
      params: { startDate, endDate }
    });
  }

  // Predictive Analytics
  getPredictiveAnalytics(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/predictive`);
  }

  getForecastAnalytics(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/forecast`, {
      params: { startDate, endDate }
    });
  }

  // Custom Analytics
  getCustomAnalytics(doctorId: number, metrics: string[], startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/custom`, {
      params: { 
        metrics: metrics.join(','),
        startDate, 
        endDate 
      }
    });
  }

  // Analytics Export
  exportAnalytics(doctorId: number, type: string, format: 'PDF' | 'EXCEL' | 'CSV', startDate: string, endDate: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/doctor/${doctorId}/export/${type}`, {
      params: { format, startDate, endDate },
      responseType: 'blob'
    });
  }

  exportOverallAnalytics(format: 'PDF' | 'EXCEL' | 'CSV', startDate: string, endDate: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/overall`, {
      params: { format, startDate, endDate },
      responseType: 'blob'
    });
  }

  // Real-time Analytics
  getRealTimeAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/realtime`);
  }

  getLiveDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/live`);
  }

  // Analytics Configuration
  getAnalyticsConfiguration(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/config`);
  }

  updateAnalyticsConfiguration(config: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/config`, config);
  }

  // Analytics Alerts
  getAnalyticsAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/alerts`);
  }

  createAnalyticsAlert(alert: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/alerts`, alert);
  }

  updateAnalyticsAlert(alertId: number, alert: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/alerts/${alertId}`, alert);
  }

  deleteAnalyticsAlert(alertId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/alerts/${alertId}`);
  }

  // Analytics Reports
  generateAnalyticsReport(doctorId: number, reportType: string, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/doctor/${doctorId}/reports/${reportType}`, {
      params: { startDate, endDate }
    });
  }

  scheduleAnalyticsReport(schedule: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/reports/schedule`, schedule);
  }

  getScheduledReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reports/scheduled`);
  }

  cancelScheduledReport(reportId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/reports/scheduled/${reportId}`);
  }
}
