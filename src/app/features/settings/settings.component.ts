import { Component, inject, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientProfileService, PatientDto } from '../../core/services/patient-profile.service';
import { ToastService } from '../../core/services/toast.service';
import { ChangePasswordFormComponent } from '../../shared/change-password-form.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChangePasswordFormComponent, PageHeaderComponent],
  styles: [`
    .theme-option {
      position: relative;
      min-height: 44px;
      border: 2px solid var(--border);
      background: color-mix(in srgb, var(--bg) 65%, var(--panel));
      color: var(--text);
      border-radius: var(--radius-xl);
    }
    .theme-option:hover {
      border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
    }
    .theme-option.is-selected {
      border-color: var(--primary);
      background: var(--primary-soft);
    }
    .theme-option:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--primary-muted);
    }
    .pref-row {
      background: color-mix(in srgb, var(--bg) 50%, transparent);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .pref-row:hover {
      border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
    }
    .toggle-track {
      background: var(--border);
    }
    .toggle-track.is-on {
      background: var(--primary);
    }
    .lang-select {
      width: 100%;
      min-height: 44px;
    }
    @media (min-width: 640px) {
      .lang-select {
        width: auto;
        min-width: 8.5rem;
      }
    }
  `],
  template: `
    <!-- Settings Main Template -->
    <ng-template #settingsContent>
      <div class="max-w-7xl mx-auto p-3 sm:p-5 space-y-4 animate-fade-in">

        <app-page-header variant="hero" size="compact"
          title="Settings"
          subtitle="Manage your app preferences and account security.">
        </app-page-header>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">

          <div class="space-y-6 sm:space-y-8">

            <div class="surface p-5 sm:p-6 shadow-sm space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center text-lg shrink-0">
                  <i class="fa-solid fa-palette" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <h2 class="heading text-base font-bold">Appearance</h2>
                  <p class="text-xs sm:text-sm text-muted">Choose your preferred theme for a comfortable experience.</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2" role="group" aria-label="Theme">
                <button type="button" (click)="setTheme('light')"
                  class="theme-option p-3 sm:p-4 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  [class.is-selected]="currentTheme === 'light'"
                  [attr.aria-pressed]="currentTheme === 'light'">
                  <div class="w-10 h-10 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-yellow-500 text-base shadow-sm">
                    <i class="fa-solid fa-sun" aria-hidden="true"></i>
                  </div>
                  <span class="text-xs sm:text-sm font-bold">Light</span>
                  <span class="text-xs text-muted leading-snug">Clean and bright for daytime use</span>
                  <span *ngIf="currentTheme === 'light'" class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold" aria-hidden="true">✓</span>
                </button>

                <button type="button" (click)="setTheme('dark')"
                  class="theme-option p-3 sm:p-4 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  [class.is-selected]="currentTheme === 'dark'"
                  [attr.aria-pressed]="currentTheme === 'dark'">
                  <div class="w-10 h-10 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-brand text-base shadow-sm">
                    <i class="fa-solid fa-moon" aria-hidden="true"></i>
                  </div>
                  <span class="text-xs sm:text-sm font-bold">Dark</span>
                  <span class="text-xs text-muted leading-snug">Easy on eyes for low light</span>
                  <span *ngIf="currentTheme === 'dark'" class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold" aria-hidden="true">✓</span>
                </button>

                <button type="button" (click)="setTheme('system')"
                  class="theme-option p-3 sm:p-4 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  [class.is-selected]="currentTheme === 'system'"
                  [attr.aria-pressed]="currentTheme === 'system'">
                  <div class="w-10 h-10 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-muted text-base shadow-sm">
                    <i class="fa-solid fa-desktop" aria-hidden="true"></i>
                  </div>
                  <span class="text-xs sm:text-sm font-bold">System</span>
                  <span class="text-xs text-muted leading-snug">Follow your device settings</span>
                  <span *ngIf="currentTheme === 'system'" class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold" aria-hidden="true">✓</span>
                </button>
              </div>
            </div>

            <div class="surface p-5 sm:p-6 shadow-sm space-y-5">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                  <i class="fa-solid fa-sliders" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <h2 class="heading text-base font-bold">Preferences</h2>
                  <p class="text-xs sm:text-sm text-muted">Customize your experience.</p>
                </div>
              </div>

              <div class="space-y-4 pt-1">
                <label class="pref-row flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center text-sm shrink-0">
                      <i class="fa-solid fa-bell" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="text-sm font-bold">Notifications</div>
                      <div class="text-xs text-muted">Receive alerts about appointments, test reports and important updates.</div>
                    </div>
                  </div>
                  <div class="toggle-track relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
                       [class.is-on]="notificationsEnabled">
                    <input type="checkbox" class="sr-only" [(ngModel)]="notificationsEnabled" (change)="persistPref('notifications', notificationsEnabled)">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          [class.translate-x-6]="notificationsEnabled"
                          [class.translate-x-1]="!notificationsEnabled"></span>
                  </div>
                </label>

                <label class="pref-row flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center text-sm shrink-0">
                      <i class="fa-solid fa-envelope" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="text-sm font-bold">Email Updates</div>
                      <div class="text-xs text-muted">Receive important updates via email.</div>
                    </div>
                  </div>
                  <div class="toggle-track relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
                       [class.is-on]="emailUpdatesEnabled">
                    <input type="checkbox" class="sr-only" [(ngModel)]="emailUpdatesEnabled" (change)="persistPref('email-updates', emailUpdatesEnabled)">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          [class.translate-x-6]="emailUpdatesEnabled"
                          [class.translate-x-1]="!emailUpdatesEnabled"></span>
                  </div>
                </label>

                <div class="pref-row flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center text-sm shrink-0">
                      <i class="fa-solid fa-globe" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                      <label for="settings-language" class="text-sm font-bold block">Language</label>
                      <div class="text-xs text-muted">Choose your preferred language.</div>
                    </div>
                  </div>
                  <select id="settings-language" [(ngModel)]="selectedLanguage" (change)="persistPref('language', selectedLanguage)"
                    class="form-input lang-select text-xs sm:text-sm font-semibold cursor-pointer">
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>
              </div>

              <div class="pt-3 border-t border-[var(--border)] flex justify-end">
                <button type="button" (click)="resetPreferences()"
                  class="min-h-[44px] px-3 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center gap-1.5 transition-colors cursor-pointer">
                  <i class="fa-solid fa-rotate-right text-xs" aria-hidden="true"></i>
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Account & Security -->
          <div class="space-y-6 sm:space-y-8">
            
            <!-- Account & Security Component -->
            <app-change-password-form></app-change-password-form>

          </div>

        </div>

      </div>
    </ng-template>

    <!-- Layout (doctor / patient / none for admin) comes from the route: RoleLayoutComponent -->
    <ng-container *ngTemplateOutlet="settingsContent"></ng-container>
  `,
})
export class SettingsComponent implements OnInit {
  private theme = inject(ThemeService);
  auth = inject(AuthService);
  private patientService = inject(PatientProfileService);
  private toast = inject(ToastService);

