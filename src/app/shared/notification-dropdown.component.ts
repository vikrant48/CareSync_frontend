import { Component, Input, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationService, NotificationItem } from '../core/services/notification.service';
import { EmptyStateComponent } from './ui/empty-state.component';

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
               bg-[#151b2b] text-gray-300 hover:text-white hover:bg-[#1b2333] active:scale-95 border border-[#2a3347] focus:outline-none shadow-sm cursor-pointer"
        [ngClass]="notifOpen ? 'bg-[#1b2333] text-white border-[#5b6cf0] ring-2 ring-[#5b6cf0]/30' : ''"
        (click)="toggleNotif()" 
        title="Notifications" 
        aria-label="Notifications"
        [attr.aria-expanded]="notifOpen"
        aria-haspopup="true">
        <i class="fa-solid fa-bell text-base sm:text-lg text-[#9aa3b8] group-hover:text-white transition-colors"></i>
        
        <!-- Unread Badge (Clean Circle / Pill) -->
        <span *ngIf="unreadCount > 0" class="absolute -top-1 -right-1 z-20 flex">
           <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
           <span class="relative inline-flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-md border border-[#0b0f1a] leading-none px-1.5 py-0.5 min-w-[18px] h-4.5">
             {{ unreadCount > 9 ? '9+' : unreadCount }}
           </span>
        </span>
      </button>

      <!-- Dropdown Panel Template -->
      <ng-template #dropdownContent>
        <div class="w-full sm:w-[410px] bg-[#121826] border border-[#2a3347] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white text-left relative z-[9999]">
          
          <!-- Top Arrow Pointer (Desktop) -->
          <div class="hidden sm:block absolute -top-2 right-4 w-3.5 h-3.5 bg-[#121826] border-t border-l border-[#2a3347] rotate-45 z-20"></div>

          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3.5 border-b border-[#2a3347] bg-[#151b2b] relative z-10">
            <div class="flex items-center gap-2.5">
              <h3 class="text-base font-extrabold text-white tracking-tight">Notifications</h3>
              <span *ngIf="unreadCount > 0" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#5b6cf0]/20 text-[#5b6cf0] border border-[#5b6cf0]/30">
                {{ unreadCount }} New
              </span>
            </div>
            <button 
              *ngIf="unreadCount > 0"
              (click)="markAllRead($event)"
              class="text-xs text-[#5b6cf0] hover:text-[#7080f5] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i class="fa-solid fa-circle-check text-[11px]"></i>
              <span>Mark all as read</span>
            </button>
          </div>

          <!-- Filter Tabs Row -->
          <div class="flex items-center gap-1 px-3 py-2 bg-[#121826] border-b border-[#2a3347] overflow-x-auto no-scrollbar text-xs">
            <button (click)="setTab('all')"
              class="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              [ngClass]="activeTab === 'all' ? 'bg-[#5b6cf0] text-white shadow-sm shadow-[#5b6cf0]/30' : 'text-[#9aa3b8] hover:text-white hover:bg-[#1b2333]'">
              <span>All</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-[#1b2333] text-[#9aa3b8]'">{{ feed.length }}</span>
            </button>

            <button (click)="setTab('appointments')"
              class="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              [ngClass]="activeTab === 'appointments' ? 'bg-[#5b6cf0] text-white shadow-sm shadow-[#5b6cf0]/30' : 'text-[#9aa3b8] hover:text-white hover:bg-[#1b2333]'">
              <span>Appointments</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'appointments' ? 'bg-white/20 text-white' : 'bg-[#1b2333] text-[#9aa3b8]'">{{ appointmentsCount }}</span>
            </button>

            <button (click)="setTab('lab')"
              class="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              [ngClass]="activeTab === 'lab' ? 'bg-[#5b6cf0] text-white shadow-sm shadow-[#5b6cf0]/30' : 'text-[#9aa3b8] hover:text-white hover:bg-[#1b2333]'">
              <span>Lab Tests</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'lab' ? 'bg-white/20 text-white' : 'bg-[#1b2333] text-[#9aa3b8]'">{{ labCount }}</span>
            </button>

            <button (click)="setTab('system')"
              class="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              [ngClass]="activeTab === 'system' ? 'bg-[#5b6cf0] text-white shadow-sm shadow-[#5b6cf0]/30' : 'text-[#9aa3b8] hover:text-white hover:bg-[#1b2333]'">
              <span>System</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px]" [ngClass]="activeTab === 'system' ? 'bg-white/20 text-white' : 'bg-[#1b2333] text-[#9aa3b8]'">{{ systemCount }}</span>
            </button>
          </div>

          <!-- Scrollable Content Feed -->
          <div class="max-h-[380px] overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-[#0b0f1a]/50">
            
            <!-- Empty State -->
            <app-empty-state
              *ngIf="filteredFeed.length === 0"
              icon="fa-solid fa-bell-slash"
              title="No notifications"
              message="You have no notifications in this category."
              [compact]="true"
              iconWrapClass="bg-[#1b2333] text-[#9aa3b8]"
              containerClass="py-8"
            ></app-empty-state>

            <!-- Card List -->
            <div 
              *ngFor="let n of filteredFeed; trackBy: trackNotif" 
              (click)="onNotificationClick(n)"
              class="bg-[#151b2b] hover:bg-[#1b2333] border border-[#2a3347] hover:border-[#3b4763] rounded-xl p-3.5 transition-all cursor-pointer group relative shadow-sm"
              [ngClass]="!n.read ? 'ring-1 ring-[#5b6cf0]/40' : ''">
              
              <div class="flex items-start gap-3">
                
                <!-- Icon Box with Status Dot -->
                <div class="relative shrink-0">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-base" [ngClass]="getIconBgClass(n.type)">
                    <i class="fa-solid" [ngClass]="getIconClass(n.type)"></i>
                  </div>
                  <!-- Corner Status Dot -->
                  <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#151b2b]"
                        [ngClass]="getStatusDotClass(n.type)"></span>
                </div>

                <!-- Text & Metadata -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <h4 class="text-xs sm:text-sm font-bold truncate transition-colors" [class.text-white]="!n.read" [class.text-[#9aa3b8]]="n.read">
                      {{ n.title }}
                    </h4>
                    <span class="text-[10px] text-[#9aa3b8] font-medium whitespace-nowrap shrink-0">
                      {{ formatDate(n.timestamp) }}
                    </span>
                  </div>

                  <p class="text-xs text-[#9aa3b8] line-clamp-2 leading-relaxed">
                    {{ n.message }}
                  </p>

                  <!-- Contextual Action Buttons -->
                  <div class="flex items-center justify-between pt-2 mt-1">
                    <ng-container [ngSwitch]="getActionButtonType(n)">
                      <button *ngSwitchCase="'view-report'" type="button"
                        class="bg-[#5b6cf0]/15 hover:bg-[#5b6cf0] border border-[#5b6cf0]/30 text-[#5b6cf0] hover:text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-all cursor-pointer">
                        View Report
                      </button>
                      <button *ngSwitchCase="'give-feedback'" type="button"
                        class="bg-[#5b6cf0]/15 hover:bg-[#5b6cf0] border border-[#5b6cf0]/30 text-[#5b6cf0] hover:text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-all cursor-pointer">
                        Give Feedback
                      </button>
                    </ng-container>
                  </div>

                </div>

              </div>

            </div>

          </div>

          <!-- Footer -->
          <div class="px-4 py-3 border-t border-[#2a3347] bg-[#151b2b] text-center">
            <a routerLink="/notifications" (click)="notifOpen=false" 
              class="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#5b6cf0] hover:text-[#7080f5] transition-colors">
              <span>View All Notifications</span>
              <i class="fa-solid fa-arrow-right text-[11px]"></i>
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

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    const uid = this.userId ?? (this.auth.userId() ? Number(this.auth.userId()) : null);
    this.refreshUnreadCount(uid);

    this.notifApi.listenForRealTimeNotifications().subscribe((notification: NotificationItem) => {
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
      case 'cancellation': return 'fa-calendar-xmark text-rose-400';
      case 'lab': case 'report': case 'lab_report': return 'fa-flask';
      case 'feedback': case 'message': return 'fa-comment-dots';
      case 'system': case 'security': return 'fa-shield-halved';
      default: return 'fa-bell';
    }
  }

  getIconBgClass(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'appointment': return 'bg-[#5b6cf0]/20 text-[#5b6cf0]';
      case 'cancellation': return 'bg-rose-500/20 text-rose-400';
      case 'lab': case 'report': case 'lab_report': return 'bg-purple-500/20 text-purple-400';
      case 'feedback': case 'message': return 'bg-indigo-500/20 text-indigo-400';
      case 'system': case 'security': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-[#1b2333] text-[#9aa3b8]';
    }
  }

  getStatusDotClass(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'appointment': return 'bg-emerald-400';
      case 'cancellation': return 'bg-rose-500';
      case 'lab': case 'report': case 'lab_report': return 'bg-purple-400';
      case 'feedback': return 'bg-indigo-400';
      case 'system': case 'security': return 'bg-amber-400';
      default: return 'bg-[#5b6cf0]';
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
