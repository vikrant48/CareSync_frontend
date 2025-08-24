import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  template: `
    <div class="session-timeout-dialog">
      <h2 class="dialog-title">Session Timeout Warning</h2>
      
      <div class="dialog-content">
        <p>Your session will expire in <strong>{{ remainingTime }}</strong> seconds due to inactivity.</p>
        <p>Do you want to continue working?</p>
        
        <mat-progress-bar 
          mode="determinate" 
          [value]="progressValue"
          color="warn">
        </mat-progress-bar>
      </div>
      
      <div class="dialog-actions">
        <button mat-button (click)="logout()">Logout</button>
        <button mat-raised-button color="primary" (click)="extendSession()">Continue Session</button>
      </div>
    </div>
  `,
  styles: [`
    .session-timeout-dialog {
      padding: 20px;
    }
    
    .dialog-title {
      margin-top: 0;
      color: #f44336;
    }
    
    .dialog-content {
      margin: 20px 0;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    mat-progress-bar {
      margin-top: 20px;
    }
  `]
})
export class SessionTimeoutDialogComponent implements OnInit, OnDestroy {
  remainingTime: number;
  progressValue: number = 100;
  private countdownInterval: any;
  private readonly COUNTDOWN_INTERVAL = 1000; // 1 second
  
  constructor(
    public dialogRef: MatDialogRef<SessionTimeoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { secondsRemaining: number }
  ) {
    this.remainingTime = data.secondsRemaining;
  }
  
  ngOnInit(): void {
    this.startCountdown();
  }
  
  ngOnDestroy(): void {
    this.clearCountdown();
  }
  
  /**
   * Start the countdown timer
   */
  private startCountdown(): void {
    const initialTime = this.remainingTime;
    
    this.countdownInterval = setInterval(() => {
      this.remainingTime--;
      this.progressValue = (this.remainingTime / initialTime) * 100;
      
      if (this.remainingTime <= 0) {
        this.clearCountdown();
        this.logout();
      }
    }, this.COUNTDOWN_INTERVAL);
  }
  
  /**
   * Clear the countdown timer
   */
  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
  
  /**
   * Extend the user's session
   */
  extendSession(): void {
    this.clearCountdown();
    this.dialogRef.close('extend');
  }
  
  /**
   * Log the user out
   */
  logout(): void {
    this.clearCountdown();
    this.dialogRef.close('logout');
  }
}