import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastContainerComponent } from './toast-container.component';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      
      <!-- Sidebar (Desktop) -->
      <aside class="hidden md:flex flex-col w-64 fixed inset-y-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300">
        <!-- Sidebar Header -->
        <div class="h-16 flex items-center gap-3 px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <i class="fa-solid fa-user-doctor text-lg"></i>
          </div>
          <div>
            <div class="font-bold text-gray-900 dark:text-white leading-tight">Doctor Panel</div>
            <div class="text-xs font-medium text-blue-600 dark:text-blue-400">CareSync Pro</div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          <a routerLink="/doctor" routerLinkActive="active-nav" [routerLinkActiveOptions]="{ exact: true }" class="nav-item group">
            <div class="icon-box group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 text-blue-500 group-hover:text-blue-600 dark:text-blue-400">
              <i class="fa-solid fa-gauge text-lg"></i>
            </div>
            <span class="font-medium">Dashboard</span>
          </a>

          <a routerLink="/doctor/appointments" routerLinkActive="active-nav" class="nav-item group">
            <div class="icon-box group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 text-emerald-500 group-hover:text-emerald-600 dark:text-emerald-400">
              <i class="fa-solid fa-calendar-check text-lg"></i>
            </div>
            <span class="font-medium">Appointments</span>
          </a>
          <a routerLink="/doctor/reports" routerLinkActive="active-nav" class="nav-item group">
            <div class="icon-box group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 text-purple-500 group-hover:text-purple-600 dark:text-purple-400">
              <i class="fa-solid fa-chart-line text-lg"></i>
            </div>
            <span class="font-medium">Reports</span>
          </a>

           <a routerLink="/lab-tests" routerLinkActive="active-nav" class="nav-item group">
            <div class="icon-box group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30 text-cyan-500 group-hover:text-cyan-600 dark:text-cyan-400">
              <i class="fa-solid fa-flask text-lg"></i>
            </div>
            <span class="font-medium">Lab Tests</span>
          </a>
          <a routerLink="/doctor/lab-test-management" routerLinkActive="active-nav" class="nav-item group">
            <div class="icon-box group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 text-teal-500 group-hover:text-teal-600 dark:text-teal-400">
              <i class="fa-solid fa-flask-vial text-lg"></i>
            </div>
            <span class="font-medium">Manage Tests</span>
          </a>
          <a routerLink="/doctor/documents" routerLinkActive="active-nav" class="nav-item group">
            <div class="icon-box group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 text-orange-500 group-hover:text-orange-600 dark:text-orange-400">
               <i class="fa-solid fa-folder-open text-lg"></i>
            </div>
             <span class="font-medium">Documents</span>
          </a>

          <a routerLink="/doctor/profile" routerLinkActive="active-nav" class="nav-item group">
            <div class="icon-box group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 text-pink-500 group-hover:text-pink-600 dark:text-pink-400">
              <i class="fa-solid fa-user-doctor text-lg"></i>
            </div>
            <span class="font-medium">Profile</span>
          </a>
           <a routerLink="/doctor/change-password" routerLinkActive="active-nav" class="nav-item group">
            <div class="icon-box group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 text-yellow-500 group-hover:text-yellow-600 dark:text-yellow-400">
              <i class="fa-solid fa-key text-lg"></i>
            </div>
            <span class="font-medium">Change Password</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active-nav" class="nav-item group">
            <div class="icon-box group-hover:bg-gray-200 dark:group-hover:bg-gray-700 text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
               <i class="fa-solid fa-gear text-lg"></i>
            </div>
            <span class="font-medium">Settings</span>
          </a>
        </nav>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <button (click)="onLogout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group">
            <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-right-from-bracket text-sm"></i>
            </div>
            <span class="font-semibold text-sm">Sign Out</span>
          </button>
           <div class="mt-4 text-center text-[10px] text-gray-400">
              © 2025 CareSync
           </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 md:ml-64 relative flex flex-col h-screen overflow-y-auto bg-gray-50 dark:bg-gray-950">
        <div class="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            <!-- Breadcrumb or Top Info (Optional placeholder) -->
             <ng-content></ng-content>
        </div>
        <app-toast-container></app-toast-container>
      </main>

       <!-- Mobile Bottom Navigation -->
      <nav class="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 overflow-hidden">
        <div class="grid grid-cols-4 items-center h-16">
          <a routerLink="/doctor" routerLinkActive="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" [routerLinkActiveOptions]="{ exact: true }" class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <i class="fa-solid fa-house text-lg mb-1"></i>
            <span class="text-[10px] font-medium">Home</span>
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
