import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timer, switchMap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User, 
  UserRole,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private baseUrl = `${environment.apiUrl}/api/auth`;
  private refreshTokenTimer: any;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadUserFromStorage();
    this.setupTokenRefresh();
  }

  private loadUserFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');
      if (user && token) {
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }

  private setupTokenRefresh(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Refresh token every 14 minutes (assuming 15-minute token expiry)
      this.refreshTokenTimer = timer(0, 14 * 60 * 1000).pipe(
        switchMap(() => this.refreshToken())
      ).subscribe();
    }
  }

  // Register User
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, userData)
      .pipe(
        tap(response => {
          this.handleAuthResponse(response);
        })
      );
  }

  // Login User
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.handleAuthResponse(response);
        })
      );
  }

  // Refresh Token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return new Observable(subscriber => subscriber.error('No refresh token'));
    }

    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh-token`, { 
      refreshToken 
    }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
      })
    );
  }

  // Logout User
  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuthData();
      })
    );
  }

  // Change Password
  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-password`, request);
  }

  // Forgot Password
  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, request);
  }

  // Reset Password
  resetPassword(request: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, request);
  }

  // Verify Email (if implemented)
  verifyEmail(token: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-email`, { token });
  }

  // Resend Email Verification
  resendEmailVerification(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-verification`, { email });
  }

  // Update Profile
  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, profileData)
      .pipe(
        tap(user => {
          this.updateCurrentUser(user);
        })
      );
  }

  // Get Current User Profile
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`)
      .pipe(
        tap(user => {
          this.updateCurrentUser(user);
        })
      );
  }

  // Delete Account
  deleteAccount(password: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/account`, { 
      body: { password } 
    }).pipe(
      tap(() => {
        this.clearAuthData();
      })
    );
  }

  // Session Management
  private handleAuthResponse(response: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      localStorage.setItem('tokenExpiry', Date.now().toString());
    }
    this.currentUserSubject.next(response.user);
  }

  private clearAuthData(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('tokenExpiry');
    }
    this.currentUserSubject.next(null);
  }

  private updateCurrentUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  // Token Management
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    const expiry = localStorage.getItem('tokenExpiry');
    if (expiry && Date.now() > parseInt(expiry)) {
      this.clearAuthData();
      return false;
    }

    return true;
  }

  getUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  isDoctor(): boolean {
    return this.getUserRole() === UserRole.DOCTOR;
  }

  isPatient(): boolean {
    return this.getUserRole() === UserRole.PATIENT;
  }

  isAdmin(): boolean {
    return this.getUserRole() === UserRole.ADMIN;
  }

  hasRole(role: UserRole): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  // Session timeout handling
  getSessionTimeout(): number {
    const expiry = localStorage.getItem('tokenExpiry');
    if (expiry) {
      return parseInt(expiry) - Date.now();
    }
    return 0;
  }

  isSessionExpired(): boolean {
    return this.getSessionTimeout() <= 0;
  }

  // Auto logout on session expiry
  checkSessionExpiry(): void {
    if (this.isSessionExpired()) {
      this.clearAuthData();
      // Redirect to login page
      window.location.href = '/auth/login';
    }
  }

  // Cleanup on service destruction
  ngOnDestroy(): void {
    if (this.refreshTokenTimer) {
      this.refreshTokenTimer.unsubscribe();
    }
  }
}
