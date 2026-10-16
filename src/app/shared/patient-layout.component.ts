import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PatientProfileService, PatientDto } from '../core/services/patient-profile.service';
import { TourService } from '../core/services/tour.service';
import { AppShellComponent, AppShellLink, AppShellTab } from './app-shell.component';
import { PageLoaderComponent } from './ui/page-loader.component';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  host: { class: 'block h-full w-full' },
  imports: [CommonModule, AppShellComponent, PageLoaderComponent, RouterOutlet],
  template: `
    <app-shell variant="patient" [sidebarLinks]="sidebarLinks" [tabs]="tabs" [menuLinks]="menuLinks"
               [showTour]="true" (logout)="logout()">
      <div shellHeader class="px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100/50 dark:bg-gray-800/60">
        <div class="flex items-center gap-3">
          <img *ngIf="profileImageUrl; else defaultAvatar" [src]="profileImageUrl" alt="Patient Avatar"
               class="w-10 h-10 rounded-full ring-2 ring-[var(--primary)]/30 object-cover shrink-0" />
          <ng-template #defaultAvatar>
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              {{ (patientName || 'P').charAt(0).toUpperCase() }}
            </div>
          </ng-template>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-snug">{{ patientName || 'Patient' }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
              <i class="fa-solid fa-circle text-[6px] text-emerald-500" aria-hidden="true"></i> Patient
            </span>
          </div>
        </div>
      </div>
      <app-page-loader *ngIf="pageNavigating" label="Loading..."></app-page-loader>
      <div [hidden]="pageNavigating">
        <!-- Routed layout: role pages render here, so the shell persists across navigation -->
        <router-outlet></router-outlet>
      </div>
    </app-shell>
  `,
})
export class PatientLayoutComponent implements OnInit {
  readonly sidebarLinks: AppShellLink[] = [
    { id: 'nav-dashboard', label: 'Dashboard', icon: 'fa-solid fa-house', link: '/patient', exact: true },
    { id: 'nav-book-appointment', label: 'Book Appointment', icon: 'fa-solid fa-calendar-plus', link: '/patient/book-appointment' },
    { id: 'nav-my-appointments', label: 'My Appointments', icon: 'fa-solid fa-calendar-check', link: '/patient/appointments' },
    { id: 'nav-reports', label: 'Reports', icon: 'fa-solid fa-chart-line', link: '/patient/reports' },
    { id: 'nav-health-vitals', label: 'Health Vitals', icon: 'fa-solid fa-heart-pulse', link: '/patient/vitals' },
    { id: 'nav-lab-tests', label: 'Lab Tests', icon: 'fa-solid fa-flask', link: '/lab-tests' },
    { id: 'nav-lab-bookings', label: 'My Lab Bookings', icon: 'fa-solid fa-vial', link: '/patient/lab-bookings' },
    { id: 'nav-feedback', label: 'Feedback', icon: 'fa-solid fa-star', link: '/patient/feedback' },
    { id: 'nav-profile', label: 'Profile', icon: 'fa-solid fa-id-badge', link: '/patient/profile' },
    { divider: true, label: '', icon: '' },
    { id: 'nav-settings', label: 'Settings', icon: 'fa-solid fa-gear', link: '/settings' },
    { id: 'nav-change-password', label: 'Change Password', icon: 'fa-solid fa-key', link: '/patient/change-password' },
    { label: 'Logout', icon: 'fa-solid fa-right-from-bracket', logout: true },
  ];

  readonly tabs: AppShellTab[] = [
    { label: 'Home', icon: 'fa-solid fa-house', link: '/patient' },
    { label: 'Menu', icon: 'fa-solid fa-bars', opensMenu: true },
    { label: 'Profile', icon: 'fa-solid fa-user', link: '/patient/profile' },
  ];

  readonly menuLinks: AppShellLink[] = [
    { label: 'Dashboard', icon: 'fa-solid fa-house', link: '/patient' },
    { label: 'Book Appointment', icon: 'fa-solid fa-calendar-plus', link: '/patient/book-appointment' },
    { label: 'My Appointments', icon: 'fa-solid fa-calendar-check', link: '/patient/appointments' },
    { label: 'Reports', icon: 'fa-solid fa-chart-line', link: '/patient/reports' },
    { label: 'Health Vitals', icon: 'fa-solid fa-heart-pulse', link: '/patient/vitals' },
    { label: 'Lab Tests', icon: 'fa-solid fa-flask', link: '/lab-tests' },
    { label: 'My Lab Bookings', icon: 'fa-solid fa-vial', link: '/patient/lab-bookings' },
    { label: 'Feedback', icon: 'fa-solid fa-star', link: '/patient/feedback' },
    { label: 'Settings', icon: 'fa-solid fa-gear', link: '/settings' },
    { label: 'Change Password', icon: 'fa-solid fa-key', link: '/patient/change-password' },
    { label: 'Logout', icon: 'fa-solid fa-right-from-bracket', logout: true },
  ];

  patientName: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('caresync_patient_name') : null;
  profileImageUrl: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('caresync_patient_avatar') : null;
  protected tour = inject(TourService);
  private patientApi = inject(PatientProfileService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  // The layout is rendered inside each page; pages may be OnPush, so async updates here must request a check.
  private cdr = inject(ChangeDetectorRef);
  pageNavigating = false;

  constructor(public auth: AuthService) { }

  ngOnInit() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.pageNavigating = true;
      }
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.pageNavigating = false;
      }
      this.cdr.markForCheck();
    });

    if (typeof localStorage !== 'undefined') {
      const cachedName = localStorage.getItem('caresync_patient_name');
      const cachedImage = localStorage.getItem('caresync_patient_avatar');
      if (cachedName) this.patientName = cachedName;
      if (cachedImage) this.profileImageUrl = cachedImage;
    }

    this.tour.startTourIfRequested();
    this.loadPatientProfile();
  }

  loadPatientProfile() {
    const uname = this.auth.username();
    if (!uname) return;
    this.patientApi.getProfile(uname).subscribe({
      next: (p: PatientDto) => {
        const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
        const finalName = name || p?.username || 'Patient';
        const finalImage = p?.profileImageUrl || null;

        this.patientName = finalName;
        this.profileImageUrl = finalImage;
        this.cdr.markForCheck();

        if (typeof localStorage !== 'undefined') {
          if (finalName) {
            localStorage.setItem('caresync_patient_name', finalName);
          }
          if (finalImage) {
            localStorage.setItem('caresync_patient_avatar', finalImage);
          } else {
            localStorage.removeItem('caresync_patient_avatar');
          }
        }
      },
      error: () => { }
    });
  }

  logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('caresync_patient_name');
      localStorage.removeItem('caresync_patient_avatar');
    }
    this.auth.logout();
  }
}
