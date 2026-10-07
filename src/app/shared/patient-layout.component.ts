import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PatientProfileService, PatientDto } from '../core/services/patient-profile.service';
import { ToastContainerComponent } from './toast-container.component';
import { AiAssistantWidgetComponent } from './ai-assistant-widget.component';
import { ProductTourComponent } from './product-tour/product-tour.component';
import { TourService } from '../core/services/tour.service';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  host: { class: 'block h-full w-full' },
  imports: [CommonModule, RouterModule, ToastContainerComponent, AiAssistantWidgetComponent, ProductTourComponent],
  template: `
    <app-product-tour></app-product-tour>
    <div class="min-h-[calc(100vh-3.5rem)] w-full bg-[var(--bg)] text-[var(--text)]">
      <!-- Fixed Sidebar (Desktop) -->
      <aside class="hidden md:flex fixed top-14 left-0 bottom-0 w-64 flex-col bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 overflow-hidden">
        <!-- Patient Sidebar Header with Avatar & Name -->
        <div class="px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100/50 dark:bg-gray-800/60">
          <div class="flex items-center gap-3">
            <img *ngIf="profileImageUrl; else defaultAvatar" [src]="profileImageUrl" alt="Patient Avatar"
                 class="w-10 h-10 rounded-full ring-2 ring-[#5b6cf0]/30 object-cover shrink-0" />
            <ng-template #defaultAvatar>
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5b6cf0] to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                {{ (patientName || 'P').charAt(0).toUpperCase() }}
              </div>
            </ng-template>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-snug">{{ patientName || 'Patient' }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                <i class="fa-solid fa-circle text-[6px] text-emerald-500"></i> Patient
              </span>
            </div>
          </div>
        </div>

        <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          <a id="nav-dashboard" routerLink="/patient" [routerLinkActiveOptions]="{exact: true}" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-house text-sm w-5 text-center"></i>
            <span>Dashboard</span>
          </a>
          <a id="nav-book-appointment" routerLink="/patient/book-appointment" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-calendar-plus text-sm w-5 text-center"></i>
            <span>Book Appointment</span>
          </a>
          <a id="nav-my-appointments" routerLink="/patient/appointments" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-calendar-check text-sm w-5 text-center"></i>
            <span>My Appointments</span>
          </a>
          <a id="nav-reports" routerLink="/patient/reports" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-chart-line text-sm w-5 text-center"></i>
            <span>Reports</span>
          </a>
          <a id="nav-health-vitals" routerLink="/patient/vitals" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-heart-pulse text-sm w-5 text-center"></i>
            <span>Health Vitals</span>
          </a>
          <a id="nav-lab-tests" routerLink="/lab-tests" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-flask text-sm w-5 text-center"></i>
            <span>Lab Tests</span>
          </a>
          <a id="nav-lab-bookings" routerLink="/patient/lab-bookings" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-vial text-sm w-5 text-center"></i>
            <span>My Lab Bookings</span>
          </a>
          <a id="nav-feedback" routerLink="/patient/feedback" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-star text-sm w-5 text-center"></i>
            <span>Feedback</span>
          </a>
          <a id="nav-profile" routerLink="/patient/profile" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors">
            <i class="fa-solid fa-id-badge text-sm w-5 text-center"></i>
            <span>Profile</span>
          </a>

          <div class="pt-2 my-2 border-t border-gray-200 dark:border-gray-700/60"></div>

          <a id="nav-settings" routerLink="/settings" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm transition-colors">
            <i class="fa-solid fa-gear text-sm w-5 text-center"></i>
            <span>Settings</span>
          </a>
          <a id="nav-change-password" routerLink="/patient/change-password" routerLinkActive="!bg-[#5b6cf0] !text-white font-semibold shadow-sm" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm transition-colors">
            <i class="fa-solid fa-key text-sm w-5 text-center"></i>
            <span>Change Password</span>
          </a>
          <button type="button" (click)="logout()" class="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm transition-colors">
            <i class="fa-solid fa-right-from-bracket text-sm w-5 text-center"></i>
            <span>Logout</span>
          </button>
        </nav>

        <!-- Copyright Footer -->
        <div class="mt-auto px-4 py-3 border-t border-gray-200 dark:border-gray-700/80 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
          © 2026 CareSync. All rights reserved.
        </div>
      </aside>

      <!-- Content Area -->
      <main class="md:pl-64 w-full min-h-[calc(100vh-3.5rem)]">
        <div class="pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-8">
          <ng-content></ng-content>
        </div>
        <app-toast-container></app-toast-container>
      </main>

      <!-- AI Health Assistant -->
      <app-ai-assistant-widget></app-ai-assistant-widget>

      <!-- Bottom Nav (mobile) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 safe-bottom" style="min-height: calc(4rem + env(safe-area-inset-bottom, 0px));">
        <div class="grid grid-cols-3 items-center text-sm h-16">
          <!-- Left: Home -->
          <a routerLink="/patient" routerLinkActive="nav-active" class="flex flex-col items-center justify-center h-full min-h-touch touch-target text-gray-600 dark:text-gray-400">
            <i class="fa-solid fa-house"></i>
            <span class="text-xs mt-1">Home</span>
          </a>
          <!-- Middle: Menu toggle -->
          <button type="button" (click)="menuOpen = !menuOpen" aria-label="Open Menu" [attr.aria-expanded]="menuOpen" class="flex flex-col items-center justify-center h-full min-h-touch touch-target text-gray-600 dark:text-gray-400" [class.text-brand]="menuOpen">
            <i class="fa-solid" [class.fa-bars]="!menuOpen" [class.fa-xmark]="menuOpen"></i>
            <span class="text-xs mt-1">Menu</span>
          </button>
          <!-- Right: Profile -->
          <a routerLink="/patient/profile" routerLinkActive="nav-active" class="flex flex-col items-center justify-center h-full min-h-touch touch-target text-gray-600 dark:text-gray-400">
            <i class="fa-solid fa-user"></i>
            <span class="text-xs mt-1">Profile</span>
          </a>
        </div>
      </nav>

      <!-- Slide-up Menu Sheet -->
      <div *ngIf="menuOpen" class="md:hidden fixed inset-x-0 top-0 bottom-16 z-40" style="bottom: calc(4rem + env(safe-area-inset-bottom, 0px));">
        <!-- Overlay -->
        <div class="absolute inset-x-0 top-0 bottom-0 bg-black/50" (click)="menuOpen = false"></div>
        <!-- Sheet -->
        <div class="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-t-xl shadow-xl p-3 space-y-1 transform transition-transform duration-200">
          <div class="flex items-center justify-between px-2 py-1">
            <div class="text-sm font-semibold">Quick Actions</div>
            <button type="button" (click)="menuOpen = false" aria-label="Close menu" class="touch-target flex items-center justify-center text-gray-400">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 gap-1">
            <a routerLink="/patient" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-house"></i>
              <span>Dashboard</span>
            </a>
            <a routerLink="/patient/book-appointment" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-calendar-plus"></i>
              <span>Book Appointment</span>
            </a>
            <a routerLink="/patient/appointments" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-calendar-check"></i>
              <span>My Appointments</span>
            </a>
            <a routerLink="/patient/reports" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-chart-line"></i>
              <span>Reports</span>
            </a>
            <a routerLink="/patient/vitals" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-heart-pulse"></i>
              <span>Health Vitals</span>
            </a>
            <a routerLink="/lab-tests" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-flask"></i>
              <span>Lab Tests</span>
            </a>
            <a routerLink="/patient/lab-bookings" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-vial"></i>
              <span>My Lab Bookings</span>
            </a>
            <a routerLink="/patient/feedback" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-star"></i>
              <span>Feedback</span>
            </a>

            <a routerLink="/settings" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-gear"></i>
              <span>Settings</span>
            </a>
            <a routerLink="/patient/change-password" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-key"></i>
              <span>Change Password</span>
            </a>
            <button type="button" (click)="logout(); menuOpen=false" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fa-solid fa-right-from-bracket"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PatientLayoutComponent implements OnInit {
  menuOpen = false;
  patientName: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('caresync_patient_name') : null;
  profileImageUrl: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('caresync_patient_avatar') : null;
  protected tour = inject(TourService);
  private patientApi = inject(PatientProfileService);

  constructor(public auth: AuthService) { }

  ngOnInit() {
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

