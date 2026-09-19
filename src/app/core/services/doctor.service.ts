import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  averageRating?: number;
  reviewCount?: number;
  experiences?: any[];
  educations?: any[];
  certificates?: any[];
  languages?: string;
  completionPercentage?: number;
}

export interface SearchDoctorsParams {
  query?: string;
  specialization?: string;
  location?: string;
  gender?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getAllForPatients(page: number = 0, size: number = 20, sortBy?: string, sortDirection?: string) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);

    return this.http.get<Doctor[]>(`${this.baseUrl}/api/doctors/for-patients`, { params });
  }

  searchDoctors(searchParams: SearchDoctorsParams) {
    let params = new HttpParams();
    if (searchParams.query) params = params.set('query', searchParams.query);
    if (searchParams.specialization) params = params.set('specialization', searchParams.specialization);
    if (searchParams.location) params = params.set('location', searchParams.location);
    if (searchParams.gender) params = params.set('gender', searchParams.gender);
    if (searchParams.page !== undefined && searchParams.page !== null) {
      params = params.set('page', searchParams.page.toString());
    }
    if (searchParams.size !== undefined && searchParams.size !== null) {
      params = params.set('size', searchParams.size.toString());
    }
    if (searchParams.sortBy) params = params.set('sortBy', searchParams.sortBy);
    if (searchParams.sortDirection) params = params.set('sortDirection', searchParams.sortDirection);

    return this.http.get<Doctor[]>(`${this.baseUrl}/api/doctors/search`, { params });
  }

  countDoctors(searchParams: SearchDoctorsParams) {
    let params = new HttpParams();
    if (searchParams.query) params = params.set('query', searchParams.query);
    if (searchParams.specialization) params = params.set('specialization', searchParams.specialization);
    if (searchParams.location) params = params.set('location', searchParams.location);
    if (searchParams.gender) params = params.set('gender', searchParams.gender);

    return this.http.get<number>(`${this.baseUrl}/api/doctors/search/count`, { params });
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