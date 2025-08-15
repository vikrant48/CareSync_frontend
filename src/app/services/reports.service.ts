import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DoctorPerformanceReport,
  PatientAnalyticsReport,
  ClinicOverviewReport,
  AppointmentTrendsReport,
  SpecializationAnalysisReport,
  PatientDemographicsReport,
  RevenueAnalysisReport
} from '../models/reports.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private baseUrl = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) {}

  // Doctor Performance Reports
  getDoctorPerformanceReport(doctorId: number, startDate: string, endDate: string): Observable<DoctorPerformanceReport> {
    return this.http.get<DoctorPerformanceReport>(`${this.baseUrl}/doctor/${doctorId}/performance`, {
      params: { startDate, endDate }
    });
  }

  // Patient Analytics Reports
  getPatientAnalyticsReport(patientId: number): Observable<PatientAnalyticsReport> {
    return this.http.get<PatientAnalyticsReport>(`${this.baseUrl}/patient/${patientId}/analytics`);
  }

  // Clinic Overview Reports
  getClinicOverviewReport(startDate: string, endDate: string): Observable<ClinicOverviewReport> {
    return this.http.get<ClinicOverviewReport>(`${this.baseUrl}/clinic/overview`, {
      params: { startDate, endDate }
    });
  }

  // Appointment Trends Reports
  getAppointmentTrendsReport(startDate: string, endDate: string): Observable<AppointmentTrendsReport> {
    return this.http.get<AppointmentTrendsReport>(`${this.baseUrl}/appointments/trends`, {
      params: { startDate, endDate }
    });
  }

  // Specialization Analysis Reports
  getSpecializationAnalysisReport(): Observable<SpecializationAnalysisReport> {
    return this.http.get<SpecializationAnalysisReport>(`${this.baseUrl}/specialization/analysis`);
  }

  // Patient Demographics Reports
  getPatientDemographicsReport(): Observable<PatientDemographicsReport> {
    return this.http.get<PatientDemographicsReport>(`${this.baseUrl}/patients/demographics`);
  }

  // Revenue Analysis Reports
  getRevenueAnalysisReport(startDate: string, endDate: string): Observable<RevenueAnalysisReport> {
    return this.http.get<RevenueAnalysisReport>(`${this.baseUrl}/revenue/analysis`, {
      params: { startDate, endDate }
    });
  }

  // Custom Reports
  generateCustomReport(reportType: string, parameters: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/custom/${reportType}`, parameters);
  }

  getCustomReportTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/templates`);
  }

  createCustomReportTemplate(template: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/templates`, template);
  }

  updateCustomReportTemplate(templateId: number, template: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/templates/${templateId}`, template);
  }

  deleteCustomReportTemplate(templateId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/templates/${templateId}`);
  }

  // Report Scheduling
  scheduleReport(schedule: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/schedule`, schedule);
  }

  getScheduledReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/scheduled`);
  }

  updateScheduledReport(scheduleId: number, schedule: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/scheduled/${scheduleId}`, schedule);
  }

  deleteScheduledReport(scheduleId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/scheduled/${scheduleId}`);
  }

  // Report Export
  exportReport(reportType: string, format: 'PDF' | 'EXCEL' | 'CSV', parameters: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/export/${reportType}`, parameters, {
      params: { format },
      responseType: 'blob'
    });
  }

  exportReportByUrl(reportUrl: string, format: 'PDF' | 'EXCEL' | 'CSV'): Observable<Blob> {
    return this.http.get(reportUrl, {
      params: { format },
      responseType: 'blob'
    });
  }

  // Report History
  getReportHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history`);
  }

  getReportById(reportId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/history/${reportId}`);
  }

  deleteReport(reportId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/history/${reportId}`);
  }

  // Report Categories
  getReportCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categories`);
  }

  getReportsByCategory(category: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/category/${category}`);
  }

  // Report Permissions
  getReportPermissions(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/permissions`);
  }

  updateReportPermissions(permissions: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/permissions`, permissions);
  }

  // Report Sharing
  shareReport(reportId: number, shareData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/share/${reportId}`, shareData);
  }

  getSharedReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/shared`);
  }

  revokeReportAccess(reportId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/share/${reportId}/user/${userId}`);
  }

  // Report Notifications
  getReportNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/notifications`);
  }

  markReportNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/${notificationId}/read`, {});
  }

  // Report Configuration
  getReportConfiguration(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/config`);
  }

  updateReportConfiguration(config: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/config`, config);
  }

  // Report Validation
  validateReportParameters(reportType: string, parameters: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/validate/${reportType}`, parameters);
  }

  // Report Preview
  previewReport(reportType: string, parameters: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/preview/${reportType}`, parameters);
  }

  // Report Statistics
  getReportStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics`);
  }

  getReportUsageAnalytics(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/usage-analytics`, {
      params: { startDate, endDate }
    });
  }

  // Report Archiving
  archiveReport(reportId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/archive/${reportId}`, {});
  }

  getArchivedReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/archived`);
  }

  restoreReport(reportId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/restore/${reportId}`, {});
  }

  // Report Bulk Operations
  bulkExportReports(reportIds: number[], format: 'PDF' | 'EXCEL' | 'CSV'): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/bulk-export`, { reportIds }, {
      params: { format },
      responseType: 'blob'
    });
  }

  bulkDeleteReports(reportIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-delete`, { reportIds });
  }

  // Report API
  getReportApiEndpoints(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api-endpoints`);
  }

  testReportApiEndpoint(endpoint: string, parameters: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/test-api/${endpoint}`, parameters);
  }

  // Report Monitoring
  getReportStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/status`);
  }

  getReportQueue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/queue`);
  }

  cancelReportGeneration(reportId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/queue/${reportId}`);
  }

  // Report Security
  getReportSecuritySettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/security`);
  }

  updateReportSecuritySettings(security: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/security`, security);
  }

  // Report Audit
  getReportAuditLog(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/audit`, {
      params: { startDate, endDate }
    });
  }

  exportAuditLog(startDate: string, endDate: string, format: 'PDF' | 'EXCEL' | 'CSV'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/audit/export`, {
      params: { startDate, endDate, format },
      responseType: 'blob'
    });
  }
}
