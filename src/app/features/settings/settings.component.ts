import { Component, inject, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientProfileService, PatientDto } from '../../core/services/patient-profile.service';
import { ToastService } from '../../core/services/toast.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { ChangePasswordFormComponent } from '../../shared/change-password-form.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DoctorLayoutComponent, PatientLayoutComponent, ChangePasswordFormComponent],
  template: `
    <!-- Settings Main Template -->
    <ng-template #settingsContent>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        
        <!-- Header Card Box -->
        <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings</h2>
            <p class="text-xs sm:text-sm text-[#9aa3b8]">Manage your app preferences and account security.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          <!-- LEFT COLUMN: Appearance & Preferences -->
          <div class="space-y-6 sm:space-y-8">
            
            <!-- Appearance Card -->
            <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-lg shrink-0">
                  <i class="fa-solid fa-palette"></i>
                </div>
                <div>
                  <h3 class="text-base font-bold text-white">Appearance</h3>
                  <p class="text-xs text-[#9aa3b8]">Choose your preferred theme for a comfortable experience.</p>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-3 pt-2">
                <!-- Light Theme Button -->
                <button type="button" (click)="setTheme('light')" 
                  class="relative p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 group text-center cursor-pointer"
                  [ngClass]="currentTheme === 'light' ? 'border-[#5b6cf0] bg-[#1b2333]' : 'border-[#2a3347] bg-[#1b2333]/50 hover:border-[#3a4763]'">
                  <div class="w-10 h-10 rounded-full bg-[#0b0f1a] border border-[#2a3347] flex items-center justify-center text-yellow-400 text-base shadow-sm">
                    <i class="fa-solid fa-sun"></i>
                  </div>
                  <span class="text-xs font-bold text-white">Light</span>
                  <span class="text-[10px] text-[#9aa3b8] leading-tight">Clean and bright for daytime use</span>
                  <div *ngIf="currentTheme === 'light'" class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#5b6cf0] text-white text-[10px] flex items-center justify-center font-bold">✓</div>
                </button>

                <!-- Dark Theme Button -->
                <button type="button" (click)="setTheme('dark')" 
                  class="relative p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 group text-center cursor-pointer"
                  [ngClass]="currentTheme === 'dark' ? 'border-[#5b6cf0] bg-[#1b2333]' : 'border-[#2a3347] bg-[#1b2333]/50 hover:border-[#3a4763]'">
                  <div class="w-10 h-10 rounded-full bg-[#0b0f1a] border border-[#2a3347] flex items-center justify-center text-[#5b6cf0] text-base shadow-sm">
                    <i class="fa-solid fa-moon"></i>
                  </div>
                  <span class="text-xs font-bold text-white">Dark</span>
                  <span class="text-[10px] text-[#9aa3b8] leading-tight">Easy on eyes for low light</span>
                  <div *ngIf="currentTheme === 'dark'" class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#5b6cf0] text-white text-[10px] flex items-center justify-center font-bold">✓</div>
                </button>

                <!-- System Theme Button -->
                <button type="button" (click)="setTheme('system')" 
                  class="relative p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 group text-center cursor-pointer"
                  [ngClass]="currentTheme === 'system' ? 'border-[#5b6cf0] bg-[#1b2333]' : 'border-[#2a3347] bg-[#1b2333]/50 hover:border-[#3a4763]'">
                  <div class="w-10 h-10 rounded-full bg-[#0b0f1a] border border-[#2a3347] flex items-center justify-center text-[#9aa3b8] text-base shadow-sm">
                    <i class="fa-solid fa-desktop"></i>
                  </div>
                  <span class="text-xs font-bold text-white">System</span>
                  <span class="text-[10px] text-[#9aa3b8] leading-tight">Follow your device settings</span>
                  <div *ngIf="currentTheme === 'system'" class="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#5b6cf0] text-white text-[10px] flex items-center justify-center font-bold">✓</div>
                </button>
              </div>
            </div>

            <!-- Preferences Card -->
            <div class="bg-[#151b2b] border border-[#2a3347] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                  <i class="fa-solid fa-sliders"></i>
                </div>
                <div>
                  <h3 class="text-base font-bold text-white">Preferences</h3>
                  <p class="text-xs text-[#9aa3b8]">Customize your experience.</p>
                </div>
              </div>
              
              <div class="space-y-4 pt-1">
                <!-- Notifications Toggle -->
                <label class="flex items-center justify-between p-3 rounded-xl bg-[#1b2333]/40 border border-[#2a3347]/60 hover:border-[#2a3347] cursor-pointer transition-colors group">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                      <i class="fa-solid fa-bell"></i>
                    </div>
                    <div>
                      <div class="text-xs sm:text-sm font-bold text-white">Notifications</div>
                      <div class="text-[11px] text-[#9aa3b8]">Receive alerts about appointments, test reports and important updates.</div>
                    </div>
                  </div>
                  <div class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
                       [class.bg-[#5b6cf0]]="notificationsEnabled"
                       [class.bg-[#2a3347]]="!notificationsEnabled">
                    <input type="checkbox" class="sr-only" [(ngModel)]="notificationsEnabled" (change)="persistPref('notifications', notificationsEnabled)">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          [class.translate-x-6]="notificationsEnabled"
                          [class.translate-x-1]="!notificationsEnabled"></span>
                  </div>
                </label>

                <!-- Email Updates Toggle -->
                <label class="flex items-center justify-between p-3 rounded-xl bg-[#1b2333]/40 border border-[#2a3347]/60 hover:border-[#2a3347] cursor-pointer transition-colors group">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                      <i class="fa-solid fa-envelope"></i>
                    </div>
                    <div>
                      <div class="text-xs sm:text-sm font-bold text-white">Email Updates</div>
                      <div class="text-[11px] text-[#9aa3b8]">Receive important updates via email.</div>
                    </div>
                  </div>
                  <div class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
                       [class.bg-[#5b6cf0]]="emailUpdatesEnabled"
                       [class.bg-[#2a3347]]="!emailUpdatesEnabled">
                    <input type="checkbox" class="sr-only" [(ngModel)]="emailUpdatesEnabled" (change)="persistPref('email-updates', emailUpdatesEnabled)">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          [class.translate-x-6]="emailUpdatesEnabled"
                          [class.translate-x-1]="!emailUpdatesEnabled"></span>
                  </div>
                </label>

                <!-- Language Dropdown -->
                <div class="flex items-center justify-between p-3 rounded-xl bg-[#1b2333]/40 border border-[#2a3347]/60">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#5b6cf0]/10 text-[#5b6cf0] flex items-center justify-center text-sm shrink-0">
                      <i class="fa-solid fa-globe"></i>
                    </div>
                    <div>
                      <div class="text-xs sm:text-sm font-bold text-white">Language</div>
                      <div class="text-[11px] text-[#9aa3b8]">Choose your preferred language.</div>
                    </div>
                  </div>
                  <select [(ngModel)]="selectedLanguage" (change)="persistPref('language', selectedLanguage)"
                    class="bg-[#1b2333] border border-[#2a3347] text-white text-xs font-semibold px-3 py-1.5 rounded-xl outline-none cursor-pointer">
                    <option value="English" class="bg-[#151b2b] text-white">English</option>
                    <option value="Hindi" class="bg-[#151b2b] text-white">Hindi</option>
                    <option value="Spanish" class="bg-[#151b2b] text-white">Spanish</option>
                  </select>
                </div>
              </div>

              <!-- Reset Action -->
              <div class="pt-3 border-t border-[#2a3347] flex justify-end">
                <button type="button" (click)="resetPreferences()" 
                  class="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer">
                  <i class="fa-solid fa-rotate-right text-xs"></i>
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

    <!-- Role Based Layout Switching -->
    <ng-container *ngIf="auth.role() === 'DOCTOR'; else patientOrNoLayout">
      <app-doctor-layout>
        <ng-container *ngTemplateOutlet="settingsContent"></ng-container>
      </app-doctor-layout>
    </ng-container>

    <ng-template #patientOrNoLayout>
      <ng-container *ngIf="auth.role() === 'PATIENT'; else noLayout">
        <app-patient-layout>
          <ng-container *ngTemplateOutlet="settingsContent"></ng-container>
        </app-patient-layout>
      </ng-container>
    </ng-template>

    <ng-template #noLayout>
      <div class="min-h-screen bg-[#0b0f1a] p-6 text-white">
        <ng-container *ngTemplateOutlet="settingsContent"></ng-container>
      </div>
    </ng-template>
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


