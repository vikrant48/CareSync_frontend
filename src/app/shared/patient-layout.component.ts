import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastContainerComponent } from './toast-container.component';
import { AiAssistantWidgetComponent } from './ai-assistant-widget.component';
import { ProductTourComponent } from './product-tour/product-tour.component';
import { TourService } from '../core/services/tour.service';
import { inject } from '@angular/core';

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
        <div class="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div class="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <i class="fas fa-user-injured"></i>
            <span>Patient</span>
          </div>
        </div>

        <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          <a id="nav-dashboard" routerLink="/patient" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </a>
          <a id="nav-book-appointment" routerLink="/patient/book-appointment" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-calendar-plus"></i>
            <span>Book Appointment</span>
          </a>
          <a id="nav-my-appointments" routerLink="/patient/appointments" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-calendar-check"></i>
            <span>My Appointments</span>
          </a>
          <a id="nav-reports" routerLink="/patient/reports" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-chart-line"></i>
            <span>Reports</span>
          </a>
          <a id="nav-health-vitals" routerLink="/patient/vitals" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-heart-pulse"></i>
            <span>Health Vitals</span>
          </a>
          <a id="nav-lab-tests" routerLink="/lab-tests" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-flask"></i>
            <span>Lab Tests</span>
          </a>
          <a id="nav-lab-bookings" routerLink="/patient/lab-bookings" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-vial"></i>
            <span>My Lab Bookings</span>
          </a>
          <a id="nav-feedback" routerLink="/patient/feedback" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-star"></i>
            <span>Feedback</span>
          </a>
          <a id="nav-profile" routerLink="/patient/profile" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i class="fas fa-id-badge"></i>
            <span>Profile</span>
          </a>

          <div class="pt-2 my-2 border-t border-gray-200 dark:border-gray-700/60"></div>

          <a id="nav-settings" routerLink="/settings" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
          </a>
          <a id="nav-change-password" routerLink="/patient/change-password" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fas fa-key"></i>
            <span>Change Password</span>
          </a>
          <button type="button" (click)="logout()" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </nav>

        <!-- Copyright Footer -->
        <div class="mt-auto px-4 py-3 border-t border-gray-200 dark:border-gray-700/80 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
          © 2025 CareSync. All rights reserved.
        </div>
      </aside>

      <!-- Content Area -->
      <main class="md:pl-64 w-full min-h-[calc(100vh-3.5rem)]">
        <div>
          <ng-content></ng-content>
        </div>
        <app-toast-container></app-toast-container>
      </main>

      <!-- AI Health Assistant -->
      <app-ai-assistant-widget></app-ai-assistant-widget>

      <!-- Bottom Nav (mobile) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 h-16">
        <div class="grid grid-cols-3 items-center text-sm h-full">
          <!-- Left: Home -->
          <a routerLink="/patient" class="flex flex-col items-center justify-center h-full">
            <i class="fas fa-home"></i>
            <span class="text-xs mt-1">Home</span>
          </a>
          <!-- Middle: Menu toggle -->
          <button type="button" (click)="menuOpen = !menuOpen" aria-label="Open Menu" class="flex flex-col items-center justify-center h-full">
            <i class="fas" [class.fa-bars]="!menuOpen" [class.fa-times]="menuOpen"></i>
            <span class="text-xs mt-1">Menu</span>
          </button>
          <!-- Right: Profile -->
          <a routerLink="/patient/profile" class="flex flex-col items-center justify-center h-full">
            <i class="fas fa-user"></i>
            <span class="text-xs mt-1">Profile</span>
          </a>
        </div>
      </nav>

      <!-- Slide-up Menu Sheet -->
      <div *ngIf="menuOpen" class="md:hidden fixed inset-x-0 top-0 bottom-16 z-40">
        <!-- Overlay -->
        <div class="absolute inset-x-0 top-0 bottom-0 bg-black/50" (click)="menuOpen = false"></div>
        <!-- Sheet -->
        <div class="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-t-xl shadow-xl p-3 space-y-1 transform transition-transform duration-200">
          <div class="flex items-center justify-between px-2 py-1">
            <div class="text-sm font-semibold">Quick Actions</div>
            <button type="button" (click)="menuOpen = false" class="px-2 py-1 text-gray-400">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 gap-1">
            <a routerLink="/patient" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-home"></i>
              <span>Dashboard</span>
            </a>
            <a routerLink="/patient/book-appointment" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-calendar-plus"></i>
              <span>Book Appointment</span>
            </a>
            <a routerLink="/patient/appointments" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-calendar-check"></i>
              <span>My Appointments</span>
            </a>
            <a routerLink="/patient/reports" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-chart-line"></i>
              <span>Reports</span>
            </a>
            <a routerLink="/patient/vitals" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-heart-pulse"></i>
              <span>Health Vitals</span>
            </a>
            <a routerLink="/lab-tests" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-flask"></i>
              <span>Lab Tests</span>
            </a>
            <a routerLink="/patient/lab-bookings" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-vial"></i>
              <span>My Lab Bookings</span>
            </a>
            <a routerLink="/patient/feedback" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-star"></i>
              <span>Feedback</span>
            </a>

            <a routerLink="/settings" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-cog"></i>
              <span>Settings</span>
            </a>
            <a routerLink="/patient/change-password" (click)="menuOpen=false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-key"></i>
              <span>Change Password</span>
            </a>
            <button type="button" (click)="logout(); menuOpen=false" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <i class="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PatientLayoutComponent {
  menuOpen = false;
  protected tour = inject(TourService);
  constructor(private auth: AuthService) { }
  ngOnInit() {
    this.tour.startTourIfRequested();
  }
  logout() {
    this.auth.logout();
  }
}
