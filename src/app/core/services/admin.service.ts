import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Doctor } from './doctor.service';

export interface UserSummary {
  userId: number;
  username: string;
  role: string;
  isActive: boolean;
}

export interface BlockedIP {
  ipAddress: string;
  reason: string;
  blockedAt?: string;
  expiresAt?: string;
}

export interface AdminDoctorListItem {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  specialization: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface AdminDoctorPagedResponse {
  content: AdminDoctorListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
  totalVerifiedCount?: number;
  totalPendingCount?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getAllUsersSummary() {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/api/admin/users`);
  }

  getAdminDoctors(page: number = 0, size: number = 30, search?: string, isVerified?: boolean | string) {
    let params: string[] = [`page=${page}`, `size=${size}`];
    if (search && search.trim()) {
      params.push(`search=${encodeURIComponent(search.trim())}`);
    }
    if (isVerified !== undefined && isVerified !== null && isVerified !== 'ALL') {
      params.push(`isVerified=${isVerified === true || isVerified === 'true'}`);
    }
    return this.http.get<AdminDoctorPagedResponse>(`${this.baseUrl}/api/admin/doctors?${params.join('&')}`);
  }

  getDoctorDetails(doctorId: number | string) {
    return this.http.get<Doctor>(`${this.baseUrl}/api/admin/doctors/${doctorId}`);
  }

  toggleUserActiveStatus(username: string) {
    return this.http.put<{ message: string; username: string; isActive: boolean }>(
      `${this.baseUrl}/api/admin/users/${username}/toggle-active`,
      {}
    );
  }

  setUserActiveStatus(username: string, active: boolean) {
    return this.http.put<{ message: string; username: string; isActive: boolean }>(
      `${this.baseUrl}/api/admin/users/${username}/status?active=${active}`,
      {}
    );
  }

  verifyDoctor(doctorId: number | string, verify: boolean) {
    return this.http.put<{ message: string; doctorId: number; isVerified: boolean }>(
      `${this.baseUrl}/api/admin/doctors/${doctorId}/verify?verify=${verify}`,
      {}
    );
  }

  getBlockedIPs() {
    return this.http.get<BlockedIP[]>(`${this.baseUrl}/api/admin/blocked-ips`);
  }

  unblockIP(ipAddress: string) {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/api/admin/blocked-ips/${ipAddress}`);
  }

  unblockAllIPs() {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/api/admin/blocked-ips`);
  }

  addMasterData(masterType: string, value: string, orgId: number = 91) {
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/master/${masterType}`, {
      value,
      orgId
    });
  }

  changeUserPassword(userId: number, newPassword: string, confirmPassword: string) {
    return this.http.put<{ message: string; username: string; userId: number }>(
      `${this.baseUrl}/api/admin/users/${userId}/password`,
      { newPassword, confirmPassword }
    );
  }
}
