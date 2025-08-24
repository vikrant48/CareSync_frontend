import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of, throwError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentFilter,
  AppointmentStatus,
  AvailableSlot,
  AppointmentStatistics,
  DoctorSchedule,
  DoctorAppointment
} from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private baseUrl = `${environment.apiUrl}/api/appointments`;

  constructor(private http: HttpClient) {}

  // Patient Appointment Management
  bookAppointment(appointment: AppointmentCreate): Observable<Appointment> {
    // Validate appointment data before sending
    if (!appointment.doctorId || !appointment.appointmentDateTime || !appointment.reason) {
      console.error('Invalid appointment data:', appointment);
      return throwError(() => new Error('Missing required appointment data'));
    }
    
    // Ensure the date format is correct
    try {
      const dateObj = new Date(appointment.appointmentDateTime);
      if (isNaN(dateObj.getTime())) {
        return throwError(() => new Error('Invalid appointment date format'));
      }
      
      // Format the date in ISO format without milliseconds
      appointment = {
        ...appointment,
        appointmentDateTime: dateObj.toISOString().split('.')[0]
      };
    } catch (error) {
      console.error('Date parsing error:', error);
      return throwError(() => new Error('Invalid appointment date'));
    }
    
    console.log('📤 Sending appointment data to API:', appointment);
    console.log('🔗 API URL:', `${this.baseUrl}/patient/book`);
    
    return this.http.post<Appointment>(`${this.baseUrl}/patient/book`, appointment)
      .pipe(
        catchError(error => {
          console.error('❌ API error response:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            headers: error.headers,
            url: error.url
          });
          if (error.status === 400) {
            return throwError(() => new Error('Invalid appointment data: ' + (error.error?.message || 'Please check your inputs')));
          } else if (error.status === 409) {
            return throwError(() => new Error('This time slot is no longer available'));
          } else if (error.status === 403) {
            return throwError(() => new Error('Authentication error. Please log in again'));
          }
          return throwError(() => error);
        })
      );
  }

  getPatientAppointments(filter?: AppointmentFilter): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof AppointmentFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Appointment[]>(`${this.baseUrl}/patient/my-appointments`, { params });
  }

  getPatientUpcomingAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/patient/my-appointments/upcoming`);
  }

  updatePatientAppointment(id: number, appointment: AppointmentUpdate): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/patient/${id}`, appointment);
  }

  reschedulePatientAppointment(id: number, newDateTime: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/patient/${id}/reschedule`, { appointmentDateTime: newDateTime });
  }

  cancelPatientAppointment(id: number, reason?: string): Observable<any> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.delete(`${this.baseUrl}/patient/${id}`, { params });
  }

  // Doctor Appointment Management
  getDoctorAppointments(doctorId: number, filter?: AppointmentFilter): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof AppointmentFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Appointment[]>(`${this.baseUrl}/doctor/${doctorId}`, { params });
  }

  getDoctorUpcomingAppointments(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/doctor/${doctorId}/upcoming`);
  }

  getDoctorTodayAppointments(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/doctor/${doctorId}/today`);
  }

  confirmAppointment(id: number): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/doctor/${id}/confirm`, {});
  }

  completeAppointment(id: number): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/doctor/${id}/complete`, {});
  }

  cancelDoctorAppointment(id: number): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/doctor/${id}/cancel`, {});
  }

  updateAppointmentStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/doctor/${id}/status`, {}, {
      params: { status }
    });
  }

  // Doctor's My Patients Appointments
  getMyPatientsAppointments(): Observable<DoctorAppointment[]> {
    return this.http.get<DoctorAppointment[]>(`${this.baseUrl}/doctor/my-patients`);
  }

  getMyPatientsUpcomingAppointments(): Observable<DoctorAppointment[]> {
    return this.http.get<DoctorAppointment[]>(`${this.baseUrl}/doctor/my-patients/upcoming`);
  }

  getMyPatientsTodayAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/doctor/my-patients/today`);
  }

  // Admin Appointment Management
  getAdminAppointment(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/admin/${id}`);
  }

  deleteAdminAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/${id}`);
  }

  // General Appointment Operations
  getAppointment(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/${id}`);
  }

  getAppointmentStatistics(): Observable<AppointmentStatistics> {
    return this.http.get<AppointmentStatistics>(`${this.baseUrl}/statistics`);
  }

  // Available Slots
  getAvailableSlots(doctorId: number, date: string): Observable<AvailableSlot> {
    return this.http.get<string[]>(`${this.baseUrl}/available-slots/${doctorId}`, {
      params: { date }
    }).pipe(
      map((timeSlots: string[]) => {
        // Transform the array of strings into the AvailableSlot format
        return {
          date: date,
          timeSlots: timeSlots || [],
          doctorId: doctorId
        };
      }),
      catchError(error => {
        console.error('Error fetching available slots:', error);
        return of({ date: date, timeSlots: [], doctorId: doctorId });
      })
    );
  }

  // Doctor Schedule
  getDoctorSchedule(doctorId: number, date: string): Observable<DoctorSchedule> {
    return this.http.get<DoctorSchedule>(`${this.baseUrl}/doctor/${doctorId}/schedule`, {
      params: { date }
    });
  }

  // Appointment Search and Filtering
  searchAppointments(query: string, filter?: AppointmentFilter): Observable<Appointment[]> {
    let params = new HttpParams().set('query', query);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof AppointmentFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Appointment[]>(`${this.baseUrl}/search`, { params });
  }

  // Appointment Conflicts
  checkAppointmentConflicts(appointment: AppointmentCreate): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/check-conflicts`, appointment);
  }

  // Appointment Reminders
  sendAppointmentReminder(appointmentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${appointmentId}/reminder`, {});
  }

  // Bulk Operations
  bulkUpdateAppointments(appointmentIds: number[], updates: Partial<AppointmentUpdate>): Observable<Appointment[]> {
    return this.http.put<Appointment[]>(`${this.baseUrl}/bulk-update`, {
      appointmentIds,
      updates
    });
  }

  bulkCancelAppointments(appointmentIds: number[], reason?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-cancel`, {
      appointmentIds,
      reason
    });
  }

  // Appointment Templates
  getAppointmentTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/templates`);
  }

  createAppointmentFromTemplate(templateId: number, appointmentData: Partial<AppointmentCreate>): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/templates/${templateId}/create`, appointmentData);
  }

  // Recurring Appointments
  createRecurringAppointments(recurringData: {
    baseAppointment: AppointmentCreate;
    recurrence: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      interval: number;
      endDate: string;
      daysOfWeek?: string[];
    };
  }): Observable<Appointment[]> {
    return this.http.post<Appointment[]>(`${this.baseUrl}/recurring`, recurringData);
  }

  // Appointment Notes
  addAppointmentNote(appointmentId: number, note: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${appointmentId}/notes`, { note });
  }

  getAppointmentNotes(appointmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${appointmentId}/notes`);
  }

  // Appointment Attachments
  uploadAppointmentAttachment(appointmentId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/${appointmentId}/attachments`, formData);
  }

  getAppointmentAttachments(appointmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${appointmentId}/attachments`);
  }

  // Appointment Follow-ups
  scheduleFollowUp(appointmentId: number, followUpData: {
    followUpDate: string;
    reason: string;
    notes?: string;
  }): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/${appointmentId}/follow-up`, followUpData);
  }

  getFollowUpAppointments(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/patient/${patientId}/follow-ups`);
  }
}
