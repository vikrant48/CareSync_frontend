import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private baseUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  getDoctorPerformance(doctorId: number | string, startDateISO?: string, endDateISO?: string) {
    const q = startDateISO && endDateISO ? `?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}` : '';
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/reports/doctor/${doctorId}/performance${q}`
    );
  }

  getClinicOverview(startDateISO?: string, endDateISO?: string) {
    const q = startDateISO && endDateISO ? `?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}` : '';
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/reports/clinic/overview${q}`
    );
  }

  getAppointmentTrends(range: 'daily' | 'weekly' | 'monthly', startDateISO?: string, endDateISO?: string) {
    const q = startDateISO && endDateISO ? `?range=${range}&startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}` : `?range=${range}`;
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/reports/appointments/trends${q}`
    );
  }

  getSpecializationAnalysis() {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/reports/specialization/analysis`
    );
  }

  getPatientAnalytics(patientId: number | string) {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/reports/patient/${patientId}/analytics`
    );
  }

  getPatientDemographicsReport() {
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/reports/patients/demographics`
    );
  }

  getRevenueAnalysis(startDateISO?: string, endDateISO?: string) {
    const q = startDateISO && endDateISO ? `?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}` : '';
    return this.http.get<Record<string, any>>(
      `${this.baseUrl}/api/reports/revenue/analysis${q}`
    );
  }
}