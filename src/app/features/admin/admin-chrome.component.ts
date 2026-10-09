import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

export type AdminSection = 'users' | 'doctors' | 'master' | 'security' | 'analytics';
type ThemeChoice = 'light' | 'dark' | 'system';

@Component({
  selector: 'app-admin-chrome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sticky top-0 z-40 shrink-0 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm">
      <header class="bg-[var(--panel)]/80">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 shrink-0 text-sm sm:text-base">
              CS
            </div>
            <div class="min-w-0">
              <h1 class="font-display text-base sm:text-xl font-bold text-[var(--text)] truncate">CareSync Admin</h1>
              <p class="text-[10px] sm:text-xs text-muted truncate">System Management & Governance</p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <div class="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg)] p-0.5" role="group" aria-label="Theme">
              <button type="button" (click)="setTheme('light')" [attr.aria-pressed]="currentTheme === 'light'" aria-label="Light theme" [ngClass]="themeButtonClass('light')">
                <i class="fa-solid fa-sun text-xs" aria-hidden="true"></i>
              </button>
              <button type="button" (click)="setTheme('dark')" [attr.aria-pressed]="currentTheme === 'dark'" aria-label="Dark theme" [ngClass]="themeButtonClass('dark')">
                <i class="fa-solid fa-moon text-xs" aria-hidden="true"></i>
              </button>
              <button type="button" (click)="setTheme('system')" [attr.aria-pressed]="currentTheme === 'system'" aria-label="System theme" [ngClass]="themeButtonClass('system')">
                <i class="fa-solid fa-desktop text-xs" aria-hidden="true"></i>
              </button>
            </div>
            <span class="hidden md:inline text-xs px-3 py-1 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/30 text-[var(--primary)] font-medium">
              Admin: {{ auth.username() }}
            </span>
            <button type="button" (click)="logout()"
              class="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[var(--text)] bg-[var(--bg)] hover:bg-[var(--border)] rounded-lg border border-[var(--border)] transition min-h-touch inline-flex items-center gap-1.5"
              aria-label="Sign out">
              <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
              <span class="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <nav class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8" aria-label="Admin sections">
        <div class="flex items-stretch gap-1 sm:gap-2 overflow-x-auto no-scrollbar -mb-px py-1 sm:py-0">
          <a routerLink="/admin" [queryParams]="{ tab: 'users' }" class="admin-tab" [class.admin-tab--active]="section === 'users'" [attr.aria-current]="section === 'users' ? 'page' : null">
            <i class="fa-solid fa-users text-sm" aria-hidden="true"></i>
            <span class="admin-tab-label">Users</span>
            <span *ngIf="userCount !== null" class="admin-tab-count">{{ userCount }}</span>
          </a>
          <a routerLink="/admin" [queryParams]="{ tab: 'doctors' }" class="admin-tab" [class.admin-tab--active]="section === 'doctors'" [attr.aria-current]="section === 'doctors' ? 'page' : null">
            <i class="fa-solid fa-user-doctor text-sm" aria-hidden="true"></i>
            <span class="admin-tab-label">Doctors</span>
            <span *ngIf="doctorCount !== null" class="admin-tab-count">{{ doctorCount }}</span>
          </a>
          <a routerLink="/admin" [queryParams]="{ tab: 'master' }" class="admin-tab" [class.admin-tab--active]="section === 'master'" [attr.aria-current]="section === 'master' ? 'page' : null">
            <i class="fa-solid fa-database text-sm" aria-hidden="true"></i>
            <span class="admin-tab-label">Master</span>
          </a>
          <a routerLink="/admin" [queryParams]="{ tab: 'security' }" class="admin-tab" [class.admin-tab--active]="section === 'security'" [attr.aria-current]="section === 'security' ? 'page' : null">
            <i class="fa-solid fa-shield-halved text-sm" aria-hidden="true"></i>
            <span class="admin-tab-label">Security</span>
            <span *ngIf="blockedCount !== null" class="admin-tab-count admin-tab-count--alert">{{ blockedCount }}</span>
          </a>
          <a routerLink="/admin/appointment-analytics" class="admin-tab" [class.admin-tab--active]="section === 'analytics'" [attr.aria-current]="section === 'analytics' ? 'page' : null">
            <i class="fa-solid fa-chart-line text-sm" aria-hidden="true"></i>
            <span class="admin-tab-label">Analytics</span>
          </a>
        </div>
      </nav>
    </div>
  `,
  styles: [`
    .admin-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      flex-shrink: 0;
      padding: 0.625rem 0.75rem;
      min-height: 44px;
      border-bottom: 2px solid transparent;
      color: var(--muted);
      font-size: 0.75rem;
      font-weight: 600;
      transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
      border-radius: 0.5rem 0.5rem 0 0;
    }
    @media (min-width: 640px) {
      .admin-tab {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        gap: 0.5rem;
      }
    }
    .admin-tab:hover {
      color: var(--text);
      background: color-mix(in srgb, var(--text) 6%, transparent);
    }
    .admin-tab--active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      background: var(--primary-soft);
    }
    .admin-tab-label { white-space: nowrap; }
    .admin-tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 700;
      background: var(--bg);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .admin-tab-count--alert {
      background: rgb(244 63 94 / 0.12);
      color: #be123c;
      border: 1px solid rgb(244 63 94 / 0.35);
    }
    :host-context(.dark) .admin-tab-count--alert,
    :host-context(.theme-dark) .admin-tab-count--alert {
      color: #fda4af;
    }
  `]
})
export class AdminChromeComponent implements OnInit {
  auth = inject(AuthService);
  private theme = inject(ThemeService);

  @Input() section: AdminSection = 'users';
  @Input() userCount: number | null = null;
  @Input() doctorCount: number | null = null;
  @Input() blockedCount: number | null = null;

  currentTheme: ThemeChoice = 'dark';

  ngOnInit() {
    this.currentTheme = this.theme.getTheme();
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
