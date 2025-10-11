import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DoctorLayoutComponent, PatientLayoutComponent],
  template: `
    <ng-container *ngIf="auth.role() === 'DOCTOR'; else patientOrNoLayout">
      <app-doctor-layout>
        <div class="panel p-6 space-y-6">
          <h2 class="text-2xl font-semibold">Settings</h2>

          <!-- Theme -->
          <div>
            <div class="text-lg font-medium mb-2">Theme</div>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2">
                <input type="radio" name="theme" class="accent-emerald-500" [checked]="currentTheme === 'dark'" (change)="setTheme('dark')" />
                <span>Dark</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="theme" class="accent-emerald-500" [checked]="currentTheme === 'light'" (change)="setTheme('light')" />
                <span>Light</span>
              </label>
            </div>
          </div>

          <!-- Preferences -->
          <div>
            <div class="text-lg font-medium mb-2">Preferences</div>
            <div class="space-y-2">
              <label class="flex items-center gap-2">
                <input type="checkbox" class="accent-emerald-500" [(ngModel)]="notificationsEnabled" (change)="persistPref('notifications', notificationsEnabled)" />
                <span>Enable notifications</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" class="accent-emerald-500" [(ngModel)]="compactUI" (change)="persistPref('ui-density', compactUI ? 'compact' : 'comfortable')" />
                <span>Compact UI density</span>
              </label>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="btn-secondary" (click)="resetPreferences()">Reset Preferences</button>
          </div>
        </div>
      </app-doctor-layout>
    </ng-container>

    <ng-template #patientOrNoLayout>
      <ng-container *ngIf="auth.role() === 'PATIENT'; else noLayout">
        <app-patient-layout>
          <div class="panel p-6 space-y-6">
            <h2 class="text-2xl font-semibold">Settings</h2>

            <!-- Theme -->
            <div>
              <div class="text-lg font-medium mb-2">Theme</div>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2">
                  <input type="radio" name="themeP" class="accent-emerald-500" [checked]="currentTheme === 'dark'" (change)="setTheme('dark')" />
                  <span>Dark</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="radio" name="themeP" class="accent-emerald-500" [checked]="currentTheme === 'light'" (change)="setTheme('light')" />
                  <span>Light</span>
                </label>
              </div>
            </div>

            <!-- Preferences -->
            <div>
              <div class="text-lg font-medium mb-2">Preferences</div>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="accent-emerald-500" [(ngModel)]="notificationsEnabled" (change)="persistPref('notifications', notificationsEnabled)" />
                  <span>Enable notifications</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" class="accent-emerald-500" [(ngModel)]="compactUI" (change)="persistPref('ui-density', compactUI ? 'compact' : 'comfortable')" />
                  <span>Compact UI density</span>
                </label>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button class="btn-secondary" (click)="resetPreferences()">Reset Preferences</button>
            </div>
          </div>
        </app-patient-layout>
      </ng-container>
    </ng-template>

    <ng-template #noLayout>
      <div class="min-h-screen bg-gray-950 text-gray-100 p-6">
        <div class="panel max-w-3xl w-full mx-auto p-6 space-y-6">
          <h2 class="text-2xl font-semibold">Settings</h2>

          <!-- Theme -->
          <div>
            <div class="text-lg font-medium mb-2">Theme</div>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2">
                <input type="radio" name="theme2" class="accent-emerald-500" [checked]="currentTheme === 'dark'" (change)="setTheme('dark')" />
                <span>Dark</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="theme2" class="accent-emerald-500" [checked]="currentTheme === 'light'" (change)="setTheme('light')" />
                <span>Light</span>
              </label>
            </div>
          </div>

          <!-- Preferences -->
          <div>
            <div class="text-lg font-medium mb-2">Preferences</div>
            <div class="space-y-2">
              <label class="flex items-center gap-2">
                <input type="checkbox" class="accent-emerald-500" [(ngModel)]="notificationsEnabled" (change)="persistPref('notifications', notificationsEnabled)" />
                <span>Enable notifications</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" class="accent-emerald-500" [(ngModel)]="compactUI" (change)="persistPref('ui-density', compactUI ? 'compact' : 'comfortable')" />
                <span>Compact UI density</span>
              </label>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="btn-secondary" (click)="resetPreferences()">Reset Preferences</button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class SettingsComponent {
  private theme = inject(ThemeService);
  auth = inject(AuthService);
  private isBrowser: boolean;
  currentTheme: 'dark' | 'light' = 'dark';
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

  setTheme(t: 'dark' | 'light') {
    this.currentTheme = t;
    this.theme.setTheme(t);
  }

  persistPref(key: string, value: any) {
    try {
      if (this.isBrowser) {
        localStorage.setItem(key, String(value));
      }
    } catch {}
  }

  resetPreferences() {
    if (this.isBrowser) {
      ['notifications', 'ui-density'].forEach((k) => localStorage.removeItem(k));
    }
    this.notificationsEnabled = false;
    this.compactUI = false;
  }
}