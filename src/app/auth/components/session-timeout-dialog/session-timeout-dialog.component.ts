import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { interval, Subscription } from 'rxjs';

export interface SessionTimeoutDialogData {
  timeLeft: number; // in seconds
  totalTime: number; // in seconds
}

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div class="p-6 max-w-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-800">Session Timeout Warning</h2>
      
      <div class="mb-6">
        <p class="text-gray-600 mb-4">
          Your session will expire in <span class="font-bold text-red-500">{{ timeLeftFormatted }}</span> due to inactivity.
        </p>
        
        <mat-progress-bar 
          [value]="progressValue" 
          color="warn"
          class="mb-2"
        ></mat-progress-bar>
        
        <p class="text-sm text-gray-500">
          You will be automatically logged out when the timer reaches zero.
        </p>
      </div>
      
      <div class="flex justify-between">
        <button 
          mat-stroked-button 
          color="warn" 
          (click)="logout()"
        >
          Logout Now
        </button>
        
        <button 
          mat-raised-button 
          color="primary" 
          (click)="extendSession()"
        >
          Stay Logged In
        </button>
      </div>
    </div>
  `,
  styles: [`
    mat-progress-bar {
      height: 8px;
      border-radius: 4px;
    }
  `]
})
export class SessionTimeoutDialogComponent implements OnInit, OnDestroy {
  timeLeft: number;
  totalTime: number;
  progressValue: number = 100;
  timeLeftFormatted: string = '';
  private timerSubscription?: Subscription;

  constructor(
    public dialogRef: MatDialogRef<SessionTimeoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SessionTimeoutDialogData
  ) {
    this.timeLeft = data.timeLeft;
    this.totalTime = data.totalTime;
  }

  ngOnInit(): void {
    this.updateTimeLeftFormatted();
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  extendSession(): void {
    this.dialogRef.close(true);
  }

  logout(): void {
    this.dialogRef.close(false);
  }

  private startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeLeft--;
      this.progressValue = (this.timeLeft / this.totalTime) * 100;
      this.updateTimeLeftFormatted();
      
      if (this.timeLeft <= 0) {
        this.dialogRef.close(false);
      }
    });
  }

  private updateTimeLeftFormatted(): void {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    this.timeLeftFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
}