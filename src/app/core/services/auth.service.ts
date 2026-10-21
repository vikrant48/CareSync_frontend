import { Injectable, signal, inject, computed } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthenticationResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, Role } from '../models/auth.models';
import { SavedDoctorsService } from './saved-doctors.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiBaseUrl;
  private platformId = inject(PLATFORM_ID);
  private savedDoctors = inject(SavedDoctorsService);
  private static readonly RETURN_URL_KEY = 'cs_return_url';

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  accessToken = signal<string | null>(this.getStored('accessToken'));
  refreshToken = signal<string | null>(this.getStored('refreshToken'));
  role = signal<Role | null>(this.getStored('role') as Role | null);
  username = signal<string | null>(this.getStored('username'));
  userId = signal<string | null>(this.getStored('userId'));
  user = signal<any | null>(this.getStoredJson('user'));

  private logoutTimer: any;
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  constructor(private http: HttpClient, private router: Router) {
    if (this.isAuthenticated()) {
      this.initInactivityTimer();
    }
    this.watchOtherTabs();
  }

  register(payload: RegisterRequest) {
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/api/auth/register`, payload);
  }

  checkAvailability(username?: string, email?: string) {
    return this.http.get<{ usernameAvailable: boolean; emailAvailable: boolean }>(
      `${this.baseUrl}/api/auth/check-availability`,
      {
        params: {
          ...(username && { username }),
          ...(email && { email })
        }
      }
    );
  }

  // Email verification APIs
  startEmailVerification(payload: { name: string; email: string; mobileNumber?: string }) {
    return this.http.post<{ message?: string }>(`${this.baseUrl}/api/auth/email-verification/start`, payload);
  }

  verifyEmailOtp(payload: { email: string; otp: string }) {
    return this.http.post<{ verified: boolean; message?: string }>(`${this.baseUrl}/api/auth/email-verification/verify`, payload);
  }

  getEmailVerificationStatus(email: string) {
    return this.http.get<{ verified: boolean }>(`${this.baseUrl}/api/auth/email-verification/status`, {
      params: { email },
    });
  }

  login(payload: LoginRequest) {
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/api/auth/login`, payload);
  }

  loginWithGoogle(idToken: string, role?: string) {
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/api/auth/google`, { idToken, role });
  }

  // Refresh tokens are single-use, so parallel requests must share one refresh call
  private refreshInFlight: Observable<{ accessToken: string; refreshToken: string }> | null = null;

  refresh() {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    // Another tab may have refreshed already (refresh tokens are single-use): use the newest stored one
    const rt = this.getStored('refreshToken') ?? this.refreshToken();
    this.refreshInFlight = this.http.post<{ accessToken: string; refreshToken: string }>(`${this.baseUrl}/api/auth/refresh`, {
      refreshToken: rt,
    } as RefreshTokenRequest).pipe(
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1)
    );
    return this.refreshInFlight;
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
    // A different account on this browser must not see the previous patient's saved doctors
    if (this.username() && this.username() !== resp.username) this.savedDoctors.clear();
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
    this.initInactivityTimer();
  }

  logout() {
    const rt = this.refreshToken();
    if (rt) {
      this.http.post(`${this.baseUrl}/api/auth/logout`, { refreshToken: rt }).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Forgets the session in this tab (storage and memory) without calling the server or navigating. Used by
   * logout, and by the guards when stored login data is incomplete, so a login page never shows a logged-in nav.
   */
  clearSession() {
    if (this.isBrowser()) {
      try {
        ['accessToken', 'refreshToken', 'role', 'username', 'user', 'userId'].forEach((k) => localStorage.removeItem(k));
        // AI assistant chat history can contain health details: clear it (all users' keys) on logout
        Object.keys(localStorage)
          .filter((k) => k.startsWith('caresync_ai_sessions'))
          .forEach((k) => localStorage.removeItem(k));
      } catch { }
    }
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.role.set(null);
    this.username.set(null);
    this.userId.set(null);
    this.user.set(null);
    this.savedDoctors.clear();
    this.clearReturnUrl();
    this.stopInactivityTimer();
  }

  isAuthenticated = computed(() => !!this.accessToken());

  /** A usable session: a token and the role it belongs to (a token alone means the stored data is broken) */
  hasValidSession(): boolean {
    return !!this.accessToken() && !!this.role();
  }

  redirectToDashboard(role: Role | null) {
    if (role === 'ADMIN') this.router.navigate(['/admin']);
    else if (role === 'DOCTOR') this.router.navigate(['/doctor']);
    else if (role === 'PATIENT') this.router.navigate(['/patient']);
    else this.router.navigate(['/login']);
  }

  /**
   * Remember an app page to open after login or sign-up (e.g. a shared doctor link). Only paths inside this app are
   * kept, so a crafted link can never send someone to another site. Kept per browser tab.
   */
  rememberReturnUrl(url: string) {
    if (!this.isBrowser() || !AuthService.isSafeReturnUrl(url)) return;
    try {
      sessionStorage.setItem(AuthService.RETURN_URL_KEY, url);
    } catch {
      // storage blocked: the user simply lands on the dashboard
    }
  }

  /** The remembered page, if any (not cleared) */
  pendingReturnUrl(): string | null {
    if (!this.isBrowser()) return null;
    try {
      const url = sessionStorage.getItem(AuthService.RETURN_URL_KEY);
      return url && AuthService.isSafeReturnUrl(url) ? url : null;
    } catch {
      return null;
    }
  }

  clearReturnUrl() {
    if (!this.isBrowser()) return;
    try {
      sessionStorage.removeItem(AuthService.RETURN_URL_KEY);
    } catch {
      // nothing to clear
    }
  }

  /**
   * After login or sign-up: open the remembered page when this role may see it, otherwise the dashboard.
   * Returns true when a remembered page was skipped because it is for another role (callers can explain why).
   */
  redirectAfterAuth(role: Role | null): boolean {
    const url = this.pendingReturnUrl();
    this.clearReturnUrl();
    if (url && role && AuthService.roleCanOpen(role, url)) {
      this.router.navigateByUrl(url);
      return false;
    }
    this.redirectToDashboard(role);
    return !!url;
  }

  /** "/patient/..." style paths only: no other sites ("//x", "/\x", "https:"), no login pages */
  static isSafeReturnUrl(url: string | null | undefined): boolean {
    if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) return false;
    return !/^\/(login|register|reset-password|auth)(\/|\?|$)/.test(url);
  }

  private static roleCanOpen(role: Role, url: string): boolean {
    if (url.startsWith('/patient')) return role === 'PATIENT';
    if (url.startsWith('/doctor')) return role === 'DOCTOR';
    if (url.startsWith('/admin')) return role === 'ADMIN';
    return true;
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
    } catch { }
  }

  // --- HIPAA Inactivity Logic ---

  // One function object, so removeEventListener really removes it (a new arrow function each time never matched,
  // and the listeners kept restarting the logout timer after logout)
  private readonly onUserActivity = () => this.resetInactivityTimer();
  private static readonly ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'];

  private initInactivityTimer() {
    if (!this.isBrowser()) return;
    this.stopInactivityTimer();
    this.resetInactivityTimer();
    AuthService.ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, this.onUserActivity, { passive: true }));
  }

  /** While something holds the session (e.g. a video call where nobody touches the screen), no idle logout */
  private sessionHolds = 0;

  holdSession() {
    this.sessionHolds++;
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
  }

  releaseSession() {
    this.sessionHolds = Math.max(0, this.sessionHolds - 1);
    if (this.sessionHolds === 0) this.resetInactivityTimer();
  }

  private resetInactivityTimer() {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    if (!this.accessToken() || this.sessionHolds > 0) return; // nothing to time out, or a call is in progress
    this.logoutTimer = setTimeout(() => {
      console.log('User inactive for 15 minutes. Logging out for security.');
      this.logout();
    }, this.INACTIVITY_TIMEOUT);
  }

  private stopInactivityTimer() {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    this.logoutTimer = null;
    if (!this.isBrowser()) return;
    AuthService.ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, this.onUserActivity));
  }

  /**
   * Keeps open tabs in step: logging out in another tab (or the session expiring there) logs this tab out too, and
   * tokens refreshed by another tab are used here (the old refresh token no longer works once it has been used).
   */
  private watchOtherTabs() {
    if (!this.isBrowser()) return;
    window.addEventListener('storage', (event) => {
      if (event.key === 'accessToken') {
        if (!event.newValue) {
          if (this.accessToken()) {
            this.clearSession();
            this.router.navigate(['/login']);
          }
        } else {
          this.accessToken.set(event.newValue);
        }
      } else if (event.key === 'refreshToken' && event.newValue) {
        this.refreshToken.set(event.newValue);
      }
    });
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
    } catch { }
  }
}