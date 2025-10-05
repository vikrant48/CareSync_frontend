import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface NotificationItem {
  id?: number | string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  type: string; // e.g., appointment, prescription, system
  read: boolean;
  link?: string; // optional router link for navigation
}

export interface NotificationStatus {
  service: string;
  status: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private baseUrl = `${environment.apiBaseUrl}/api/notifications`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<NotificationStatus | null> {
    return this.http.get<NotificationStatus>(`${this.baseUrl}/status`).pipe(
      catchError(() => of(null))
    );
  }

  getDoctorFeed(doctorId: number): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.baseUrl}/doctor/${doctorId}/feed`);
  }

  getDoctorUnreadCount(doctorId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/doctor/${doctorId}/unread-count`);
  }

  getPatientFeed(patientId: number): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.baseUrl}/patient/${patientId}/feed`);
  }

  getPatientUnreadCount(patientId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/patient/${patientId}/unread-count`);
  }

  markRead(notificationId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${notificationId}/read`, {});
  }

  getGroupLabel(timestampISO: string): 'Today' | 'Yesterday' | 'Earlier' {
    const ts = new Date(timestampISO);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (ts >= startOfToday) return 'Today';
    if (ts >= startOfYesterday && ts < startOfToday) return 'Yesterday';
    return 'Earlier';
  }
}