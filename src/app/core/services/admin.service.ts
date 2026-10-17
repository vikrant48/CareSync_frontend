import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

/** One login session of a user (GET /api/admin/sessions/{username}) */
export interface AdminUserSession {
  id: number;
  username: string;
  sessionId: string;
  ipAddress?: string;
  loginTime?: string;
  lastActivity?: string;
  active: boolean;
  userAgent?: string;
  userType?: string;
}

/** Result of POST /api/admin/security/reencrypt-fields (dry run reports valuesToRewrite, real run valuesRewritten) */
export interface ReencryptionReport {
  dryRun: boolean;
  valuesToRewrite?: number;
  valuesRewritten?: number;
  failed: number;
  columns: Record<string, { alreadyCurrent: number; legacyEcb: number; plaintext: number; rewritten: number; failed: number }>;
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

/** Fields the admin appointment lookup shows (GET /api/appointments/admin/{id} returns more, incl. medical data, which is not displayed) */
export interface AdminAppointment {
  appointmentId: number;
  patientId: number;
  patientName?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  consultationFees?: number;
  transactionId?: string;
  isActive?: boolean;
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

  reviewCertificate(doctorId: number | string, certificateId: number | string) {
    return this.http.post<import('../models/appointment.models').CertificateReview>(
      `${this.baseUrl}/api/admin/doctors/${doctorId}/certificates/${certificateId}/review`,
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

  blockIP(ipAddress: string, reason: string, hoursToBlock: number) {
    const params = new HttpParams()
      .set('ipAddress', ipAddress)
      .set('reason', reason)
      .set('hoursToBlock', String(hoursToBlock));
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/admin/block-ip`, null, { params });
  }

  getUserSessions(username: string) {
    return this.http.get<AdminUserSession[]>(`${this.baseUrl}/api/admin/sessions/${encodeURIComponent(username)}`);
  }

  deactivateSession(sessionId: string) {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/api/admin/sessions/deactivate/${encodeURIComponent(sessionId)}`, {});
  }

  deactivateAllSessions(username: string) {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/api/admin/sessions/deactivate-all/${encodeURIComponent(username)}`, {});
  }

  reencryptFields(dryRun: boolean) {
    const params = new HttpParams().set('dryRun', String(dryRun));
    return this.http.post<ReencryptionReport>(`${this.baseUrl}/api/admin/security/reencrypt-fields`, null, { params });
  }

  getAppointmentForAdmin(appointmentId: number) {
    return this.http.get<AdminAppointment>(`${this.baseUrl}/api/appointments/admin/${appointmentId}`);
  }

  /** Refused by the backend when the appointment has clinical, payment or chat records */
  deleteAppointment(appointmentId: number) {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/api/appointments/admin/${appointmentId}`);
  }

  changeUserPassword(userId: number, newPassword: string, confirmPassword: string) {
    return this.http.put<{ message: string; username: string; userId: number }>(
      `${this.baseUrl}/api/admin/users/${userId}/password`,
      { newPassword, confirmPassword }
    );
  }
}
