import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    AppointmentStatus,
    AllowedActionDto,
    SlotHoldRequest,
    SlotHoldResponse,
    PreVisitIntakeRequest,
    PreVisitIntakeResponse,
    SoapReportDto,
    AppointmentAnalyticsResponse,
    AppointmentStatusLogDto,
    CompletionPreview
} from '../models/appointment.models';
import { PatientAppointmentItem, DoctorAppointmentItem, SlotAvailabilityResponse, CreateAppointmentRequest } from './appointment.service';

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiBaseUrl;

    getCompletionPreview(appointmentId: number): Observable<CompletionPreview> {
        return this.http.get<CompletionPreview>(
            `${this.baseUrl}/api/appointments/${appointmentId}/completion-preview`
        );
    }

    // --- Slot Lock & Availability ---
    getAvailableSlots(doctorId: number, dateISO: string): Observable<SlotAvailabilityResponse> {
        return this.http.get<SlotAvailabilityResponse>(
            `${this.baseUrl}/api/appointments/available-slots?doctorId=${doctorId}&date=${dateISO}`
        );
    }

    holdSlot(payload: SlotHoldRequest): Observable<SlotHoldResponse> {
        return this.http.post<SlotHoldResponse>(`${this.baseUrl}/api/appointments/patient/hold-slot`, payload);
    }

    releaseSlot(holdId: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.baseUrl}/api/appointments/patient/release-slot?holdId=${encodeURIComponent(holdId)}`, {});
    }

    // --- Booking Endpoints ---
    bookAppointment(payload: CreateAppointmentRequest): Observable<PatientAppointmentItem> {
        return this.http.post<PatientAppointmentItem>(`${this.baseUrl}/api/appointments/patient/book`, payload);
    }

    bookAppointmentWithPayment(payload: {
        doctorId: number;
        appointmentDateTime: string;
        reason?: string;
        amount: number;
        paymentMethod: string;
        upiId?: string;
        cardDetails?: any;
    }): Observable<PatientAppointmentItem> {
        return this.http.post<PatientAppointmentItem>(`${this.baseUrl}/api/appointments/patient/book-with-payment`, payload);
    }

    bookEmergencyAppointment(doctorId: number, reason?: string): Observable<PatientAppointmentItem> {
        let params = new HttpParams().set('doctorId', doctorId.toString());
        if (reason) {
            params = params.set('reason', reason);
        }
        return this.http.post<PatientAppointmentItem>(
            `${this.baseUrl}/api/appointments/patient/book-emergency?${params.toString()}`,
            {}
        );
    }

    // --- Pre-Visit Intake ---
    submitPreVisitIntake(appointmentId: number, payload: PreVisitIntakeRequest): Observable<PreVisitIntakeResponse> {
        return this.http.post<PreVisitIntakeResponse>(
            `${this.baseUrl}/api/appointments/patient/${appointmentId}/intake`,
            payload
        );
    }

    getPreVisitIntakeSummary(appointmentId: number): Observable<PreVisitIntakeResponse> {
        return this.http.get<PreVisitIntakeResponse>(
            `${this.baseUrl}/api/appointments/${appointmentId}/intake-summary`
        );
    }

    // --- Ambient AI Scribe & SOAP Report ---
    generateSoapDraft(appointmentId: number, liveTranscript?: string): Observable<SoapReportDto> {
        return this.http.post<SoapReportDto>(
            `${this.baseUrl}/api/appointments/${appointmentId}/generate-soap-draft`,
            { liveTranscript: liveTranscript || '' }
        );
    }

    getSoapDraft(appointmentId: number): Observable<SoapReportDto> {
        return this.http.get<SoapReportDto>(
            `${this.baseUrl}/api/appointments/${appointmentId}/soap-draft`
        );
    }

    signMedicalReport(appointmentId: number, reportDto: SoapReportDto): Observable<SoapReportDto> {
        return this.http.post<SoapReportDto>(
            `${this.baseUrl}/api/appointments/${appointmentId}/sign-report`,
            reportDto
        );
    }

    // --- Admin Analytics & Audit Trail ---
    getAppointmentAnalytics(startDate?: string, endDate?: string, doctorId?: number): Observable<AppointmentAnalyticsResponse> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        if (doctorId) params = params.set('doctorId', doctorId.toString());

        return this.http.get<AppointmentAnalyticsResponse>(
            `${this.baseUrl}/api/appointments/admin/analytics`,
            { params }
        );
    }

    getAppointmentAuditTrail(appointmentId: number): Observable<AppointmentStatusLogDto[]> {
        return this.http.get<AppointmentStatusLogDto[]>(
            `${this.baseUrl}/api/appointments/${appointmentId}/audit-trail`
        );
    }

    // --- Patient Queries ---
    getAppointmentDetails(id: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/api/appointments/${id}`);
    }

    getMyAppointments(): Observable<PatientAppointmentItem[]> {
        return this.http.get<PatientAppointmentItem[]>(`${this.baseUrl}/api/appointments/patient/my-appointments`);
    }

    getMyUpcomingAppointments(): Observable<PatientAppointmentItem[]> {
        return this.http.get<PatientAppointmentItem[]>(`${this.baseUrl}/api/appointments/patient/my-appointments/upcoming`);
    }

    cancelMyAppointment(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}/api/appointments/patient/${id}`);
    }

    rescheduleMyAppointment(id: number, newDateTimeISO: string): Observable<{ message: string; appointment: PatientAppointmentItem }> {
        const dt = encodeURIComponent(newDateTimeISO);
        return this.http.put<{ message: string; appointment: PatientAppointmentItem }>(
            `${this.baseUrl}/api/appointments/patient/${id}/reschedule?newDateTime=${dt}`,
            {}
        );
    }

    // --- Doctor Queries & Transitions ---
    getDoctorAllAppointments(): Observable<DoctorAppointmentItem[]> {
        return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients`);
    }

    getDoctorPaginatedAppointments(page: number = 0, size: number = 10, status: string = 'ALL', range: string = 'UPCOMING', search?: string): Observable<DoctorAppointmentItem[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('status', status)
            .set('range', range);
        if (search) {
            params = params.set('search', search);
        }
        return this.http.get<DoctorAppointmentItem[]>(`${this.baseUrl}/api/appointments/doctor/my-patients/paginated`, { params });
    }

    updateAppointmentStatus(id: number, status: AppointmentStatus | string): Observable<any> {
        const url = `${this.baseUrl}/api/appointments/${id}/status`;
        return this.http.put<any>(`${url}?status=${encodeURIComponent(status)}`, {});
    }

    getAllowedActions(id: number): Observable<AllowedActionDto[]> {
        return this.http.get<AllowedActionDto[]>(`${this.baseUrl}/api/appointments/${id}/allowed-actions`);
    }

    executeAction(id: number, actionKey: string, payload: any = {}): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/api/appointments/${id}/actions/${actionKey}`, payload);
    }

    confirmAppointment(id: number): Observable<DoctorAppointmentItem> {
        return this.http.put<DoctorAppointmentItem>(`${this.baseUrl}/api/appointments/doctor/${id}/confirm`, {});
    }

    completeAppointment(id: number): Observable<DoctorAppointmentItem> {
        return this.http.put<DoctorAppointmentItem>(`${this.baseUrl}/api/appointments/doctor/${id}/complete`, {});
    }

    cancelAppointment(id: number): Observable<DoctorAppointmentItem> {
        return this.http.put<DoctorAppointmentItem>(`${this.baseUrl}/api/appointments/doctor/${id}/cancel`, {});
    }
}
