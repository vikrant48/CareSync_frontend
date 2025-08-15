import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Feedback,
  FeedbackCreate,
  FeedbackUpdate,
  FeedbackFilter,
  AverageRating,
  RatingDistribution
} from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private baseUrl = `${environment.apiUrl}/api/feedback`;

  constructor(private http: HttpClient) {}

  // Feedback CRUD Operations
  createFeedback(feedback: FeedbackCreate): Observable<Feedback> {
    return this.http.post<Feedback>(this.baseUrl, feedback);
  }

  getFeedbackById(id: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.baseUrl}/${id}`);
  }

  updateFeedback(id: number, feedback: FeedbackUpdate): Observable<Feedback> {
    return this.http.put<Feedback>(`${this.baseUrl}/${id}`, feedback);
  }

  deleteFeedback(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Feedback by Doctor
  getFeedbackByDoctor(doctorId: number, filter?: FeedbackFilter): Observable<Feedback[]> {
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof FeedbackFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Feedback[]>(`${this.baseUrl}/doctor/${doctorId}`, { params });
  }

  getDoctorAverageRating(doctorId: number): Observable<AverageRating> {
    return this.http.get<AverageRating>(`${this.baseUrl}/doctor/${doctorId}/average-rating`);
  }

  getDoctorRatingDistribution(doctorId: number): Observable<RatingDistribution> {
    return this.http.get<RatingDistribution>(`${this.baseUrl}/doctor/${doctorId}/rating-distribution`);
  }

  // Feedback by Patient
  getFeedbackByPatient(patientId: number, filter?: FeedbackFilter): Observable<Feedback[]> {
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof FeedbackFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Feedback[]>(`${this.baseUrl}/patient/${patientId}`, { params });
  }

  // Feedback by Appointment
  getFeedbackByAppointment(appointmentId: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.baseUrl}/appointment/${appointmentId}`);
  }

  // Feedback Search and Filtering
  searchFeedback(query: string, filter?: FeedbackFilter): Observable<Feedback[]> {
    let params = new HttpParams().set('query', query);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof FeedbackFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Feedback[]>(`${this.baseUrl}/search`, { params });
  }

  getFeedbackByRating(rating: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/rating/${rating}`);
  }

  getFeedbackByDateRange(startDate: string, endDate: string): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/date-range`, {
      params: { startDate, endDate }
    });
  }

  // Feedback Analytics
  getFeedbackStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics`);
  }

  getFeedbackTrends(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/trends`, {
      params: { startDate, endDate }
    });
  }

  getFeedbackByMonth(month: string, year: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/monthly`, {
      params: { month, year: year.toString() }
    });
  }

  getFeedbackByWeek(weekStart: string, weekEnd: string): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/weekly`, {
      params: { weekStart, weekEnd }
    });
  }

  // Feedback Sentiment Analysis
  getFeedbackSentiment(doctorId?: number): Observable<any> {
    let params = new HttpParams();
    if (doctorId) params = params.set('doctorId', doctorId.toString());
    return this.http.get<any>(`${this.baseUrl}/sentiment`, { params });
  }

  getPositiveFeedback(doctorId?: number): Observable<Feedback[]> {
    let params = new HttpParams();
    if (doctorId) params = params.set('doctorId', doctorId.toString());
    return this.http.get<Feedback[]>(`${this.baseUrl}/positive`, { params });
  }

  getNegativeFeedback(doctorId?: number): Observable<Feedback[]> {
    let params = new HttpParams();
    if (doctorId) params = params.set('doctorId', doctorId.toString());
    return this.http.get<Feedback[]>(`${this.baseUrl}/negative`, { params });
  }

  // Feedback Reports
  generateFeedbackReport(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/doctor/${doctorId}`, {
      params: { startDate, endDate }
    });
  }

  generateOverallFeedbackReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/overall`, {
      params: { startDate, endDate }
    });
  }

  // Feedback Export
  exportFeedback(format: 'PDF' | 'EXCEL' | 'CSV', filter?: FeedbackFilter): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof FeedbackFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Feedback Moderation
  moderateFeedback(feedbackId: number, action: 'APPROVE' | 'REJECT' | 'FLAG', reason?: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${feedbackId}/moderate`, { action, reason });
  }

  getFlaggedFeedback(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/flagged`);
  }

  getPendingModeration(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/pending-moderation`);
  }

  // Feedback Response
  respondToFeedback(feedbackId: number, response: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${feedbackId}/respond`, { response });
  }

  getFeedbackResponses(feedbackId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${feedbackId}/responses`);
  }

  // Feedback Templates
  getFeedbackTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/templates`);
  }

  createFeedbackFromTemplate(templateId: number, appointmentId: number, data: any): Observable<Feedback> {
    return this.http.post<Feedback>(`${this.baseUrl}/templates/${templateId}/create`, {
      appointmentId,
      ...data
    });
  }

  // Feedback Reminders
  sendFeedbackReminder(appointmentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/reminder/${appointmentId}`, {});
  }

  getFeedbackReminders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reminders`);
  }

  // Feedback Bulk Operations
  bulkUpdateFeedback(feedbackIds: number[], updates: Partial<FeedbackUpdate>): Observable<Feedback[]> {
    return this.http.put<Feedback[]>(`${this.baseUrl}/bulk-update`, {
      feedbackIds,
      updates
    });
  }

  bulkDeleteFeedback(feedbackIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-delete`, { feedbackIds });
  }

  // Feedback Validation
  validateFeedback(feedback: FeedbackCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/validate`, feedback);
  }

  // Feedback Duplicates
  checkForDuplicateFeedback(appointmentId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/duplicates/${appointmentId}`);
  }

  // Feedback Categories
  getFeedbackCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categories`);
  }

  getFeedbackByCategory(category: string): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.baseUrl}/category/${category}`);
  }

  // Feedback Attachments
  uploadFeedbackAttachment(feedbackId: number, file: File, description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return this.http.post(`${this.baseUrl}/${feedbackId}/attachments`, formData);
  }

  getFeedbackAttachments(feedbackId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${feedbackId}/attachments`);
  }

  deleteFeedbackAttachment(feedbackId: number, attachmentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${feedbackId}/attachments/${attachmentId}`);
  }

  // Feedback Notifications
  getFeedbackNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/notifications`);
  }

  markFeedbackNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/${notificationId}/read`, {});
  }
}
