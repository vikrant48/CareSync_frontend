import { Component, Input, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, OnInit, OnChanges, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationService, NotificationItem } from '../core/services/notification.service';
import { EmptyStateComponent } from './ui/empty-state.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type NotificationTab = 'all' | 'appointments' | 'lab' | 'system';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative group inline-block">
      <!-- Circular Trigger Button -->
      <button 
        class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300
               bg-[var(--panel)] text-gray-300 hover:text-[var(--text)] hover:bg-[var(--bg)] active:scale-95 border border-[var(--border)] focus:outline-none shadow-sm cursor-pointer"
        [ngClass]="notifOpen ? 'bg-[var(--bg)] text-[var(--text)] border-[var(--primary)] ring-2 ring-[var(--primary)]/30' : ''"
        (click)="toggleNotif()" 
        title="Notifications" 
        aria-label="Notifications"
        [attr.aria-expanded]="notifOpen"
        aria-haspopup="true">
        <i class="fa-solid fa-bell text-base sm:text-lg text-[var(--muted)] group-hover:text-[var(--text)] transition-colors" aria-hidden="true"></i>
        
        <!-- Unread Badge (Clean Circle / Pill) -->
        <span *ngIf="unreadCount > 0" class="absolute -top-1 -right-1 z-20 flex">
           <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
           <span class="relative inline-flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-md border border-[var(--bg)] leading-none px-1.5 py-0.5 min-w-[18px] h-[18px]">
             {{ unreadCount > 9 ? '9+' : unreadCount }}
           </span>
        </span>
      </button>

      <!-- Dropdown Panel Template -->
      <ng-template #dropdownContent>
        <div class="w-full sm:w-[410px] bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[var(--text)] text-left relative z-[9999]">
          
          <!-- Top Arrow Pointer (Desktop) -->
          <div class="hidden sm:block absolute -top-2 right-4 w-3.5 h-3.5 bg-[var(--panel)] border-t border-l border-[var(--border)] rotate-45 z-20"></div>

          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] bg-[var(--panel)] relative z-10">
            <div class="flex items-center gap-2.5">
              <h3 class="text-base font-extrabold text-[var(--text)] tracking-tight">Notifications</h3>
              <span *ngIf="unreadCount > 0" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30">
                {{ unreadCount }} New
              </span>
            </div>
            <button 
              *ngIf="unreadCount > 0"
              (click)="markAllRead($event)"
              class="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-circle-check text-[11px]" aria-hidden="true"></i>
              <span>Mark all as read</span>
            </button>
          </div>

          <!-- Filter Tabs Row -->
          <div class="flex items-center gap-1 px-3 py-2 bg-[var(--panel)] border-b border-[var(--border)] overflow-x-auto no-scrollbar text-xs">
            <button (click)="setTab('all')"
              class="btn-size-sm px-3 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              [ngClass]="activeTab === 'all' ? 'bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/30' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'">
              <span>All</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'all' ? 'bg-white/20 text-[var(--text)]' : 'bg-[var(--bg)] text-[var(--muted)]'">{{ feed.length }}</span>
            </button>

            <button (click)="setTab('appointments')"
              class="btn-size-sm px-3 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              [ngClass]="activeTab === 'appointments' ? 'bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/30' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'">
              <span>Appointments</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'appointments' ? 'bg-white/20 text-[var(--text)]' : 'bg-[var(--bg)] text-[var(--muted)]'">{{ appointmentsCount }}</span>
            </button>

            <button (click)="setTab('lab')"
              class="btn-size-sm px-3 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              [ngClass]="activeTab === 'lab' ? 'bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/30' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'">
              <span>Lab Tests</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'lab' ? 'bg-white/20 text-[var(--text)]' : 'bg-[var(--bg)] text-[var(--muted)]'">{{ labCount }}</span>
            </button>

            <button (click)="setTab('system')"
              class="btn-size-sm px-3 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              [ngClass]="activeTab === 'system' ? 'bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/30' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'">
              <span>System</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'system' ? 'bg-white/20 text-[var(--text)]' : 'bg-[var(--bg)] text-[var(--muted)]'">{{ systemCount }}</span>
            </button>
          </div>

          <!-- Scrollable Content Feed -->
          <div class="max-h-[380px] overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-[var(--bg)]/50">
            
            <!-- Empty State -->
            <app-empty-state
              *ngIf="filteredFeed.length === 0"
              icon="fa-solid fa-bell-slash"
              title="No notifications"
              message="You have no notifications in this category."
              [compact]="true"
              iconWrapClass="bg-[var(--bg)] text-[var(--muted)]"
              containerClass="py-8"
            ></app-empty-state>

            <!-- Card List -->
            <div 
              *ngFor="let n of filteredFeed; trackBy: trackNotif" 
              (click)="onNotificationClick(n)"
              role="button" tabindex="0"
              (keydown.enter)="$event.target === $event.currentTarget && onNotificationClick(n)" (keydown.space)="$event.target === $event.currentTarget && $event.preventDefault(); $event.target === $event.currentTarget && onNotificationClick(n)"
              class="bg-[var(--panel)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border)] rounded-xl p-3.5 transition-all cursor-pointer group relative shadow-sm"
              [ngClass]="!n.read ? 'ring-1 ring-[var(--primary)]/40' : ''">
              
              <div class="flex items-start gap-3">
                
                <!-- Icon Box with Status Dot -->
                <div class="relative shrink-0">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-base" [ngClass]="getIconBgClass(n.type)">
                    <i class="fa-solid" [ngClass]="getIconClass(n.type)" aria-hidden="true"></i>
                  </div>
                  <!-- Corner Status Dot -->
                  <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--panel)]"
                        [ngClass]="getStatusDotClass(n.type)"></span>
                </div>

                <!-- Text & Metadata -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <h4 class="text-xs sm:text-sm font-bold truncate transition-colors" [class.text-[var(--text)]]="!n.read" [class.text-[var(--muted)]]="n.read">
                      {{ n.title }}
                    </h4>
                    <span class="text-[10px] text-[var(--muted)] font-medium whitespace-nowrap shrink-0">
                      {{ formatDate(n.timestamp) }}
                    </span>
                  </div>

                  <p class="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                    {{ n.message }}
                  </p>

                  <!-- Contextual Action Buttons -->
                  <div class="flex items-center justify-between pt-2 mt-1">
                    <ng-container [ngSwitch]="getActionButtonType(n)">
                      <button *ngSwitchCase="'view-report'" type="button"
                        class="btn-size-sm bg-[var(--primary)]/15 hover:bg-[var(--primary)] border border-[var(--primary)]/30 text-[var(--primary)] hover:text-white text-[11px] font-bold px-3 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center">
                        View Report
                      </button>
                      <button *ngSwitchCase="'give-feedback'" type="button"
                        class="btn-size-sm bg-[var(--primary)]/15 hover:bg-[var(--primary)] border border-[var(--primary)]/30 text-[var(--primary)] hover:text-white text-[11px] font-bold px-3 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center">
                        Give Feedback
                      </button>
                    </ng-container>
                  </div>

                </div>

              </div>

            </div>

          </div>

          <!-- Footer -->
          <div class="px-4 py-3 border-t border-[var(--border)] bg-[var(--panel)] text-center">
            <a routerLink="/notifications" (click)="notifOpen=false" 
              class="inline-flex items-center justify-center gap-2 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
              <span>View All Notifications</span>
              <i class="fa-solid fa-arrow-right text-[11px]" aria-hidden="true"></i>
            </a>
          </div>

        </div>
      </ng-template>

      <!-- Panel Container (Desktop) -->
      <div 
        *ngIf="notifOpen" 
        class="hidden sm:block absolute right-0 top-full mt-2.5 z-[9999] origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
        <ng-container [ngTemplateOutlet]="dropdownContent"></ng-container>
      </div>

      <!-- Backdrop (Mobile) -->
      <div *ngIf="notifOpen" class="sm:hidden fixed inset-0 z-[9980] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" (click)="notifOpen=false"></div>

      <!-- Panel Container (Mobile) -->
      <div 
        *ngIf="notifOpen" 
        class="sm:hidden fixed inset-x-3 top-16 z-[9999] animate-in slide-in-from-top-4 duration-300">
        <ng-container [ngTemplateOutlet]="dropdownContent"></ng-container>
      </div>
    </div>
  `,
})
export class NotificationDropdownComponent implements OnInit, OnChanges {
  @Input() role: 'doctor' | 'patient' = 'doctor';
  @Input() widthClass: string = 'w-80';
  @Input() grouped = false;
  @Input() cap = 200;
  @Input() buttonLabel = '';
  @Input() showStatus = true;
  @Input() userId: number | null = null;

  notifOpen = false;
  unreadCount = 0;
  feed: NotificationItem[] = [];
  activeTab: NotificationTab = 'all';

  private auth = inject(AuthService);
  private notifApi = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    const uid = this.userId ?? (this.auth.userId() ? Number(this.auth.userId()) : null);
    this.refreshUnreadCount(uid);

    this.notifApi.listenForRealTimeNotifications().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((notification: NotificationItem) => {
      this.unreadCount = (this.unreadCount || 0) + 1;
      this.feed = [notification, ...this.feed];
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
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

  setTab(tab: NotificationTab) {
    this.activeTab = tab;
  }

  get filteredFeed(): NotificationItem[] {
    if (this.activeTab === 'appointments') {
      return this.feed.filter(n => this.isAppointmentType(n.type));
    }
    if (this.activeTab === 'lab') {
      return this.feed.filter(n => this.isLabType(n.type));
    }
    if (this.activeTab === 'system') {
      return this.feed.filter(n => !this.isAppointmentType(n.type) && !this.isLabType(n.type));
    }
    return this.feed;
  }

  get appointmentsCount(): number {
    return this.feed.filter(n => this.isAppointmentType(n.type)).length;
  }

  get labCount(): number {
    return this.feed.filter(n => this.isLabType(n.type)).length;
  }

  get systemCount(): number {
    return this.feed.filter(n => !this.isAppointmentType(n.type) && !this.isLabType(n.type)).length;
  }

  private isAppointmentType(type?: string): boolean {
    const t = (type || '').toLowerCase();
    return t === 'appointment' || t === 'cancellation' || t === 'reschedule';
  }

  private isLabType(type?: string): boolean {
    const t = (type || '').toLowerCase();
    return t === 'lab' || t === 'report' || t === 'lab_report';
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
    if (userId == null) {
      this.feed = [];
      this.cdr.markForCheck();
      return;
    }
    const feed$ = this.role === 'doctor'
      ? this.notifApi.getDoctorFeed(userId)
      : this.notifApi.getPatientFeed(userId);
    feed$.subscribe({
      next: (items) => {
        this.feed = (items || []).slice(0, this.cap);
        this.cdr.markForCheck();
      },
    });
    this.refreshUnreadCount(userId);
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
      this.notifOpen = false;
    }
  }

  markAllRead(event: Event) {
    event.stopPropagation();
    this.feed.forEach(n => {
      if (!n.read) {
        n.read = true;
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
      case 'cancellation': return 'fa-calendar-xmark text-rose-700 dark:text-rose-400';
      case 'lab': case 'report': case 'lab_report': return 'fa-flask';
      case 'feedback': case 'message': return 'fa-comment-dots';
      case 'system': case 'security': return 'fa-shield-halved';
      default: return 'fa-bell';
    }
  }

  getIconBgClass(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'appointment': return 'bg-[var(--primary)]/20 text-[var(--primary)]';
      case 'cancellation': return 'bg-rose-500/20 text-rose-700 dark:text-rose-400';
      case 'lab': case 'report': case 'lab_report': return 'bg-purple-500/20 text-purple-700 dark:text-purple-400';
      case 'feedback': case 'message': return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400';
      case 'system': case 'security': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
      default: return 'bg-[var(--bg)] text-[var(--muted)]';
    }
  }

  getStatusDotClass(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'appointment': return 'bg-emerald-400';
      case 'cancellation': return 'bg-rose-500';
      case 'lab': case 'report': case 'lab_report': return 'bg-purple-400';
      case 'feedback': return 'bg-indigo-400';
      case 'system': case 'security': return 'bg-amber-400';
      default: return 'bg-[var(--primary)]';
    }
  }

  getActionButtonType(n: NotificationItem): 'view-report' | 'give-feedback' | 'default' {
    const t = (n.type || '').toLowerCase();
    const l = (n.link || '').toLowerCase();
    if (t.includes('lab') || t.includes('report') || l.includes('report') || l.includes('lab')) {
      return 'view-report';
    }
    if (t.includes('feedback') || l.includes('feedback')) {
      return 'give-feedback';
    }
    return 'default';
  }

  formatDate(ts?: string | Date): string {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return String(ts);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(ts);
    }
  }
}
