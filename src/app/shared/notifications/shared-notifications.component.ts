import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container p-4">
      <h2 class="text-2xl font-bold mb-4">Notifications</h2>
      
      <div class="notification-list">
        <div *ngFor="let notification of notifications" 
             class="notification-item p-3 mb-2 rounded border-l-4"
             [class]="{
               'border-blue-500 bg-blue-50': notification.type === 'info',
               'border-green-500 bg-green-50': notification.type === 'success',

               'border-yellow-500 bg-yellow-50': notification.type === 'warning',
               'border-red-500 bg-red-50': notification.type === 'error'
             }">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-semibold">{{ notification.title }}</h3>
              <p class="text-sm text-gray-600">{{ notification.message }}</p>
              <span class="text-xs text-gray-500">{{ notification.time }}</span>
            </div>
            <button class="text-gray-400 hover:text-gray-600" (click)="markAsRead(notification.id)">
              <span class="sr-only">Mark as read</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div *ngIf="notifications.length === 0" class="text-center py-8 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p>No notifications at this time</p>
        </div>
      </div>
      
      <div class="mt-4 flex justify-between">
        <button *ngIf="notifications.length > 0" 
                class="text-sm text-blue-600 hover:text-blue-800"
                (click)="markAllAsRead()">
          Mark all as read
        </button>
        <button *ngIf="notifications.length > 0" 
                class="text-sm text-gray-600 hover:text-gray-800"
                (click)="clearAll()">
          Clear all
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-item {
      transition: all 0.3s ease;
    }
    .notification-item:hover {
      transform: translateX(5px);
    }
  `]
})
export class SharedNotificationsComponent {
  notifications = [
    {
      id: 1,
      type: 'info',
      title: 'Appointment Reminder',
      message: 'You have an appointment with Dr. Smith tomorrow at 10:00 AM.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Prescription Refilled',
      message: 'Your prescription has been refilled and is ready for pickup.',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Payment Due',
      message: 'Your payment for last month\'s services is due in 3 days.',
      time: '2 days ago',
      read: true
    }
  ];

  markAsRead(id: number): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => notification.read = true);
  }

  clearAll(): void {
    this.notifications = [];
  }
}