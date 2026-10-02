import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface VideoTokenResponse {
    token: string;
    url: string;
    roomName: string;
    role: 'DOCTOR' | 'PATIENT';
    displayName: string;
}

export interface VideoStatusResponse {
    appointmentId: number;
    roomName: string;
    doctorInRoom: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class VideoService {
    private baseUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    getVideoToken(appointmentId: number): Observable<VideoTokenResponse> {
        return this.http.post<VideoTokenResponse>(`${this.baseUrl}/api/appointments/${appointmentId}/video/token`, {});
    }

    getVideoStatus(appointmentId: number): Observable<VideoStatusResponse> {
        return this.http.get<VideoStatusResponse>(`${this.baseUrl}/api/appointments/${appointmentId}/video/status`);
    }

    endVideoConsultation(appointmentId: number): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.baseUrl}/api/appointments/${appointmentId}/video/end`, {});
    }
}
