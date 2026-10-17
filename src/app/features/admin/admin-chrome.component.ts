import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

export type AdminSection = 'overview' | 'specializations' | 'users' | 'doctors' | 'appointments' | 'labtests' | 'master'
  | 'security' | 'analytics';
type ThemeChoice = 'light' | 'dark' | 'system';

interface AdminNavItem {
  section: AdminSection;
  label: string;
  icon: string;
  hint: string;
}

interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

/**
 * Admin layout: left sidebar (slide-out menu on small screens), top bar with the section title,
 * and the page content projected into the scrolling area.
 */
@Component({
  selector: 'app-admin-chrome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-[calc(100dvh-3.5rem)] flex bg-[var(--bg)] text-[var(--text)]">

      <!-- Sidebar (desktop) -->
      <aside class="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]" aria-label="Admin navigation">
        <ng-container *ngTemplateOutlet="sidebar"></ng-container>
      </aside>

      <!-- Sidebar (mobile slide-out) -->
      <div *ngIf="menuOpen" class="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Admin navigation">
        <div class="absolute inset-0 bg-black/50" (click)="menuOpen = false"></div>
        <aside class="relative w-72 max-w-[85vw] h-full flex flex-col bg-[var(--panel)] border-r border-[var(--border)] shadow-2xl">
          <ng-container *ngTemplateOutlet="sidebar"></ng-container>
        </aside>
      </div>

      <div class="flex-1 min-w-0 flex flex-col">
        <!-- Top bar -->
        <header class="shrink-0 h-14 flex items-center justify-between gap-3 px-3 sm:px-6 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-md">
          <div class="flex items-center gap-2.5 min-w-0">
            <button type="button" (click)="menuOpen = true" aria-label="Open menu"
              class="lg:hidden w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] inline-flex items-center justify-center text-[var(--text)]">
              <i class="fa-solid fa-bars text-sm" aria-hidden="true"></i>
            </button>
            <div class="min-w-0">
              <h1 class="text-base sm:text-lg font-bold truncate">{{ current.label }}</h1>
              <p class="hidden sm:block text-[11px] text-[var(--muted)] truncate">{{ current.hint }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <div class="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg)] p-0.5" role="group" aria-label="Theme">
              <button type="button" (click)="setTheme('light')" [attr.aria-pressed]="currentTheme === 'light'" aria-label="Light theme" title="Light" [ngClass]="themeButtonClass('light')">
                <i class="fa-solid fa-sun text-xs" aria-hidden="true"></i>
              </button>
              <button type="button" (click)="setTheme('dark')" [attr.aria-pressed]="currentTheme === 'dark'" aria-label="Dark theme" title="Dark" [ngClass]="themeButtonClass('dark')">
                <i class="fa-solid fa-moon text-xs" aria-hidden="true"></i>
              </button>
              <button type="button" (click)="setTheme('system')" [attr.aria-pressed]="currentTheme === 'system'" aria-label="System theme" title="System" [ngClass]="themeButtonClass('system')">
                <i class="fa-solid fa-desktop text-xs" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </header>

        <!-- Page content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <ng-content></ng-content>
        </div>
      </div>
    </div>

    <ng-template #sidebar>
      <div class="h-14 shrink-0 flex items-center gap-2.5 px-4 border-b border-[var(--border)]">
        <img src="/logo-cross1.png" alt="" class="w-8 h-8 object-contain" />
        <div class="min-w-0">
          <div class="text-sm font-bold leading-tight">CareSync Admin</div>
          <div class="text-[10px] text-[var(--muted)] leading-tight">System management</div>
        </div>
        <button type="button" (click)="menuOpen = false" aria-label="Close menu"
          class="lg:hidden ml-auto w-8 h-8 rounded-lg text-[var(--muted)] hover:text-[var(--text)] inline-flex items-center justify-center">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
        <div *ngFor="let group of navGroups">
          <div class="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{{ group.title }}</div>
          <div class="space-y-0.5">
            <a *ngFor="let item of group.items" [routerLink]="linkFor(item.section)" [queryParams]="queryFor(item.section)"
              (click)="menuOpen = false" class="admin-nav-link" [class.admin-nav-link--active]="section === item.section"
              [attr.aria-current]="section === item.section ? 'page' : null">
              <i [class]="item.icon + ' w-4 text-center text-sm'" aria-hidden="true"></i>
              <span class="flex-1 truncate">{{ item.label }}</span>
              <span *ngIf="badgeFor(item.section) as badge" class="admin-nav-count" [class.admin-nav-count--alert]="badge.alert">{{ badge.value }}</span>
            </a>
          </div>
        </div>
      </nav>

      <div class="shrink-0 border-t border-[var(--border)] p-3 flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-xs font-bold uppercase shrink-0">
          {{ (auth.username() || 'A').charAt(0) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-semibold truncate">{{ auth.username() }}</div>
          <div class="text-[10px] text-[var(--muted)]">Administrator</div>
        </div>
        <button type="button" (click)="logout()" title="Sign out" aria-label="Sign out"
          class="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:text-rose-500 inline-flex items-center justify-center transition">
          <i class="fa-solid fa-right-from-bracket text-xs" aria-hidden="true"></i>
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    .admin-nav-link {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      height: 38px;
      padding: 0 0.625rem;
      border-radius: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--muted);
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .admin-nav-link:hover {
      color: var(--text);
      background: color-mix(in srgb, var(--text) 6%, transparent);
    }
    .admin-nav-link--active,
    .admin-nav-link--active:hover {
      color: var(--primary);
      background: var(--primary-soft);
    }
    .admin-nav-count {
      min-width: 1.375rem;
      padding: 0.0625rem 0.375rem;
      border-radius: 9999px;
      text-align: center;
      font-size: 0.65rem;
      font-weight: 700;
      background: var(--bg);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .admin-nav-count--alert {
      background: rgb(244 63 94 / 0.12);
      color: #be123c;
      border-color: rgb(244 63 94 / 0.35);
    }
    :host-context(.dark) .admin-nav-count--alert {
      color: #fda4af;
    }
  `]
})
export class AdminChromeComponent implements OnInit {
  auth = inject(AuthService);
  private theme = inject(ThemeService);

  @Input() section: AdminSection = 'overview';
  @Input() userCount: number | null = null;
  @Input() pendingDoctorCount: number | null = null;
  @Input() blockedCount: number | null = null;

  menuOpen = false;
  currentTheme: ThemeChoice = 'dark';

  readonly navGroups: AdminNavGroup[] = [
    {
      title: 'General',
      items: [
        { section: 'overview', label: 'Overview', icon: 'fa-solid fa-gauge-high', hint: 'Key numbers and what needs your attention' },
        { section: 'analytics', label: 'Analytics', icon: 'fa-solid fa-chart-line', hint: 'Appointment volume, completion and no-show rates' },
        { section: 'specializations', label: 'Specializations', icon: 'fa-solid fa-stethoscope', hint: 'Doctors per specialization and where doctors are missing' },
      ],
    },
    {
      title: 'Manage',
      items: [
        { section: 'users', label: 'Users', icon: 'fa-solid fa-users', hint: 'Accounts, status, passwords and sign-ins' },
        { section: 'doctors', label: 'Doctor verification', icon: 'fa-solid fa-user-doctor', hint: 'Review credentials and verify doctors' },
        { section: 'appointments', label: 'Appointments', icon: 'fa-solid fa-calendar-check', hint: 'Find an appointment, see its history and fix stuck ones' },
        { section: 'labtests', label: 'Lab tests', icon: 'fa-solid fa-flask', hint: 'Tests patients can book, with prices' },
        { section: 'master', label: 'Master data', icon: 'fa-solid fa-database', hint: 'Dropdown options used across the app' },
      ],
    },
    {
      title: 'Security',
      items: [
        { section: 'security', label: 'Security', icon: 'fa-solid fa-shield-halved', hint: 'Blocked IP addresses and data encryption' },
      ],
    },
  ];

  get current(): AdminNavItem {
    for (const group of this.navGroups) {
      const found = group.items.find((i) => i.section === this.section);
      if (found) return found;
    }
    return this.navGroups[0].items[0];
  }

  ngOnInit() {
    this.currentTheme = this.theme.getTheme();
  }

  linkFor(section: AdminSection): string {
    return section === 'analytics' ? '/admin/appointment-analytics' : '/admin';
  }

  queryFor(section: AdminSection): Record<string, string> | null {
    return section === 'analytics' ? null : { tab: section };
  }

  badgeFor(section: AdminSection): { value: number; alert: boolean } | null {
    if (section === 'users' && this.userCount !== null) return { value: this.userCount, alert: false };
    if (section === 'doctors' && this.pendingDoctorCount) return { value: this.pendingDoctorCount, alert: true };
    if (section === 'security' && this.blockedCount) return { value: this.blockedCount, alert: true };
    return null;
  }

  setTheme(choice: ThemeChoice) {
    this.currentTheme = choice;
    this.theme.setTheme(choice);
  }

  themeButtonClass(choice: ThemeChoice): string {
    const base = 'w-8 h-8 rounded-md inline-flex items-center justify-center transition';
    return this.currentTheme === choice
      ? `${base} bg-[var(--primary)] text-white`
      : `${base} text-[var(--muted)] hover:text-[var(--text)]`;
  }

  logout() {
    this.auth.logout();
  }
}
