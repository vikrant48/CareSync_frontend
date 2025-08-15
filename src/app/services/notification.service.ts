import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Notification,
  NotificationCreate,
  NotificationFilter,
  NotificationPreferences,
  NotificationStatistics,
  NotificationServiceStatus,
  AppointmentReminderNotification,
  ScheduleNotification,
  SystemNotification,
  BulkNotification,
  CustomNotification,
  NotificationType,
  TargetAudience
} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/api/notifications`;

  constructor(private http: HttpClient) {}

  // Appointment Notifications
  sendAppointmentReminder(appointmentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointment-reminder/${appointmentId}`, {});
  }

  sendAppointmentConfirmation(appointmentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointment-confirmation/${appointmentId}`, {});
  }

  sendAppointmentCancellation(appointmentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointment-cancellation/${appointmentId}`, {});
  }

  sendAppointmentReschedule(appointmentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointment-reschedule/${appointmentId}`, {});
  }

  // Schedule Notifications
  sendDailySchedule(doctorId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/daily-schedule/${doctorId}`, {});
  }

  sendWeeklySchedule(doctorId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/weekly-schedule/${doctorId}`, {});
  }

  // Feedback Notifications
  sendFeedbackReminder(appointmentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/feedback-reminder/${appointmentId}`, {});
  }

  // System Notifications
  sendSystemNotification(notification: SystemNotification): Observable<any> {
    return this.http.post(`${this.baseUrl}/system-notification`, notification);
  }

  sendBulkNotification(notification: BulkNotification): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-notification`, notification);
  }

  sendCustomNotification(notification: CustomNotification): Observable<any> {
    return this.http.post(`${this.baseUrl}/custom-notification`, notification);
  }

  // Notification Status
  getNotificationServiceStatus(): Observable<NotificationServiceStatus> {
    return this.http.get<NotificationServiceStatus>(`${this.baseUrl}/status`);
  }

  // Notification Management
  createNotification(notification: NotificationCreate): Observable<Notification> {
    return this.http.post<Notification>(this.baseUrl, notification);
  }

  getNotificationById(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.baseUrl}/${id}`);
  }

  updateNotification(id: number, notification: Partial<Notification>): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/${id}`, notification);
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Notification Filtering and Search
  getNotifications(filter?: NotificationFilter): Observable<Notification[]> {
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof NotificationFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Notification[]>(this.baseUrl, { params });
  }

  searchNotifications(query: string, filter?: NotificationFilter): Observable<Notification[]> {
    let params = new HttpParams().set('query', query);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof NotificationFilter];
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<Notification[]>(`${this.baseUrl}/search`, { params });
  }

  getNotificationsByType(type: NotificationType): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/type/${type}`);
  }

  getNotificationsByStatus(status: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/status/${status}`);
  }

  // Notification Preferences
  getNotificationPreferences(userId: number): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.baseUrl}/preferences/${userId}`);
  }

  updateNotificationPreferences(userId: number, preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.baseUrl}/preferences/${userId}`, preferences);
  }

  // Notification Statistics
  getNotificationStatistics(): Observable<NotificationStatistics> {
    return this.http.get<NotificationStatistics>(`${this.baseUrl}/statistics`);
  }

  getNotificationStatisticsByType(type: NotificationType): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics/type/${type}`);
  }

  getNotificationStatisticsByStatus(status: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics/status/${status}`);
  }

  // Notification Templates
  getNotificationTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/templates`);
  }

  createNotificationTemplate(template: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/templates`, template);
  }

  updateNotificationTemplate(templateId: number, template: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/templates/${templateId}`, template);
  }

  deleteNotificationTemplate(templateId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/templates/${templateId}`);
  }

  // Notification Scheduling
  scheduleNotification(schedule: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/schedule`, schedule);
  }

  getScheduledNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/scheduled`);
  }

  updateScheduledNotification(scheduleId: number, schedule: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/scheduled/${scheduleId}`, schedule);
  }

  deleteScheduledNotification(scheduleId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/scheduled/${scheduleId}`);
  }

  // Notification Delivery
  getNotificationDeliveryStatus(notificationId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${notificationId}/delivery-status`);
  }

  retryNotificationDelivery(notificationId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${notificationId}/retry`, {});
  }

  // Notification Channels
  getNotificationChannels(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/channels`);
  }

  sendNotificationToChannel(notificationId: number, channel: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${notificationId}/send/${channel}`, {});
  }

  // Notification Groups
  createNotificationGroup(group: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/groups`, group);
  }

  getNotificationGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/groups`);
  }

  updateNotificationGroup(groupId: number, group: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/groups/${groupId}`, group);
  }

  deleteNotificationGroup(groupId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/groups/${groupId}`);
  }

  sendNotificationToGroup(groupId: number, notification: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/groups/${groupId}/send`, notification);
  }

  // Notification History
  getNotificationHistory(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/history`);
  }

  getNotificationHistoryByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/history/user/${userId}`);
  }

  getNotificationHistoryByDateRange(startDate: string, endDate: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/history/date-range`, {
      params: { startDate, endDate }
    });
  }

  // Notification Export
  exportNotifications(format: 'PDF' | 'EXCEL' | 'CSV', filter?: NotificationFilter): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof NotificationFilter];
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

  // Notification Bulk Operations
  bulkSendNotifications(notificationIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-send`, { notificationIds });
  }

  bulkDeleteNotifications(notificationIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-delete`, { notificationIds });
  }

  bulkUpdateNotifications(notificationIds: number[], updates: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/bulk-update`, { notificationIds, updates });
  }

  // Notification Configuration
  getNotificationConfiguration(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/config`);
  }

  updateNotificationConfiguration(config: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/config`, config);
  }

  // Notification Testing
  testNotificationChannel(channel: string, testData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/test/${channel}`, testData);
  }

  testNotificationTemplate(templateId: number, testData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/templates/${templateId}/test`, testData);
  }

  // Notification Monitoring
  getNotificationQueue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/queue`);
  }

  getNotificationQueueStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/queue/status`);
  }

  clearNotificationQueue(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/queue`);
  }

  // Notification Alerts
  getNotificationAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/alerts`);
  }

  createNotificationAlert(alert: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/alerts`, alert);
  }

  updateNotificationAlert(alertId: number, alert: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/alerts/${alertId}`, alert);
  }

  deleteNotificationAlert(alertId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/alerts/${alertId}`);
  }

  // Notification API
  getNotificationApiEndpoints(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api-endpoints`);
  }

  testNotificationApiEndpoint(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/test-api/${endpoint}`, data);
  }
}
