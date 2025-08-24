import {
  Injectable,
  Inject,
  PLATFORM_ID,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, timer, switchMap, of, catchError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../models/user.model';
// DoctorService and PatientService imports removed - now using unified /current-user endpoint

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use signals for state management
  private currentUserSignal = signal<User | null>(null);
  public currentUser = computed(() => this.currentUserSignal());

  // For backward compatibility with code still using observables
  public currentUser$ = toObservable(this.currentUserSignal);

  private baseUrl = `${environment.apiUrl}/api/auth`;
  private refreshTokenTimer: any;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    this.loadUserFromStorage();
    this.setupTokenRefresh();
  }

  private loadUserFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');

      if (user && user !== 'undefined' && token) {
        try {
          this.currentUserSignal.set(JSON.parse(user));
        } catch (e) {
          console.error('Invalid user JSON in localStorage', e);
          this.currentUserSignal.set(null);
        }
      } else {
        this.currentUserSignal.set(null);
      }
    }
  }

  private setupTokenRefresh(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Only setup refresh timer if we have a refresh token
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        // Refresh token every 58 minutes (assuming 60-minute token expiry)
        this.refreshTokenTimer = timer(58 * 60 * 1000, 58 * 60 * 1000)
          .pipe(
            switchMap(() => this.refreshToken()),
            catchError(error => {
              console.warn('Token refresh failed:', error);
              return of(null);
            })
          )
          .subscribe();
      }
    }
  }

  // Register User
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, userData)
      .pipe(
        tap((response) => {
          this.handleAuthResponse(response);
          // Fetch complete user profile after successful registration
          this.fetchUserProfile(response.username, response.role as UserRole);
        })
      );
  }

  // Login User
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          this.handleAuthResponse(response);
          // Fetch complete user profile after successful login
          this.fetchUserProfile(response.username, response.role as UserRole);
        })
      );
  }

  // Get current user (signal-based API)
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  // Refresh Token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return new Observable((subscriber) =>
        subscriber.error('No refresh token')
      );
    }

    return this.http
      .post<AuthResponse>(`${this.baseUrl}/refresh-token`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
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

  // Synchronous logout (for immediate UI updates)
  logoutSync(): void {
    this.clearAuthData();
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

  // Verify Email
  verifyEmail(token: string, email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-email`, { token, email });
  }

  // Resend Email Verification
  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-verification`, { email });
  }

  // Update Profile
  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, profileData).pipe(
      tap((user) => {
        this.updateCurrentUser(user);
      })
    );
  }

  // Get Current User Profile using the new backend endpoint
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/current-user`).pipe(
      tap((user) => {
        this.updateCurrentUser(user);
      })
    );
  }

  // Delete Account
  deleteAccount(password: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/account`, {
        body: { password },
      })
      .pipe(
        tap(() => {
          this.clearAuthData();
        })
      );
  }

  // Fetch complete user profile after login using the new backend endpoint
  private fetchUserProfile(username: string, role: UserRole): void {
    if (!username || !role) {
      console.warn('Username or role not provided for profile fetch');
      return;
    }

    // Use the new /current-user endpoint that extracts username from JWT token
    this.getCurrentUserProfile().subscribe({
      next: (user: User) => {
        console.log('Fetched complete user profile:', user);
        if (user && user.id && user.id !== 0) {
          // Update localStorage and signal with complete user data
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          this.currentUserSignal.set(user);
        }
      },
      error: (error) => {
        console.error('Failed to fetch user profile:', error);
        // Keep the basic user data from login response if profile fetch fails
      }
    });
  }

  // Session Management
  private handleAuthResponse(response: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      // Handle both token formats (token or accessToken)
      const token = response.accessToken || response.token || '';
      localStorage.setItem('token', token);
      
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Create user object if not present in response
      let user = response.user;
      if (!user && response.username && response.role) {
        user = {
          username: response.username,
          role: response.role as UserRole,
          email: '',
          firstName: '',
          lastName: '',
          id: 0,
          phoneNumber: '',
          address: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSignal.set(user);
      }

      const expiryTime = Date.now() + 60 * 60 * 1000; // 60 minutes session timeout
      localStorage.setItem('tokenExpiry', expiryTime.toString());
    }
  }

  private clearAuthData(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('tokenExpiry');
    }
    this.currentUserSignal.set(null);
  }

  private updateCurrentUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSignal.set(user);
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

  // This method is now redundant as we have a signal-based API
  // Keeping for backward compatibility
  getCurrentUserFromSubject(): User | null {
    return this.currentUser();
  }

  // Authentication status as a computed signal
  isAuthenticated = computed(() => {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    if (isPlatformBrowser(this.platformId)) {
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry && Date.now() > parseInt(expiry)) {
        this.clearAuthData();
        return false;
      }
    }

    return true;
  });

  // For backward compatibility
  isAuthenticatedValue(): boolean {
    return this.isAuthenticated();
  }

  // User role as a computed signal
  userRole = computed(() => {
    const user = this.currentUser();
    return user ? user.role : null;
  });

  // For backward compatibility
  getUserRole(): UserRole | null {
    return this.userRole();
  }

  // Role checks as computed signals
  isDoctor = computed(() => this.userRole() === UserRole.DOCTOR);
  isPatient = computed(() => this.userRole() === UserRole.PATIENT);
  isAdmin = computed(() => this.userRole() === UserRole.ADMIN);

  // For backward compatibility
  isDoctorValue(): boolean {
    return this.isDoctor();
  }

  isPatientValue(): boolean {
    return this.isPatient();
  }

  isAdminValue(): boolean {
    return this.isAdmin();
  }

  // Role checking methods
  hasRole(role: UserRole): boolean {
    return this.userRole() === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.userRole();
    return userRole ? roles.includes(userRole) : false;
  }

  // Session timeout handling as signals
  sessionTimeout = computed(() => {
    if (isPlatformBrowser(this.platformId)) {
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry) {
        return parseInt(expiry) - Date.now();
      }
    }
    return 0;
  });

  isSessionExpired = computed(() => this.sessionTimeout() <= 0);

  // For backward compatibility
  getSessionTimeout(): number {
    return this.sessionTimeout();
  }

  isSessionExpiredValue(): boolean {
    return this.isSessionExpired();
  }

  // Auto logout on session expiry
  checkSessionExpiry(): void {
    if (this.isSessionExpired()) {
      this.clearAuthData();
      // Redirect to login page
      if (isPlatformBrowser(this.platformId)) {
        window.location.href = '/auth/login';
      }
    }
  }

  // Setup session expiry effect
  setupSessionExpiryEffect(): void {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        if (this.isSessionExpired()) {
          this.logoutSync();
          this.router.navigate(['/auth/login']);
        }
      });
    }
  }

  // Cleanup on service destruction
  ngOnDestroy(): void {
    if (this.refreshTokenTimer) {
      this.refreshTokenTimer.unsubscribe();
    }
  }
}
