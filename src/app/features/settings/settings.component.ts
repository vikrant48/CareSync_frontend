import { Component, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { ChangePasswordFormComponent } from '../../shared/change-password-form.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DoctorLayoutComponent, PatientLayoutComponent, ChangePasswordFormComponent],
  template: `
    <!-- Template for the actual settings content to avoid duplication -->
    <ng-template #settingsContent>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500">
        
        <!-- Header -->
        <div class="mb-4 sm:mb-8">
          <h2 class="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h2>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">Manage your app preferences and account security.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          
          <!-- Appearance & Logic Column -->
          <div class="space-y-4 sm:space-y-8">
            
            <!-- Appearance Card -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-3.5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-6 flex items-center gap-2">
                <i class="fa-solid fa-palette text-indigo-500"></i> Appearance
              </h3>
              
              <div class="space-y-4">
                <div class="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <!-- Light -->
                  <button (click)="setTheme('light')" 
                    class="relative p-2.5 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 sm:gap-2 group"
                    [class]="currentTheme === 'light' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border shadow-sm flex items-center justify-center text-xs sm:text-sm text-yellow-500">
                      <i class="fa-solid fa-sun"></i>
                    </div>
                    <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Light</span>
                    <div *ngIf="currentTheme === 'light'" class="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500"></div>
                  </button>

                  <!-- Dark -->
                  <button (click)="setTheme('dark')" 
                    class="relative p-2.5 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 sm:gap-2 group"
                    [class]="currentTheme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-900 border border-gray-700 shadow-sm flex items-center justify-center text-xs sm:text-sm text-indigo-400">
                      <i class="fa-solid fa-moon"></i>
                    </div>
                    <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Dark</span>
                    <div *ngIf="currentTheme === 'dark'" class="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500"></div>
                  </button>

                  <!-- System -->
                  <button (click)="setTheme('system')" 
                    class="relative p-2.5 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 sm:gap-2 group"
                    [class]="currentTheme === 'system' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-800 border shadow-sm flex items-center justify-center text-xs sm:text-sm text-gray-500">
                      <i class="fa-solid fa-desktop"></i>
                    </div>
                    <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">System</span>
                    <div *ngIf="currentTheme === 'system'" class="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500"></div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Preferences Card -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-3.5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-6 flex items-center gap-2">
                 <i class="fa-solid fa-sliders text-emerald-500"></i> Preferences
              </h3>
              
              <div class="space-y-3 sm:space-y-4">
                <label class="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
                  <div class="flex items-center gap-2.5 sm:gap-3">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xs sm:text-base text-blue-500">
                      <i class="fa-solid fa-bell"></i>
                    </div>
                    <div>
                      <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Notifications</div>
                      <div class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Receive alerts about appointments</div>
                    </div>
                  </div>
                  <div class="relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                       [class.bg-indigo-600]="notificationsEnabled"
                       [class.bg-gray-200]="!notificationsEnabled"
                       [class.dark:bg-gray-600]="!notificationsEnabled">
                    <input type="checkbox" class="sr-only" [(ngModel)]="notificationsEnabled" (change)="persistPref('notifications', notificationsEnabled)">
                    <span class="inline-block h-3.5 sm:h-4 w-3.5 sm:w-4 transform rounded-full bg-white transition-transform"
                          [class.translate-x-4]="notificationsEnabled"
                          [class.sm:translate-x-6]="notificationsEnabled"
                          [class.translate-x-1]="!notificationsEnabled"></span>
                  </div>
                </label>

                <div class="h-px bg-gray-100 dark:bg-gray-700/50"></div>

                <label class="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
                  <div class="flex items-center gap-2.5 sm:gap-3">
                     <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-xs sm:text-base text-purple-500">
                      <i class="fa-solid fa-compress"></i>
                    </div>
                    <div>
                      <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Compact Density</div>
                      <div class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Display more content on screen</div>
                    </div>
                  </div>
                  <div class="relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                       [class.bg-indigo-600]="compactUI"
                       [class.bg-gray-200]="!compactUI"
                       [class.dark:bg-gray-600]="!compactUI">
                    <input type="checkbox" class="sr-only" [(ngModel)]="compactUI" (change)="persistPref('ui-density', compactUI ? 'compact' : 'comfortable')">
                    <span class="inline-block h-3.5 sm:h-4 w-3.5 sm:w-4 transform rounded-full bg-white transition-transform"
                          [class.translate-x-4]="compactUI"
                          [class.sm:translate-x-6]="compactUI"
                          [class.translate-x-1]="!compactUI"></span>
                  </div>
                </label>
              </div>

               <div class="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button (click)="resetPreferences()" class="text-xs sm:text-sm text-red-500 hover:text-red-700 font-medium px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                   Reset to Defaults
                </button>
              </div>
            </div>
          </div>

          <!-- Security Column -->
          <div class="space-y-4 sm:space-y-8">
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
      <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <ng-container *ngTemplateOutlet="settingsContent"></ng-container>
      </div>
    </ng-template>
  `,
})
export class SettingsComponent {
  private theme = inject(ThemeService);
  auth = inject(AuthService);
  private isBrowser: boolean;
  currentTheme: 'dark' | 'light' | 'system' = 'dark';
  notificationsEnabled: boolean = false;
  compactUI: boolean = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Initialize safely in browser
    this.currentTheme = this.theme.getTheme();
    if (this.isBrowser) {
      this.notificationsEnabled = (localStorage.getItem('notifications') === 'true');
      this.compactUI = (localStorage.getItem('ui-density') === 'compact');
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
      ['notifications', 'ui-density'].forEach((k) => localStorage.removeItem(k));
    }
    this.notificationsEnabled = false;
    this.compactUI = false;
    this.setTheme('system'); // Reset theme to system default
  }
}
