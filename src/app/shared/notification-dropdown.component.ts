import { Component, Input, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationService, NotificationItem, NotificationStatus } from '../core/services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <button class="btn-secondary relative" (click)="toggleNotif()" title="Notifications" aria-label="Notifications">
        <span class="mr-1 text-lg">🔔</span>
        <span class="text-sm">{{ buttonLabel }}</span>
        <span *ngIf="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">{{ unreadCount }}</span>
      </button>
      <ng-template #dropdownContent>
        <div class="p-2 text-sm font-semibold">Notifications</div>
        <div class="max-h-96 overflow-auto">
          <div *ngIf="showStatus" class="px-3 py-2 text-xs text-gray-400">Service: {{ notifStatus?.service || 'Notification Service' }} • Status: {{ notifStatus?.status || 'Unknown' }}</div>
          <div *ngIf="feed.length === 0 && groupedFeedData.length === 0" class="px-3 py-3 text-sm text-gray-300">No notifications.</div>
          <ng-container *ngIf="grouped; else flatList">
            <ng-container *ngFor="let g of groupedFeedData; trackBy: trackGroup">
              <div class="px-3 pt-2 text-xs font-semibold text-gray-400">{{ g.label }}</div>
              <button *ngFor="let n of g.items; trackBy: trackNotif" class="w-full text-left px-3 py-2 border-t border-gray-700 hover:bg-gray-700/50" (click)="onNotificationClick(n)">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="text-sm font-medium" [class.text-white]="!n.read" [class.text-gray-200]="n.read">{{ n.title }}</div>
                    <div class="text-xs text-gray-300">{{ n.message }}</div>
                  </div>
                  <div class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ n.timestamp | date:'short' }}</div>
                </div>
              </button>
            </ng-container>
          </ng-container>
          <ng-template #flatList>
            <button *ngFor="let n of feed; trackBy: trackNotif" class="w-full text-left px-3 py-2 border-t border-gray-700 hover:bg-gray-700/50" (click)="onNotificationClick(n)">
              <div class="flex items-start justify-between">
                <div>
                  <div class="text-sm font-medium" [class.text-white]="!n.read" [class.text-gray-200]="n.read">{{ n.title }}</div>
                  <div class="text-xs text-gray-300">{{ n.message }}</div>
                </div>
                <div class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ n.timestamp | date:'short' }}</div>
              </div>
            </button>
          </ng-template>
        </div>
      </ng-template>

      <!-- Desktop outside-click overlay -->
      <div *ngIf="notifOpen" class="hidden sm:block fixed inset-0 z-40" (click)="notifOpen=false"></div>
      <div *ngIf="notifOpen" class="hidden sm:block absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50" [ngClass]="widthClass">
        <ng-container [ngTemplateOutlet]="dropdownContent"></ng-container>
      </div>

      <!-- Mobile outside-click overlay -->
      <div *ngIf="notifOpen" class="sm:hidden fixed inset-0 z-40" (click)="notifOpen=false"></div>
      <div *ngIf="notifOpen" class="sm:hidden fixed left-2 right-2 top-14 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
        <ng-container [ngTemplateOutlet]="dropdownContent"></ng-container>
      </div>
    </div>
  `,
})
export class NotificationDropdownComponent implements OnInit, OnChanges {
  // Inputs to customize behavior/styling
  @Input() role: 'doctor' | 'patient' = 'doctor';
  @Input() widthClass: string = 'w-80';
  @Input() grouped = false;
  @Input() cap = 200;
  @Input() buttonLabel = 'Notifications';
  @Input() showStatus = true;
  @Input() userId: number | null = null;

  // Internal state
  notifOpen = false;
  unreadCount = 0;
  feed: NotificationItem[] = [];
  groupedFeedData: { label: 'Today' | 'Yesterday' | 'Earlier'; items: NotificationItem[] }[] = [];
  notifStatus: NotificationStatus | null = null;

  private auth = inject(AuthService);
  private notifApi = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const uid = this.userId ?? (this.auth.userId() ? Number(this.auth.userId()) : null);
    this.refreshUnreadCount(uid);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      const uid = this.userId ?? (this.auth.userId() ? Number(this.auth.userId()) : null);
      this.refreshUnreadCount(uid);
    }
  }

  toggleNotif() {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) {
      const uid = this.userId ?? (this.auth.userId() ? Number(this.auth.userId()) : null);
      this.fetchNotifications(uid);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.notifOpen) return;
    const target = event.target as Node;
    if (!this.el.nativeElement.contains(target)) {
      this.notifOpen = false;
      this.cdr.markForCheck();
    }
  }

  refreshUnreadCount(userId: number | null) {
    if (userId == null) {
      this.unreadCount = 0;
      this.cdr.markForCheck();
      return;
    }
    const unread$ = this.role === 'doctor'
      ? this.notifApi.getDoctorUnreadCount(userId)
      : this.notifApi.getPatientUnreadCount(userId);
    unread$.subscribe({
      next: (n) => {
        this.unreadCount = n || 0;
        this.cdr.markForCheck();
      },
    });
  }

  fetchNotifications(userId: number | null) {
    this.notifApi.getStatus().subscribe({ next: (s) => (this.notifStatus = s) });
    if (userId == null) {
      this.feed = [];
      this.groupedFeedData = [];
      this.cdr.markForCheck();
      return;
    }
    const feed$ = this.role === 'doctor'
      ? this.notifApi.getDoctorFeed(userId)
      : this.notifApi.getPatientFeed(userId);
    feed$.subscribe({
      next: (items) => {
        const capped = (items || []).slice(0, this.cap);
        this.feed = capped;
        this.groupedFeedData = this.grouped ? this.computeGroupedFeed(capped) : [];
        this.cdr.markForCheck();
      },
    });
    this.refreshUnreadCount(userId);
  }

  computeGroupedFeed(list: NotificationItem[]): { label: 'Today' | 'Yesterday' | 'Earlier'; items: NotificationItem[] }[] {
    const groups: Record<string, NotificationItem[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const n of list) {
      const label = this.notifApi.getGroupLabel(n.timestamp);
      (groups[label] ||= []).push(n);
    }
    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label: label as 'Today' | 'Yesterday' | 'Earlier', items }));
  }

  trackGroup(index: number, g: { label: 'Today' | 'Yesterday' | 'Earlier'; items: NotificationItem[] }) {
    return g.label;
  }

  trackNotif(index: number, n: NotificationItem) {
    return n.id ?? index;
  }

  onNotificationClick(n: NotificationItem) {
    const idNum = typeof n.id === 'string' ? Number(n.id) : (n.id as number | undefined);
    if (idNum) {
      this.notifApi.markRead(idNum).subscribe({
        next: () => {
          n.read = true;
          this.unreadCount = Math.max(0, (this.unreadCount || 0) - 1);
          this.cdr.markForCheck();
        },
      });
    }
    if (n.link) this.router.navigateByUrl(n.link);
  }
}