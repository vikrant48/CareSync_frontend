import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';

import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { NotificationType } from '../../models/notification.model';

interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  displayName: string;
  description: string;
}

interface NotificationSettings {
  globalEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  preferences: NotificationPreference[];
}

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatChipsModule
  ],
  template: `
    <div class="preferences-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="title-section">
            <h1>Notification Preferences</h1>
            <p class="subtitle">Customize how and when you receive notifications</p>
          </div>
          <div class="header-actions">
            <button mat-raised-button routerLink="/doctor/notifications" color="primary">
              <mat-icon>arrow_back</mat-icon>
              Back to Notifications
            </button>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading preferences...</p>
        </div>
      } @else {
        <form [formGroup]="preferencesForm" (ngSubmit)="savePreferences()">
          <!-- Global Settings -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>settings</mat-icon>
                Global Settings
              </mat-card-title>
              <mat-card-subtitle>General notification preferences</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="settings-grid">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>Enable Notifications</h4>
                    <p>Turn all notifications on or off</p>
                  </div>
                  <mat-slide-toggle formControlName="globalEnabled" color="primary">
                  </mat-slide-toggle>
                </div>

                <mat-divider></mat-divider>

                <div class="setting-item">
                  <div class="setting-info">
                    <h4>Email Notifications</h4>
                    <p>Receive notifications via email</p>
                  </div>
                  <mat-slide-toggle formControlName="emailEnabled" color="primary">
                  </mat-slide-toggle>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h4>SMS Notifications</h4>
                    <p>Receive notifications via SMS</p>
                  </div>
                  <mat-slide-toggle formControlName="smsEnabled" color="primary">
                  </mat-slide-toggle>
                </div>

                <div class="setting-item">
                  <div class="setting-info">
                    <h4>Push Notifications</h4>
                    <p>Receive browser push notifications</p>
                  </div>
                  <mat-slide-toggle formControlName="pushEnabled" color="primary">
                  </mat-slide-toggle>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Quiet Hours -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>bedtime</mat-icon>
                Quiet Hours
              </mat-card-title>
              <mat-card-subtitle>Set times when you don't want to receive notifications</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="quiet-hours-section">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>Enable Quiet Hours</h4>
                    <p>Disable notifications during specified hours</p>
                  </div>
                  <mat-slide-toggle formControlName="quietHoursEnabled" color="primary">
                  </mat-slide-toggle>
                </div>

                @if (preferencesForm.get('quietHoursEnabled')?.value) {
                  <div class="time-range">
                    <mat-form-field appearance="outline">
                      <mat-label>Start Time</mat-label>
                      <input matInput type="time" formControlName="quietHoursStart">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>End Time</mat-label>
                      <input matInput type="time" formControlName="quietHoursEnd">
                    </mat-form-field>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Notification Types -->
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>tune</mat-icon>
                Notification Types
              </mat-card-title>
              <mat-card-subtitle>Customize preferences for each type of notification</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="p-0">
              <mat-list>
                @for (preference of notificationPreferences; track preference.type; let i = $index) {
                  <mat-list-item class="preference-item">
                    <div class="preference-content">
                      <div class="preference-info">
                        <div class="preference-header">
                          <h4>{{ preference.displayName }}</h4>
                          <mat-chip class="type-chip" [class]="getTypeChipClass(preference.type)">
                            {{ getTypeDisplayName(preference.type) }}
                          </mat-chip>
                        </div>
                        <p>{{ preference.description }}</p>
                      </div>

                      <div class="preference-controls">
                        <div class="main-toggle">
                          <mat-slide-toggle 
                            [(ngModel)]="preference.enabled"
                            color="primary">
                            Enable
                          </mat-slide-toggle>
                        </div>

                        @if (preference.enabled) {
                          <div class="channel-toggles">
                            <div class="channel-toggle">
                              <mat-slide-toggle 
                                [(ngModel)]="preference.email"
                                [disabled]="!preferencesForm.get('emailEnabled')?.value"
                                color="accent">
                              </mat-slide-toggle>
                              <span class="channel-label">Email</span>
                            </div>
                            <div class="channel-toggle">
                              <mat-slide-toggle 
                                [(ngModel)]="preference.sms"
                                [disabled]="!preferencesForm.get('smsEnabled')?.value"
                                color="accent">
                              </mat-slide-toggle>
                              <span class="channel-label">SMS</span>
                            </div>
                            <div class="channel-toggle">
                              <mat-slide-toggle 
                                [(ngModel)]="preference.push"
                                [disabled]="!preferencesForm.get('pushEnabled')?.value"
                                color="accent">
                              </mat-slide-toggle>
                              <span class="channel-label">Push</span>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                    @if (i < notificationPreferences.length - 1) {
                      <mat-divider></mat-divider>
                    }
                  </mat-list-item>
                }
              </mat-list>
            </mat-card-content>
          </mat-card>

          <!-- Actions -->
          <div class="actions-section">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving">
              @if (saving) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <mat-icon>save</mat-icon>
              }
              Save Preferences
            </button>
            <button mat-button type="button" (click)="resetToDefaults()" [disabled]="saving">
              <mat-icon>restore</mat-icon>
              Reset to Defaults
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .preferences-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title-section h1 {
      font-size: 2rem;
      font-weight: 600;
      margin: 0;
      color: #1f2937;
    }

    .subtitle {
      color: #6b7280;
      margin: 4px 0 0 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .settings-card {
      margin-bottom: 24px;
    }

    .settings-card mat-card-header {
      margin-bottom: 16px;
    }

    .settings-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .setting-info h4 {
      margin: 0 0 4px 0;
      font-weight: 500;
      color: #1f2937;
    }

    .setting-info p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .quiet-hours-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .time-range {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }

    .time-range mat-form-field {
      flex: 1;
    }

    .preference-item {
      padding: 0;
    }

    .preference-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      width: 100%;
      gap: 24px;
    }

    .preference-info {
      flex: 1;
    }

    .preference-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .preference-header h4 {
      margin: 0;
      font-weight: 500;
      color: #1f2937;
    }

    .preference-info p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .type-chip {
      font-size: 0.75rem;
      height: 20px;
      line-height: 20px;
    }

    .type-chip.appointment { background-color: #dbeafe; color: #1e40af; }
    .type-chip.system { background-color: #ede9fe; color: #6d28d9; }
    .type-chip.schedule { background-color: #d1fae5; color: #047857; }
    .type-chip.reminder { background-color: #fef3c7; color: #92400e; }

    .preference-controls {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .main-toggle {
      display: flex;
      align-items: center;
    }

    .channel-toggles {
      display: flex;
      gap: 16px;
    }

    .channel-toggle {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .channel-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .actions-section {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .actions-section button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .preferences-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .preference-content {
        flex-direction: column;
        gap: 16px;
      }

      .preference-controls {
        align-items: stretch;
      }

      .channel-toggles {
        justify-content: space-between;
      }

      .time-range {
        flex-direction: column;
      }

      .actions-section {
        flex-direction: column;
      }
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private userId: number = 0;

  preferencesForm: FormGroup;
  notificationPreferences: NotificationPreference[] = [];
  loading = true;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.preferencesForm = this.createForm();
    this.initializeNotificationPreferences();
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id) {
      this.userId = currentUser.id;
      this.loadPreferences();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      globalEnabled: [true],
      emailEnabled: [true],
      smsEnabled: [false],
      pushEnabled: [true],
      quietHoursEnabled: [false],
      quietHoursStart: ['22:00'],
      quietHoursEnd: ['08:00']
    });
  }

  private initializeNotificationPreferences(): void {
    this.notificationPreferences = [
      {
        type: NotificationType.APPOINTMENT_REMINDER,
        enabled: true,
        email: true,
        sms: false,
        push: true,
        displayName: 'Appointment Reminders',
        description: 'Get notified about upcoming appointments'
      },
      {
        type: NotificationType.APPOINTMENT_CONFIRMATION,
        enabled: true,
        email: true,
        sms: true,
        push: true,
        displayName: 'Appointment Confirmations',
        description: 'Receive confirmations when appointments are booked'
      },
      {
        type: NotificationType.APPOINTMENT_CANCELLATION,
        enabled: true,
        email: true,
        sms: true,
        push: true,
        displayName: 'Appointment Cancellations',
        description: 'Get notified when appointments are cancelled'
      },
      {
        type: NotificationType.APPOINTMENT_RESCHEDULE,
        enabled: true,
        email: true,
        sms: false,
        push: true,
        displayName: 'Appointment Reschedules',
        description: 'Receive notifications about rescheduled appointments'
      },
      {
        type: NotificationType.DAILY_SCHEDULE,
        enabled: true,
        email: true,
        sms: false,
        push: false,
        displayName: 'Daily Schedule',
        description: 'Get your daily schedule summary'
      },
      {
        type: NotificationType.WEEKLY_SCHEDULE,
        enabled: false,
        email: true,
        sms: false,
        push: false,
        displayName: 'Weekly Schedule',
        description: 'Receive weekly schedule summaries'
      },
      {
        type: NotificationType.SYSTEM_NOTIFICATION,
        enabled: true,
        email: false,
        sms: false,
        push: true,
        displayName: 'System Notifications',
        description: 'Important system updates and announcements'
      },
      {
        type: NotificationType.FEEDBACK_REMINDER,
        enabled: false,
        email: true,
        sms: false,
        push: false,
        displayName: 'Feedback Reminders',
        description: 'Reminders to collect patient feedback'
      }
    ];
  }

  private loadPreferences(): void {
    this.loading = true;
    // In a real app, load from backend
    // For now, use default values
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.snackBar.open('Please check your settings', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;
    
    const settings: NotificationSettings = {
      ...this.preferencesForm.value,
      preferences: this.notificationPreferences
    };

    // In a real app, save to backend
    setTimeout(() => {
      this.saving = false;
      this.snackBar.open('Preferences saved successfully', 'Close', { duration: 3000 });
    }, 1500);
  }

  resetToDefaults(): void {
    this.preferencesForm.patchValue({
      globalEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    });

    this.initializeNotificationPreferences();
    this.snackBar.open('Preferences reset to defaults', 'Close', { duration: 2000 });
  }

  getTypeDisplayName(type: NotificationType): string {
    switch (type) {
      case NotificationType.APPOINTMENT_REMINDER:
        return 'Reminder';
      case NotificationType.APPOINTMENT_CONFIRMATION:
        return 'Confirmation';
      case NotificationType.APPOINTMENT_CANCELLATION:
        return 'Cancellation';
      case NotificationType.APPOINTMENT_RESCHEDULE:
        return 'Reschedule';
      case NotificationType.DAILY_SCHEDULE:
        return 'Daily';
      case NotificationType.WEEKLY_SCHEDULE:
        return 'Weekly';
      case NotificationType.FEEDBACK_REMINDER:
        return 'Feedback';
      case NotificationType.SYSTEM_NOTIFICATION:
        return 'System';
      default:
        return 'Other';
    }
  }

  getTypeChipClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.APPOINTMENT_REMINDER:
      case NotificationType.APPOINTMENT_CONFIRMATION:
      case NotificationType.APPOINTMENT_CANCELLATION:
      case NotificationType.APPOINTMENT_RESCHEDULE:
        return 'appointment';
      case NotificationType.DAILY_SCHEDULE:
      case NotificationType.WEEKLY_SCHEDULE:
        return 'schedule';
      case NotificationType.FEEDBACK_REMINDER:
        return 'reminder';
      case NotificationType.SYSTEM_NOTIFICATION:
        return 'system';
      default:
        return 'system';
    }
  }
}