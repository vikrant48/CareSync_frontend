import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Doctor {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  contactInfo?: string;
  specialization?: string;
  isActive?: boolean;
  profileImageUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  consultationFees?: number;
  isVerified?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getAllForPatients() {
    return this.http.get<Doctor[]>(`${this.baseUrl}/api/doctors/for-patients`);
  }

  getByUsername(username: string) {
    return this.http.get<Doctor>(`${this.baseUrl}/api/doctors/public/${username}`);
  }

  getAverageRating(doctorId: number) {
    return this.http.get<{ doctorId: number; averageRating: number }>(
      `${this.baseUrl}/api/feedback/doctor/${doctorId}/average-rating`
    );
  }

  getRatingDistribution(doctorId: number) {
    return this.http.get<Record<number, number>>(
      `${this.baseUrl}/api/feedback/doctor/${doctorId}/rating-distribution`
    );
  }
}