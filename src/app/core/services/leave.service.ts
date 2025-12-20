import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DoctorLeave {
    id?: number;
    startDate: string;
    endDate: string;
    reason?: string;
    createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
    private baseUrl = environment.apiBaseUrl;
    private http = inject(HttpClient);

    addLeave(startDate: string, endDate: string, reason?: string) {
        return this.http.post<DoctorLeave>(`${this.baseUrl}/api/doctor-leaves`, {
            startDate,
            endDate,
            reason
        });
    }

    getMyLeaves() {
        return this.http.get<DoctorLeave[]>(`${this.baseUrl}/api/doctor-leaves/my-leaves`);
    }

    getUpcomingLeaves() {
        return this.http.get<DoctorLeave[]>(`${this.baseUrl}/api/doctor-leaves/upcoming`);
    }

    deleteLeave(id: number) {
        return this.http.delete<any>(`${this.baseUrl}/api/doctor-leaves/${id}`);
    }
}