  private isBrowser: boolean;
  currentTheme: 'dark' | 'light' | 'system' = 'dark';
  notificationsEnabled: boolean = true;
  compactUI: boolean = false;
  emailUpdatesEnabled: boolean = true;
  selectedLanguage: string = 'English';

  patientProfile = signal<PatientDto | null>(null);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.currentTheme = this.theme.getTheme();
    if (this.isBrowser) {
      this.notificationsEnabled = localStorage.getItem('notifications') !== 'false';
      this.compactUI = localStorage.getItem('ui-density') === 'compact';
      this.emailUpdatesEnabled = localStorage.getItem('email-updates') !== 'false';
      this.selectedLanguage = localStorage.getItem('language') || 'English';
    }
  }

  ngOnInit() {
    this.loadPatientProfile();
  }

  loadPatientProfile() {
    const username = this.auth.user()?.username;
    if (username && this.auth.role() === 'PATIENT') {
      this.patientService.getProfile(username).subscribe({
        next: (data) => this.patientProfile.set(data),
        error: (err) => console.error('Error fetching patient profile in settings:', err)
      });
    }
  }

  setTheme(t: 'dark' | 'light' | 'system') {
    this.currentTheme = t;
    this.theme.setTheme(t);
  }

  persistPref(key: string, value: any) {
    try {
      if (this.isBrowser) {
        localStorage.setItem(key, String(value));
      }
    } catch { }
  }

  resetPreferences() {
    if (this.isBrowser) {
      ['notifications', 'ui-density', 'email-updates', 'language'].forEach((k) => localStorage.removeItem(k));
    }
    this.notificationsEnabled = true;
    this.compactUI = false;
    this.emailUpdatesEnabled = true;
    this.selectedLanguage = 'English';
    this.setTheme('system');
    this.toast.showSuccess('Preferences reset to defaults.');
  }

  formatDateOfBirth(dob?: string): string {
    if (!dob) return 'Oct 12, 2010';
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return dob;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dob;
    }
  }
}


