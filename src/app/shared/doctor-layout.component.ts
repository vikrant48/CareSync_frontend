import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { DoctorProfileService } from '../core/services/doctor-profile.service';
import { AppShellComponent, AppShellLink, AppShellTab } from './app-shell.component';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  host: { class: 'block h-full w-full' },
  imports: [CommonModule, AppShellComponent],
  template: `
    <app-shell variant="doctor" [sidebarLinks]="sidebarLinks" [tabs]="tabs" [menuLinks]="menuLinks"
               [assistantInside]="true" (logout)="onLogout()">
      <div shellHeader class="px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100/50 dark:bg-gray-800/60">
        <div class="flex items-center gap-3">
          <img *ngIf="profileImageUrl; else defaultAvatar" [src]="profileImageUrl" alt="Doctor profile photo"
               class="w-10 h-10 rounded-full ring-2 ring-[var(--accent)]/40 object-cover shrink-0" />
          <ng-template #defaultAvatar>
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--primary)] text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              {{ doctorInitial }}
            </div>
          </ng-template>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-snug">{{ displayName }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
              <i class="fa-solid fa-circle text-[6px] text-emerald-500"></i> Doctor
            </span>
          </div>
        </div>
      </div>
      <ng-content></ng-content>
    </app-shell>
  `,
})
export class DoctorLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private doctorApi = inject(DoctorProfileService);

  doctorName: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('caresync_doctor_name') : null;
  profileImageUrl: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('caresync_doctor_avatar') : null;

  get displayName(): string {
    const name = (this.doctorName || this.auth.username() || 'Doctor').trim();
    if (!name || name === 'Doctor') return 'Doctor';
    return name.toLowerCase().startsWith('dr.') ? name : `Dr. ${name}`;
  }

  get doctorInitial(): string {
    const raw = (this.doctorName || this.auth.username() || 'D').replace(/^dr\.?\s+/i, '').trim();
    return (raw.charAt(0) || 'D').toUpperCase();
  }

  readonly sidebarLinks: AppShellLink[] = [
    { label: 'Dashboard', icon: 'fa-solid fa-gauge', link: '/doctor', exact: true },
    { label: 'My Schedule', icon: 'fa-solid fa-calendar-day', link: '/doctor/schedule' },
    { label: 'Appointments', icon: 'fa-solid fa-calendar-check', link: '/doctor/appointments' },
    { label: 'Reports', icon: 'fa-solid fa-chart-line', link: '/doctor/reports' },
    { label: 'Lab Tests', icon: 'fa-solid fa-flask', link: '/lab-tests' },
    { label: 'Manage Tests', icon: 'fa-solid fa-flask-vial', link: '/doctor/lab-test-management' },
    { label: 'Documents', icon: 'fa-solid fa-folder-open', link: '/doctor/documents' },
    { label: 'Profile', icon: 'fa-solid fa-user-doctor', link: '/doctor/profile' },
    { label: 'Leave Management', icon: 'fa-solid fa-calendar-minus', link: '/doctor/leaves' },
    { divider: true, label: '', icon: '' },
    { label: 'Settings', icon: 'fa-solid fa-gear', link: '/settings' },
    { label: 'Change Password', icon: 'fa-solid fa-key', link: '/doctor/change-password' },
    { label: 'Sign Out', icon: 'fa-solid fa-right-from-bracket', logout: true },
  ];

  readonly tabs: AppShellTab[] = [
    { label: 'Home', icon: 'fa-solid fa-house', link: '/doctor', exact: true },
    { label: 'Today', icon: 'fa-solid fa-calendar-day', link: '/doctor/schedule' },
    { label: 'Appts', icon: 'fa-solid fa-calendar-check', link: '/doctor/appointments' },
    { label: 'Profile', icon: 'fa-solid fa-user-doctor', link: '/doctor/profile' },
    { label: 'Menu', icon: 'fa-solid fa-bars', opensMenu: true },
  ];

  readonly menuLinks: AppShellLink[] = [
    { label: 'Documents', icon: 'fa-solid fa-folder-open', link: '/doctor/documents', tileClass: 'flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors' },
    { label: 'Reports', icon: 'fa-solid fa-chart-line', link: '/doctor/reports', tileClass: 'flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors' },
    { label: 'Lab Tests', icon: 'fa-solid fa-flask', link: '/lab-tests', tileClass: 'flex flex-col items-center justify-center p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-900/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/20 transition-colors' },
    { label: 'Manage Tests', icon: 'fa-solid fa-flask-vial', link: '/doctor/lab-test-management', labelClass: 'text-sm font-medium text-center', tileClass: 'flex flex-col items-center justify-center p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/20 transition-colors' },
    { label: 'Change Password', icon: 'fa-solid fa-key', link: '/doctor/change-password', labelClass: 'text-sm font-medium text-center', tileClass: 'flex flex-col items-center justify-center p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors' },
    { label: 'Leaves', icon: 'fa-solid fa-calendar-minus', link: '/doctor/leaves', labelClass: 'text-sm font-medium text-center', tileClass: 'flex flex-col items-center justify-center p-4 rounded-2xl bg-brand-soft text-brand hover:brightness-95 transition-colors' },
    { label: 'Settings', icon: 'fa-solid fa-gear', link: '/settings', tileClass: 'flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' },
    { label: 'Log Out', icon: 'fa-solid fa-right-from-bracket', logout: true, tileClass: 'flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors' },
  ];

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const cachedName = localStorage.getItem('caresync_doctor_name');
      const cachedImage = localStorage.getItem('caresync_doctor_avatar');
      if (cachedName) this.doctorName = cachedName;
      if (cachedImage) this.profileImageUrl = cachedImage;
    }
    this.loadDoctorProfile();
  }

  loadDoctorProfile() {
    const uname = this.auth.username();
    if (!uname) return;
    this.doctorApi.getProfile(uname).subscribe({
      next: (p) => {
        const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
        const finalName = name || p?.username || uname;
        const finalImage = p?.profileImageUrl || null;
        this.doctorName = finalName;
        this.profileImageUrl = finalImage;
        if (typeof localStorage !== 'undefined') {
          if (finalName) localStorage.setItem('caresync_doctor_name', finalName);
          if (finalImage) localStorage.setItem('caresync_doctor_avatar', finalImage);
          else localStorage.removeItem('caresync_doctor_avatar');
        }
      },
      error: () => { }
    });
  }

  onLogout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('caresync_doctor_name');
      localStorage.removeItem('caresync_doctor_avatar');
    }
    this.auth.logout();
  }
}
