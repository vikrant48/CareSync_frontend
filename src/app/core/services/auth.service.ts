import { Injectable, signal, inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthenticationResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, Role } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiBaseUrl;
  private platformId = inject(PLATFORM_ID);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  accessToken = signal<string | null>(this.getStored('accessToken'));
  refreshToken = signal<string | null>(this.getStored('refreshToken'));
  role = signal<Role | null>(this.getStored('role') as Role | null);
  username = signal<string | null>(this.getStored('username'));
  userId = signal<string | null>(this.getStored('userId'));
  user = signal<any | null>(this.getStoredJson('user'));

  constructor(private http: HttpClient, private router: Router) {}

  register(payload: RegisterRequest) {
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/api/auth/register`, payload);
  }

  login(payload: LoginRequest) {
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/api/auth/login`, payload);
  }

  refresh() {
    const rt = this.refreshToken();
    return this.http.post<{ accessToken: string; refreshToken: string }>(`${this.baseUrl}/api/auth/refresh`, {
      refreshToken: rt,
    } as RefreshTokenRequest);
  }

  getCurrentUser() {
    return this.http.get<any>(`${this.baseUrl}/api/auth/current-user`);
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  isTokenExpired(): boolean {
    const token = this.accessToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      return exp <= (now + fiveMinutes); // Return true if expired or expires within 5 minutes
    } catch (error) {
      return true; // If we can't parse the token, consider it expired
    }
  }

  // Check if token is actually expired (not just about to expire)
  isTokenActuallyExpired(): boolean {
    const token = this.accessToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      return exp <= now; // Return true if actually expired
    } catch (error) {
      return true; // If we can't parse the token, consider it expired
    }
  }

  // Check if token has been expired for a long time (more than 1 hour)
  isTokenLongExpired(): boolean {
    const token = this.accessToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      return exp <= (now - oneHour); // Return true if expired for more than 1 hour
    } catch (error) {
      return true; // If we can't parse the token, consider it long expired
    }
  }

  // Get token expiration type for routing decisions
  getTokenExpirationStatus(): 'valid' | 'short_expired' | 'long_expired' {
    if (!this.isTokenActuallyExpired()) {
      return 'valid';
    }
    
    if (this.isTokenLongExpired()) {
      return 'long_expired';
    }
    
    return 'short_expired';
  }

  // Proactively refresh token if it's about to expire
  checkAndRefreshToken() {
    if (this.isTokenExpired() && this.refreshToken()) {
      return this.refresh();
    }
    return null;
  }

  storeAuth(resp: AuthenticationResponse) {
    this.setStored('accessToken', resp.accessToken);
    this.setStored('refreshToken', resp.refreshToken);
    this.setStored('role', resp.role);
    this.setStored('username', resp.username);
    const id = resp.user && (resp.user.id ?? resp.user.userId ?? resp.user.uuid ?? null);
    this.setStored('userId', id != null ? String(id) : null);
    this.setStoredJson('user', resp.user ?? null);
    this.accessToken.set(resp.accessToken);
    this.refreshToken.set(resp.refreshToken);
    this.role.set(resp.role);
    this.username.set(resp.username);
    this.userId.set(id != null ? String(id) : null);
    this.user.set(resp.user ?? null);
  }

  logout() {
    const rt = this.refreshToken();
    if (rt) {
      this.http.post(`${this.baseUrl}/api/auth/logout`, { refreshToken: rt }).subscribe();
    }
    if (this.isBrowser()) {
      ['accessToken', 'refreshToken', 'role', 'username', 'user', 'userId'].forEach((k) => localStorage.removeItem(k));
    }
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.role.set(null);
    this.username.set(null);
    this.userId.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken();
  }

  redirectToDashboard(role: Role | null) {
    if (role === 'DOCTOR') this.router.navigate(['/doctor']);
    else if (role === 'PATIENT') this.router.navigate(['/patient']);
    else this.router.navigate(['/login']);
  }

  private getStored(key: string): string | null {
    if (!this.isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private setStored(key: string, value: any) {
    if (!this.isBrowser()) return;
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, String(value));
    } catch {}
  }

  private getStoredJson(key: string) {
    if (!this.isBrowser()) return null;
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  }

  private setStoredJson(key: string, value: any) {
    if (!this.isBrowser()) return;
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
}