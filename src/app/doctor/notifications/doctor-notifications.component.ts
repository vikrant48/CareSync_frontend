import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { NotificationService } from '../../services/notification.service';
import { DoctorService } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { Notification, NotificationType, NotificationStatus, NotificationFilter } from '../../models/notification.model';

@Component({
  selector: 'app-doctor-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="notifications-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="title-section">
            <h1>Notifications</h1>
            <p class="subtitle">Manage your notifications and stay updated</p>
          </div>
          <div class="header-actions">
            <button mat-raised-button routerLink="/doctor/dashboard" color="primary">
              <mat-icon>arrow_back</mat-icon>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- Filter and Actions Bar -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-actions">
            <div class="filters">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Filter by Type</mat-label>
                <mat-select [(value)]="selectedType" (selectionChange)="applyFilters()">
                  <mat-option value="">All Types</mat-option>
                  <mat-option value="APPOINTMENT_REMINDER">Appointment Reminders</mat-option>
                  <mat-option value="APPOINTMENT_CONFIRMATION">Confirmations</mat-option>
                  <mat-option value="APPOINTMENT_CANCELLATION">Cancellations</mat-option>
                  <mat-option value="APPOINTMENT_RESCHEDULE">Reschedules</mat-option>
                  <mat-option value="DAILY_SCHEDULE">Daily Schedule</mat-option>
                  <mat-option value="SYSTEM_NOTIFICATION">System</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Filter by Status</mat-label>
                <mat-select [(value)]="selectedStatus" (selectionChange)="applyFilters()">
                  <mat-option value="">All Status</mat-option>
                  <mat-option value="READ">Read</mat-option>
                  <mat-option value="unread">Unread</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="actions">
              <button mat-button routerLink="/doctor/notifications/preferences">
                <mat-icon>settings</mat-icon>
                Preferences
              </button>
              <button mat-button (click)="markAllAsRead()" [disabled]="loading || unreadCount === 0">
                <mat-icon>done_all</mat-icon>
                Mark All Read
              </button>
              <button mat-button (click)="deleteSelected()" [disabled]="loading || selectedNotifications.length === 0" color="warn">
                <mat-icon>delete</mat-icon>
                Delete Selected ({{ selectedNotifications.length }})
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Statistics -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon total">notifications</mat-icon>
              <div class="stat-info">
                <h3>{{ totalNotifications }}</h3>
                <p>Total Notifications</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon unread">mark_email_unread</mat-icon>
              <div class="stat-info">
                <h3>{{ unreadCount }}</h3>
                <p>Unread</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon today">today</mat-icon>
              <div class="stat-info">
                <h3>{{ todayCount }}</h3>
                <p>Today</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Notifications List -->
      <mat-card class="notifications-list-card">
        <mat-card-header>
          <mat-card-title>
            <div class="list-header">
              <span>Notifications</span>
              <mat-checkbox 
                [checked]="isAllSelected()" 
                [indeterminate]="isPartiallySelected()"
                (change)="toggleSelectAll($event.checked)">
                Select All
              </mat-checkbox>
            </div>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content class="p-0">
          @if (loading) {
            <div class="loading-container">
              <mat-spinner></mat-spinner>
              <p>Loading notifications...</p>
            </div>
          } @else if (filteredNotifications.length === 0) {
            <div class="empty-state">
              <mat-icon class="empty-icon">notifications_none</mat-icon>
              <h3>No notifications found</h3>
              <p>{{ getEmptyStateMessage() }}</p>
            </div>
          } @else {
            <mat-list>
              @for (notification of paginatedNotifications; track notification.id) {
                <mat-list-item class="notification-item" [class.unread]="!isNotificationRead(notification)">
                  <div class="notification-content">
                    <mat-checkbox 
                      [checked]="isSelected(notification)"
                      (change)="toggleSelection(notification, $event.checked)"
                      class="notification-checkbox">
                    </mat-checkbox>

                    <div class="notification-icon">
                      <mat-icon [class]="getNotificationIconClass(notification.type)">{{ getNotificationIcon(notification.type) }}</mat-icon>
                    </div>

                    <div class="notification-details" (click)="toggleNotificationRead(notification)">
                      <div class="notification-header">
                        <h4 class="notification-title">{{ notification.title }}</h4>
                        <div class="notification-meta">
                          <mat-chip class="type-chip" [class]="getTypeChipClass(notification.type)">{{ getTypeDisplayName(notification.type) }}</mat-chip>
                          <span class="notification-time">{{ getRelativeTime(notification.createdAt) }}</span>
                        </div>
                      </div>
                      <p class="notification-message">{{ notification.message }}</p>
                      @if (notification.appointmentId) {
                        <div class="appointment-link">
                          <mat-icon>event</mat-icon>
                          <span>Related to appointment #{{ notification.appointmentId }}</span>
                        </div>
                      }
                    </div>

                    <div class="notification-actions">
                      @if (!isNotificationRead(notification)) {
                        <button mat-icon-button 
                                matTooltip="Mark as read" 
                                (click)="markAsRead(notification)">
                          <mat-icon>mark_email_read</mat-icon>
                        </button>
                      }
                      <button mat-icon-button 
                              matTooltip="Delete notification" 
                              (click)="deleteNotification(notification)"
                              color="warn">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                  <mat-divider></mat-divider>
                </mat-list-item>
              }
            </mat-list>

            <!-- Pagination -->
            <mat-paginator 
              [length]="filteredNotifications.length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 24px;
      max-width: 1200px;
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

    .filter-card {
      margin-bottom: 24px;
    }

    .filter-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .filters {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-field {
      min-width: 200px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-card:nth-child(2) {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-card:nth-child(3) {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
    }

    .stat-info h3 {
      font-size: 2rem;
      font-weight: 600;
      margin: 0;
    }

    .stat-info p {
      margin: 0;
      opacity: 0.9;
    }

    .notifications-list-card {
      margin-bottom: 24px;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .notification-item {
      padding: 0;
      border-left: 4px solid transparent;
    }

    .notification-item.unread {
      background-color: #f8fafc;
      border-left-color: #3b82f6;
    }

    .notification-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      width: 100%;
    }

    .notification-checkbox {
      margin-top: 8px;
    }

    .notification-icon {
      margin-top: 4px;
    }

    .notification-icon mat-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .notification-icon .appointment { color: #3b82f6; }
    .notification-icon .system { color: #8b5cf6; }
    .notification-icon .schedule { color: #10b981; }
    .notification-icon .reminder { color: #f59e0b; }

    .notification-details {
      flex: 1;
      cursor: pointer;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      gap: 16px;
    }

    .notification-title {
      font-weight: 500;
      margin: 0;
      color: #1f2937;
    }

    .notification-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
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

    .notification-time {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .notification-message {
      color: #4b5563;
      margin: 0;
      line-height: 1.5;
    }

    .appointment-link {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 0.875rem;
      color: #3b82f6;
    }

    .appointment-link mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .notification-actions {
      display: flex;
      gap: 4px;
      margin-top: 4px;
    }

    @media (max-width: 768px) {
      .notifications-container {
        padding: 16px;
      }

      .filter-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .filters {
        width: 100%;
      }

      .filter-field {
        min-width: unset;
        flex: 1;
      }

      .notification-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .notification-meta {
        align-self: stretch;
        justify-content: space-between;
      }
    }
  `]
})
export class DoctorNotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private doctorId: number = 0;

  // Data
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  paginatedNotifications: Notification[] = [];
  selectedNotifications: Notification[] = [];

  // Loading states
  loading = true;

  // Filters
  selectedType = '';
  selectedStatus = '';
  filter: NotificationFilter = {};

  // Pagination
  pageSize = 25;
  currentPage = 0;

  // Statistics
  totalNotifications = 0;
  unreadCount = 0;
  todayCount = 0;

  constructor(
    private notificationService: NotificationService,
    private doctorService: DoctorService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

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
      this.doctorId = currentUser.id;
      this.loadNotifications();
    }
  }

  private loadNotifications(): void {
    this.loading = true;
    this.doctorService.getDoctorNotifications(this.doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.calculateStatistics();
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.snackBar.open('Failed to load notifications', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  private calculateStatistics(): void {
    this.totalNotifications = this.notifications.length;
    this.unreadCount = this.notifications.filter(n => !this.isNotificationRead(n)).length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.todayCount = this.notifications.filter(n => {
      const notificationDate = new Date(n.createdAt);
      notificationDate.setHours(0, 0, 0, 0);
      return notificationDate.getTime() === today.getTime();
    }).length;
  }

  applyFilters(): void {
    this.filteredNotifications = this.notifications.filter(notification => {
      // Type filter
      if (this.selectedType && notification.type !== this.selectedType) {
        return false;
      }

      // Status filter
      if (this.selectedStatus) {
        const isRead = this.isNotificationRead(notification);
        if (this.selectedStatus === 'read' && !isRead) return false;
        if (this.selectedStatus === 'unread' && isRead) return false;
      }

      return true;
    });

    // Reset pagination
    this.currentPage = 0;
    this.updatePagination();
  }

  private updatePagination(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedNotifications = this.filteredNotifications.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  // Notification management
  markAsRead(notification: Notification): void {
    if (this.isNotificationRead(notification)) return;

    this.doctorService.markNotificationAsRead(this.doctorId, notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.status = NotificationStatus.READ;
          notification.readAt = new Date().toISOString();
          this.calculateStatistics();
          this.snackBar.open('Notification marked as read', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
          this.snackBar.open('Failed to mark notification as read', 'Close', { duration: 3000 });
        }
      });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !this.isNotificationRead(n));
    if (unreadNotifications.length === 0) return;

    // Mark all as read locally first for better UX
    unreadNotifications.forEach(notification => {
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date().toISOString();
    });
    this.calculateStatistics();

    // Then sync with backend
    Promise.all(
      unreadNotifications.map(notification => 
        this.doctorService.markNotificationAsRead(this.doctorId, notification.id).toPromise()
      )
    ).then(() => {
      this.snackBar.open(`Marked ${unreadNotifications.length} notifications as read`, 'Close', { duration: 3000 });
    }).catch(error => {
      console.error('Error marking notifications as read:', error);
      this.snackBar.open('Some notifications could not be marked as read', 'Close', { duration: 3000 });
      // Reload to get correct state
      this.loadNotifications();
    });
  }

  deleteNotification(notification: Notification): void {
    // Remove from local arrays
    this.notifications = this.notifications.filter(n => n.id !== notification.id);
    this.selectedNotifications = this.selectedNotifications.filter(n => n.id !== notification.id);
    this.calculateStatistics();
    this.applyFilters();
    
    this.snackBar.open('Notification deleted', 'Close', { duration: 2000 });
  }

  deleteSelected(): void {
    if (this.selectedNotifications.length === 0) return;

    const count = this.selectedNotifications.length;
    
    // Remove from local arrays
    const selectedIds = this.selectedNotifications.map(n => n.id);
    this.notifications = this.notifications.filter(n => !selectedIds.includes(n.id));
    this.selectedNotifications = [];
    
    this.calculateStatistics();
    this.applyFilters();
    
    this.snackBar.open(`Deleted ${count} notifications`, 'Close', { duration: 3000 });
  }

  toggleNotificationRead(notification: Notification): void {
    if (!this.isNotificationRead(notification)) {
      this.markAsRead(notification);
    }
  }

  // Selection management
  toggleSelection(notification: Notification, selected: boolean): void {
    if (selected) {
      if (!this.isSelected(notification)) {
        this.selectedNotifications.push(notification);
      }
    } else {
      this.selectedNotifications = this.selectedNotifications.filter(n => n.id !== notification.id);
    }
  }

  toggleSelectAll(selectAll: boolean): void {
    if (selectAll) {
      this.selectedNotifications = [...this.paginatedNotifications];
    } else {
      this.selectedNotifications = [];
    }
  }

  isSelected(notification: Notification): boolean {
    return this.selectedNotifications.some(n => n.id === notification.id);
  }

  isAllSelected(): boolean {
    return this.paginatedNotifications.length > 0 && 
           this.paginatedNotifications.every(n => this.isSelected(n));
  }

  isPartiallySelected(): boolean {
    const selectedCount = this.paginatedNotifications.filter(n => this.isSelected(n)).length;
    return selectedCount > 0 && selectedCount < this.paginatedNotifications.length;
  }

  // Utility methods
  isNotificationRead(notification: Notification): boolean {
    return notification.status === NotificationStatus.READ || !!notification.readAt;
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.APPOINTMENT_REMINDER:
      case NotificationType.APPOINTMENT_CONFIRMATION:
      case NotificationType.APPOINTMENT_CANCELLATION:
      case NotificationType.APPOINTMENT_RESCHEDULE:
        return 'event';
      case NotificationType.DAILY_SCHEDULE:
      case NotificationType.WEEKLY_SCHEDULE:
        return 'schedule';
      case NotificationType.FEEDBACK_REMINDER:
        return 'feedback';
      case NotificationType.SYSTEM_NOTIFICATION:
        return 'info';
      default:
        return 'notifications';
    }
  }

  getNotificationIconClass(type: NotificationType): string {
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
        return 'Daily Schedule';
      case NotificationType.WEEKLY_SCHEDULE:
        return 'Weekly Schedule';
      case NotificationType.FEEDBACK_REMINDER:
        return 'Feedback';
      case NotificationType.SYSTEM_NOTIFICATION:
        return 'System';
      default:
        return 'Notification';
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

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }  
  }

  getEmptyStateMessage(): string {
    if (this.selectedType || this.selectedStatus) {
      return 'No notifications match your current filters. Try adjusting your search criteria.';
    }
    return 'You have no notifications at this time.';
  }
}