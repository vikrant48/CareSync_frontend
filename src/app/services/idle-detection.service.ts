import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../environments/environment';
import { signal, computed } from '@angular/core';
import { SessionTimeoutDialogComponent } from '../shared/dialogs/session-timeout-dialog/session-timeout-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class IdleDetectionService implements OnDestroy {
  private readonly IDLE_TIMEOUT = 60 * 60 * 1000; // 60 minutes of inactivity
  private readonly WARNING_TIMEOUT = environment.security.tokenExpiryWarning; // 5 minutes before session expiry
  
  private idleTimer: any;
  private warningTimer: any;
  private dialogRef: any;
  
  // Track user activity with signals
  private lastActivitySignal = signal<number>(Date.now());
  private idleTimeSignal = signal<number>(0);
  
  // Computed signals for idle state
  public idleTime = computed(() => this.idleTimeSignal());
  public isIdle = computed(() => this.idleTime() >= this.IDLE_TIMEOUT);
  public timeUntilIdle = computed(() => Math.max(0, this.IDLE_TIMEOUT - this.idleTime()));
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  /**
   * Initialize the idle detection service
   */
  init(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Set up activity listeners
      this.setupActivityListeners();
      
      // Start idle timer
      this.startIdleTimer();
      
      // Set up warning timer based on token expiry
      this.setupWarningTimer();
    }
  }
  
  /**
   * Set up event listeners to track user activity
   */
  private setupActivityListeners(): void {
    const events = [
      'mousedown', 'mousemove', 'keypress',
      'scroll', 'touchstart', 'click', 'keydown'
    ];
    
    events.forEach(eventName => {
      window.addEventListener(eventName, () => this.resetIdleTimer(), true);
    });
  }
  
  /**
   * Start the idle timer to track user inactivity
   */
  private startIdleTimer(): void {
    this.idleTimer = setInterval(() => {
      const currentTime = Date.now();
      const lastActivity = this.lastActivitySignal();
      const idleTime = currentTime - lastActivity;
      
      this.idleTimeSignal.set(idleTime);
      
      // If user is idle for too long, log them out
      if (this.isIdle()) {
        this.logout('You have been logged out due to inactivity.');
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Set up timer to warn user before session expires
   */
  private setupWarningTimer(): void {
    this.warningTimer = setInterval(() => {
      // Only show warning if user is authenticated
      if (this.authService.isAuthenticated()) {
        const sessionTimeout = this.authService.sessionTimeout();
        
        // If session will expire soon, show warning dialog
        if (sessionTimeout > 0 && sessionTimeout <= this.WARNING_TIMEOUT) {
          this.showSessionWarning(Math.floor(sessionTimeout / 1000));
        }
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Reset the idle timer when user activity is detected
   */
  resetIdleTimer(): void {
    this.lastActivitySignal.set(Date.now());
    this.idleTimeSignal.set(0);
  }
  
  /**
   * Show session timeout warning dialog
   */
  private showSessionWarning(secondsRemaining: number): void {
    // Prevent multiple dialogs
    if (this.dialogRef) return;
    
    this.dialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { secondsRemaining }
    });
    
    this.dialogRef.afterClosed().subscribe((result: string) => {
      if (result === 'extend') {
        // Extend session by refreshing token
        this.authService.refreshToken().subscribe({
          next: () => {
            this.resetIdleTimer();
          },
          error: () => {
            this.logout('Your session could not be extended. Please log in again.');
          }
        });
      } else if (result === 'logout') {
        this.logout();
      }
      
      this.dialogRef = null;
    });
  }
  
  /**
   * Log the user out
   */
  private logout(message?: string): void {
    // Clear timers
    this.clearTimers();
    
    // Log out the user
    this.authService.logoutSync();
    
    // Navigate to login page
    this.router.navigate(['/auth/login'], {
      queryParams: message ? { message } : undefined
    });
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }
    
    if (this.warningTimer) {
      clearInterval(this.warningTimer);
      this.warningTimer = null;
    }
  }
  
  /**
   * Clean up resources when service is destroyed
   */
  ngOnDestroy(): void {
    this.clearTimers();
    
    // Close dialog if open
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}