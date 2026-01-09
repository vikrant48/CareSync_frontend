import { Component, Input, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationService, NotificationItem, NotificationStatus } from '../core/services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative group">
      <!-- Trigger Button -->
      <button 
        class="relative flex items-center justify-center sm:gap-2 px-3 py-2 rounded-xl transition-all duration-300
               text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 active:scale-95 border border-transparent hover:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        [class.bg-blue-500_10]="notifOpen"
        [class.text-blue-400]="notifOpen"
        (click)="toggleNotif()" 
        title="Notifications" 
        aria-label="Notifications"
      >
        <div class="relative">
          <i class="fa-regular fa-bell text-xl sm:text-lg"></i>
          <span *ngIf="unreadCount > 0" class="absolute -top-1.5 -right-1.5 flex h-4 w-4">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
             <span class="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold text-white items-center justify-center">
               {{ unreadCount > 9 ? '9+' : unreadCount }}
             </span>
          </span>
        </div>
        <span class="hidden sm:inline text-sm font-medium">{{ buttonLabel }}</span>
      </button>

      <!-- Dropdown Panel -->
      <ng-template #dropdownContent>
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/95 sticky top-0 z-10 backdrop-blur-md">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-gray-100">Notifications</span>
            <span *ngIf="unreadCount > 0" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20">
              {{ unreadCount }} New
            </span>
          </div>
          <button 
            *ngIf="unreadCount > 0"
            (click)="markAllRead($event)"
            class="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline"
          >
            Mark all read
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="max-h-[70vh] sm:max-h-96 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          
          <!-- Loading/Status (Optional) -->
          <div *ngIf="showStatus && notifStatus" class="px-4 py-2 text-[10px] text-gray-500 bg-gray-900/50 border-b border-gray-800/50 flex justify-between">
             <span>Service Status</span>
             <span [class.text-green-500]="notifStatus.status !== 'Unknown'" [class.text-gray-500]="notifStatus.status === 'Unknown'">
               {{ notifStatus.status }}
             </span>
          </div>

          <!-- Empty State -->
          <div *ngIf="feed.length === 0 && groupedFeedData.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div class="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-3 text-gray-600">
               <i class="fa-regular fa-bell-slash text-2xl"></i>
            </div>
            <p class="text-gray-400 text-sm font-medium">No notifications yet</p>
            <p class="text-gray-500 text-xs mt-1">We'll let you know when something important arrives.</p>
          </div>

          <!-- Grouped List -->
          <ng-container *ngIf="grouped; else flatList">
            <ng-container *ngFor="let g of groupedFeedData; trackBy: trackGroup">
              <div class="px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-gray-800/30 sticky top-0 backdrop-blur-sm">{{ g.label }}</div>
              <button 
                *ngFor="let n of g.items; trackBy: trackNotif" 
                class="w-full text-left px-4 py-3 border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-200 group relative overflow-hidden"
                [class.bg-blue-500_05]="!n.read"
                (click)="onNotificationClick(n)"
              >
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-transform duration-300" [class.-translate-x-full]="n.read"></div>
                
                <div class="flex gap-3">
                   <div class="flex-shrink-0 mt-0.5">
                     <div class="w-8 h-8 rounded-full flex items-center justify-center" [ngClass]="getIconBgClass(n.type)">
                       <i class="fa-solid" [ngClass]="getIconClass(n.type)"></i>
                     </div>
                   </div>
                   <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2 mb-0.5">
                        <p class="text-sm font-semibold truncate pr-2" [class.text-gray-100]="!n.read" [class.text-gray-400]="n.read">
                          {{ n.title }}
                        </p>
                        <span class="text-[10px] text-gray-500 whitespace-nowrap">{{ n.timestamp | date:'shortTime' }}</span>
                      </div>
                      <p class="text-xs text-gray-400 line-clamp-2 leading-relaxed" [class.text-gray-300]="!n.read">
                        {{ n.message }}
                      </p>
                   </div>
                </div>
              </button>
            </ng-container>
          </ng-container>

          <!-- Flat List -->
          <ng-template #flatList>
            <button 
              *ngFor="let n of feed; trackBy: trackNotif" 
              class="w-full text-left px-4 py-3 border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-200 group relative overflow-hidden"
              [class.bg-blue-500_05]="!n.read"
              (click)="onNotificationClick(n)"
            >
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-transform duration-300" [class.-translate-x-full]="n.read"></div>
              
              <div class="flex gap-3">
                 <div class="flex-shrink-0 mt-0.5">
                   <div class="w-8 h-8 rounded-full flex items-center justify-center" [ngClass]="getIconBgClass(n.type)">
                     <i class="fa-solid" [ngClass]="getIconClass(n.type)"></i>
                   </div>
                 </div>
                 <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-0.5">
                      <div class="text-sm font-semibold" [class.text-gray-100]="!n.read" [class.text-gray-400]="n.read">
                        {{ n.title }}
                      </div>
                      <span class="text-[10px] text-gray-500 whitespace-nowrap">{{ n.timestamp | date:'MMM d, h:mm a' }}</span>
                    </div>
                    <p class="text-xs text-gray-400 line-clamp-2 leading-relaxed" [class.text-gray-300]="!n.read">
                      {{ n.message }}
                    </p>
                 </div>
              </div>
            </button>
          </ng-template>
        </div>
        
        <!-- Footer -->
        <div class="px-4 py-2 border-t border-gray-700/50 bg-gray-900/95 backdrop-blur-md rounded-b-xl">
           <a routerLink="/notifications" class="block text-center text-xs text-blue-400 hover:text-blue-300 hover:underline py-1 transition-colors">
             View All Notifications
           </a>
        </div>
      </ng-template>

      <!-- Panel Container (Desktop) -->
      <div 
        *ngIf="notifOpen" 
        class="hidden sm:block absolute right-0 mt-3 bg-[#111827] border border-gray-700/50 rounded-xl shadow-2xl z-[100] origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5" 
        [ngClass]="widthClass"
      >
        <ng-container [ngTemplateOutlet]="dropdownContent"></ng-container>
      </div>

      <!-- Backdrop (Mobile) -->
      <div *ngIf="notifOpen" class="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" (click)="notifOpen=false"></div>

      <!-- Panel Container (Mobile) -->
      <div 
        *ngIf="notifOpen" 
        class="sm:hidden fixed inset-x-4 top-20 bg-[#111827] border border-gray-700/50 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-300 ring-1 ring-black/5 max-h-[80vh] flex flex-col"
      >
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
  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    const uid = this.userId ?? (this.auth.userId() ? Number(this.auth.userId()) : null);
    this.refreshUnreadCount(uid);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only refresh if userId actually changed and it's not the first change (which is handled by ngOnInit)
    if (changes['userId'] && !changes['userId'].firstChange) {
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
    if (idNum && !n.read) {
      this.notifApi.markRead(idNum).subscribe({
        next: () => {
          n.read = true;
          this.unreadCount = Math.max(0, (this.unreadCount || 0) - 1);
          this.cdr.markForCheck();
        },
      });
    }
    if (n.link) {
      this.router.navigateByUrl(n.link);
      this.notifOpen = false; // Close dropdown on navigation
    }
  }

  markAllRead(event: Event) {
    event.stopPropagation();
    // Assuming backend has an endpoint or we mark all loaded ones
    // For now, iterate and mark locally to simulate UI update if backend API is limited
    // Ideal: this.notifApi.markAllRead(this.userId).subscribe(...)

    // Quick local update for immediate feedback
    let marked = 0;
    this.feed.forEach(n => {
      if (!n.read) {
        n.read = true;
        marked++;
        // Fire and forget individual calls if bulk endpoint missing, 
        // or just rely on refresh. Here we just simulate visual clear.
        const idNum = typeof n.id === 'string' ? Number(n.id) : (n.id as number | undefined);
        if (idNum) this.notifApi.markRead(idNum).subscribe();
      }
    });
    this.unreadCount = 0;
    this.cdr.markForCheck();
  }

  getIconClass(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'appointment': return 'fa-calendar-check';
      case 'cancellation': return 'fa-calendar-xmark text-red-400';
      case 'bill': case 'payment': return 'fa-file-invoice-dollar';
      case 'lab': case 'report': return 'fa-flask';
      case 'message': return 'fa-comment-dots';
      case 'system': return 'fa-gear';
      default: return 'fa-bell';
    }
  }

  getIconBgClass(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'appointment': return 'bg-blue-500/20 text-blue-400';
      case 'cancellation': return 'bg-red-500/20 text-red-400';
      case 'bill': case 'payment': return 'bg-green-500/20 text-green-400';
      case 'lab': case 'report': return 'bg-purple-500/20 text-purple-400';
      case 'message': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-700/50 text-gray-400';
    }
  }
}