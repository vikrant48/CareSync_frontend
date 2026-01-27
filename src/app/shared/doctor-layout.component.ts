import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastContainerComponent } from './toast-container.component';
import { AiAssistantWidgetComponent } from './ai-assistant-widget.component';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastContainerComponent, AiAssistantWidgetComponent],
  template: `
    <div class="h-full w-full md:grid md:grid-cols-[16rem_1fr] md:h-[calc(100dvh-3.5rem)] md:min-h-0 md:items-stretch bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      
      <!-- Sidebar (Desktop) -->
      <aside class="hidden md:flex md:h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col overflow-hidden">
        <div class="px-4 py-4 border-b border-gray-700">
          <div class="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <i class="fa-solid fa-user-doctor"></i>
            <span>CareSync Doctor</span>
          </div>
          <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">Doctor Panel</div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          <a routerLink="/doctor" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" [routerLinkActiveOptions]="{ exact: true }" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-gauge w-5 text-center"></i>
            <span>Dashboard</span>
          </a>

          <a routerLink="/doctor/schedule" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-calendar-day w-5 text-center"></i>
            <span>My Schedule</span>
          </a>

          <a routerLink="/doctor/appointments" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-calendar-check w-5 text-center"></i>
            <span>Appointments</span>
          </a>
          <a routerLink="/doctor/reports" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-chart-line w-5 text-center"></i>
            <span>Reports</span>
          </a>

           <a routerLink="/lab-tests" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-flask w-5 text-center"></i>
            <span>Lab Tests</span>
          </a>
          <a routerLink="/doctor/lab-test-management" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-flask-vial w-5 text-center"></i>
            <span>Manage Tests</span>
          </a>
          <a routerLink="/doctor/documents" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
             <i class="fa-solid fa-folder-open w-5 text-center"></i>
             <span>Documents</span>
          </a>

          <a routerLink="/doctor/profile" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-user-doctor w-5 text-center"></i>
            <span>Profile</span>
          </a>
           <a routerLink="/doctor/change-password" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-key w-5 text-center"></i>
            <span>Change Password</span>
          </a>
          <a routerLink="/doctor/leaves" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            <i class="fa-solid fa-calendar-minus w-5 text-center"></i>
            <span>Leave Management</span>
          </a>
          <a routerLink="/settings" routerLinkActive="!bg-gray-200 dark:!bg-gray-700" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
             <i class="fa-solid fa-gear w-5 text-center"></i>
            <span>Settings</span>
          </a>
          <button (click)="onLogout()" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 mt-2">
            <i class="fa-solid fa-right-from-bracket w-5 text-center"></i>
            <span>Sign Out</span>
          </button>
        </nav>

        <!-- Sidebar Footer -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
           © 2025 CareSync
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="relative min-h-0 md:h-full h-[calc(100dvh-3.5rem-4rem)] overflow-y-auto overflow-x-hidden min-w-0 bg-gray-50 dark:bg-gray-950">
        <div class="pb-32 md:pb-8">
             <ng-content></ng-content>
        </div>
        <app-toast-container></app-toast-container>
        <app-ai-assistant-widget></app-ai-assistant-widget>
      </main>

       <!-- Mobile Bottom Navigation - Standard Fixed Bar -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        <div class="grid grid-cols-4 items-center h-16">
          <a routerLink="/doctor" routerLinkActive="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" [routerLinkActiveOptions]="{ exact: true }" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <i class="fa-solid fa-house text-lg mb-1"></i>
            <span class="text-[10px] font-medium">Home</span>
          </a>
          <a routerLink="/doctor/schedule" routerLinkActive="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <i class="fa-solid fa-calendar-day text-lg mb-1"></i>
            <span class="text-[10px] font-medium">Today</span>
          </a>
          <a routerLink="/doctor/appointments" routerLinkActive="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <i class="fa-solid fa-calendar-check text-lg mb-1"></i>
            <span class="text-[10px] font-medium">Appts</span>
          </a>
          <a routerLink="/doctor/profile" routerLinkActive="text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
            <i class="fa-solid fa-user-doctor text-lg mb-1"></i>
            <span class="text-[10px] font-medium">Profile</span>
          </a>
          <button type="button" (click)="menuOpen = !menuOpen" [class.text-blue-600]="menuOpen" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-1 transition-transform" [class.rotate-90]="menuOpen">
               <i class="fa-solid" [class.fa-bars]="!menuOpen" [class.fa-xmark]="menuOpen"></i>
            </div>
            <span class="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      <!-- Mobile Menu Overlay -->
       <!-- Backdrop -->
      <div *ngIf="menuOpen" class="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" (click)="menuOpen = false" aria-hidden="true"></div>
      
      <!-- Menu Sheet -->
      <div class="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-gray-900 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transform transition-transform duration-300 ease-out max-h-[75vh] overflow-y-auto"
           [class.translate-y-0]="menuOpen" [class.translate-y-full]="!menuOpen">
           
         <div class="sticky top-0 bg-white dark:bg-gray-900 z-10 px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <span class="bg-gray-200 dark:bg-gray-700 w-12 h-1.5 rounded-full absolute top-2 left-1/2 -translate-x-1/2"></span>
           <h3 class="font-bold text-lg dark:text-white mt-2">More Options</h3>
           <button (click)="menuOpen = false" class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 mt-2">
             <i class="fa-solid fa-xmark"></i>
           </button>
         </div>

         <div class="p-6 grid grid-cols-2 gap-3">
             <a routerLink="/doctor/documents" (click)="menuOpen=false" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors">
               <i class="fa-solid fa-folder-open text-2xl mb-2"></i>
               <span class="text-sm font-medium">Documents</span>
             </a>
             <a routerLink="/doctor/reports" (click)="menuOpen=false" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors">
               <i class="fa-solid fa-chart-line text-2xl mb-2"></i>
               <span class="text-sm font-medium">Reports</span>
             </a>
             <a routerLink="/lab-tests" (click)="menuOpen=false" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-900/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/20 transition-colors">
               <i class="fa-solid fa-flask text-2xl mb-2"></i>
               <span class="text-sm font-medium">Lab Tests</span>
             </a>
             <a routerLink="/doctor/lab-test-management" (click)="menuOpen=false" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/20 transition-colors">
               <i class="fa-solid fa-flask-vial text-2xl mb-2"></i>
               <span class="text-sm font-medium text-center">Manage Tests</span>
             </a>
             <a routerLink="/doctor/change-password" (click)="menuOpen=false" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors">
               <i class="fa-solid fa-key text-2xl mb-2"></i>
               <span class="text-sm font-medium text-center">Change Password</span>
             </a>
             <a routerLink="/doctor/leaves" (click)="menuOpen=false" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors">
               <i class="fa-solid fa-calendar-minus text-2xl mb-2"></i>
               <span class="text-sm font-medium text-center">Leaves</span>
             </a>
             <a routerLink="/settings" (click)="menuOpen=false" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
               <i class="fa-solid fa-gear text-2xl mb-2"></i>
               <span class="text-sm font-medium">Settings</span>
             </a>
             <button (click)="onLogout(); menuOpen=false" class="col-span-2 flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors mt-2">
               <i class="fa-solid fa-right-from-bracket"></i>
               <span class="font-bold">Log Out</span>
             </button>
         </div>
         <!-- Spacer for bottom safe area -->
         <div class="h-8"></div>
      </div>

    </div>
  `,
  styles: [`
    .nav-item {
      @apply flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 select-none;
    }
    .active-nav {
      @apply bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-semibold shadow-sm;
    }
    .active-nav .icon-box {
      @apply bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400;
    }
    .icon-box {
      @apply w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      @apply bg-gray-200 dark:bg-gray-700 rounded-full;
    }
  `]
})
export class DoctorLayoutComponent {
  private auth = inject(AuthService);
  menuOpen = false;
  onLogout() {
    this.auth.logout();
  }
}
