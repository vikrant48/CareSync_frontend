import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastContainerComponent } from './toast-container.component';
import { AiAssistantWidgetComponent } from './ai-assistant-widget.component';
import { ProductTourComponent } from './product-tour/product-tour.component';

export interface AppShellLink {
  id?: string;
  label: string;
  icon: string;
  link?: string;
  exact?: boolean;
  logout?: boolean;
  divider?: boolean;
  tileClass?: string;
  labelClass?: string;
}

export interface AppShellTab {
  label: string;
  icon: string;
  link?: string;
  exact?: boolean;
  opensMenu?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  host: { class: 'block h-full w-full' },
  imports: [CommonModule, RouterModule, ToastContainerComponent, AiAssistantWidgetComponent, ProductTourComponent],
  template: `
    <app-product-tour *ngIf="showTour"></app-product-tour>
    <div class="min-h-[calc(100vh-3.5rem)] w-full bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <aside class="hidden md:flex fixed top-14 left-0 bottom-0 w-64 flex-col bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 overflow-hidden">
        <ng-content select="[shellHeader]"></ng-content>

        <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          <ng-container *ngFor="let item of sidebarLinks">
            <div *ngIf="item.divider" class="pt-2 my-2 border-t border-gray-200 dark:border-gray-700/60"></div>
            <button *ngIf="item.logout" type="button" (click)="onLogout()" [class]="logoutClass">
              <i [class]="item.icon + ' ' + sidebarIconExtra"></i>
              <span>{{ item.label }}</span>
            </button>
            <a *ngIf="!item.divider && !item.logout"
               [attr.id]="item.id"
               [routerLink]="item.link"
               [routerLinkActiveOptions]="{ exact: !!item.exact }"
               [routerLinkActive]="sidebarActiveClass"
               [class]="sidebarLinkClass">
              <i [class]="item.icon + ' ' + sidebarIconExtra"></i>
              <span>{{ item.label }}</span>
            </a>
          </ng-container>
        </nav>

        <div class="mt-auto px-4 py-3 border-t border-gray-200 dark:border-gray-700/80 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
          © 2026 CareSync. All rights reserved.
        </div>
      </aside>

      <main class="md:pl-64 w-full min-h-[calc(100vh-3.5rem)]">
        <div [class]="contentPadClass">
          <ng-content></ng-content>
        </div>
        <app-toast-container></app-toast-container>
        <app-ai-assistant-widget *ngIf="showAssistant && assistantInside"></app-ai-assistant-widget>
      </main>

      <app-ai-assistant-widget *ngIf="showAssistant && !assistantInside"></app-ai-assistant-widget>

      <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
           [ngClass]="variant === 'doctor'
             ? 'bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-hidden'
             : 'border-t bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'"
           style="min-height: calc(4rem + env(safe-area-inset-bottom, 0px));">
        <div class="grid items-center h-16" [class.text-sm]="variant === 'patient'" [class.grid-cols-3]="variant === 'patient'" [class.grid-cols-5]="variant === 'doctor'">
          <ng-container *ngFor="let tab of tabs">
            <button *ngIf="tab.opensMenu" type="button" (click)="menuOpen = !menuOpen"
                    [attr.aria-label]="variant === 'doctor' ? 'Open menu' : 'Open Menu'"
                    [attr.aria-expanded]="menuOpen"
                    [class.text-brand]="menuOpen"
                    [class]="tabClass">
              <ng-container *ngIf="variant === 'doctor'; else plainMenuIcon">
                <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-1 transition-transform" [class.rotate-90]="menuOpen">
                  <i class="fa-solid" [class.fa-bars]="!menuOpen" [class.fa-xmark]="menuOpen"></i>
                </div>
                <span class="text-[10px] font-medium">{{ tab.label }}</span>
              </ng-container>
              <ng-template #plainMenuIcon>
                <i class="fa-solid" [class.fa-bars]="!menuOpen" [class.fa-xmark]="menuOpen"></i>
                <span class="text-xs mt-1">{{ tab.label }}</span>
              </ng-template>
            </button>
            <a *ngIf="!tab.opensMenu" [routerLink]="tab.link" routerLinkActive="nav-active"
               [routerLinkActiveOptions]="{ exact: !!tab.exact }" [class]="tabClass">
              <i [class]="tab.icon + (variant === 'doctor' ? ' text-lg mb-1' : '')"></i>
              <span [class]="variant === 'doctor' ? 'text-[10px] font-medium' : 'text-xs mt-1'">{{ tab.label }}</span>
            </a>
          </ng-container>
        </div>
      </nav>

      <div *ngIf="variant === 'patient' && menuOpen" class="md:hidden fixed inset-x-0 top-0 z-40" style="bottom: calc(4rem + env(safe-area-inset-bottom, 0px));">
        <div class="absolute inset-x-0 top-0 bottom-0 bg-black/50" (click)="menuOpen = false"></div>
        <div class="absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-t-xl shadow-xl p-3 space-y-1">
          <div class="flex items-center justify-between px-2 py-1">
            <div class="text-sm font-semibold">Quick Actions</div>
            <button type="button" (click)="menuOpen = false" aria-label="Close menu" class="touch-target flex items-center justify-center text-gray-400">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 gap-1">
            <ng-container *ngFor="let item of menuLinks">
              <button *ngIf="item.logout" type="button" (click)="onLogout()" class="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <i [class]="item.icon"></i>
                <span>{{ item.label }}</span>
              </button>
              <a *ngIf="!item.logout" [routerLink]="item.link" (click)="menuOpen = false" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <i [class]="item.icon"></i>
                <span>{{ item.label }}</span>
              </a>
            </ng-container>
          </div>
        </div>
      </div>

      <ng-container *ngIf="variant === 'doctor'">
        <div *ngIf="menuOpen" class="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" (click)="menuOpen = false" aria-hidden="true"></div>
        <div class="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-gray-900 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transform transition-transform duration-300 ease-out max-h-[75vh] overflow-y-auto"
             [class.translate-y-0]="menuOpen" [class.translate-y-full]="!menuOpen">
          <div class="sticky top-0 bg-white dark:bg-gray-900 z-10 px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <span class="bg-gray-200 dark:bg-gray-700 w-12 h-1.5 rounded-full absolute top-2 left-1/2 -translate-x-1/2"></span>
            <h3 class="font-bold text-lg text-[var(--text)] mt-2">More Options</h3>
            <button type="button" (click)="menuOpen = false" aria-label="Close menu" class="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 mt-2 touch-target">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="p-6 grid grid-cols-2 gap-3">
            <ng-container *ngFor="let item of menuLinks">
              <button *ngIf="item.logout" type="button" (click)="onLogout()" [class]="item.tileClass">
                <i [class]="item.icon + ' text-2xl mb-2'"></i>
                <span [class]="item.labelClass || 'text-sm font-medium'">{{ item.label }}</span>
              </button>
              <a *ngIf="!item.logout" [routerLink]="item.link" (click)="menuOpen = false" [class]="item.tileClass">
                <i [class]="item.icon + ' text-2xl mb-2'"></i>
                <span [class]="item.labelClass || 'text-sm font-medium'">{{ item.label }}</span>
              </a>
            </ng-container>
          </div>
          <div class="safe-bottom" style="height: calc(2rem + env(safe-area-inset-bottom, 0px));"></div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 9999px;
    }
    :host-context(.dark) .custom-scrollbar::-webkit-scrollbar-thumb,
    :host-context(.theme-dark) .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #374151;
    }
  `]
})
export class AppShellComponent {
  @Input() variant: 'patient' | 'doctor' = 'patient';
  @Input() sidebarLinks: AppShellLink[] = [];
  @Input() tabs: AppShellTab[] = [];
  @Input() menuLinks: AppShellLink[] = [];
  @Input() showTour = false;
  @Input() showAssistant = true;
  @Input() assistantInside = false;

  @Output() logout = new EventEmitter<void>();

  menuOpen = false;

  get contentPadClass(): string {
    return this.variant === 'doctor'
      ? 'pb-[calc(8rem+env(safe-area-inset-bottom,0px))] md:pb-8'
      : 'pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-8';
  }

  get sidebarActiveClass(): string {
    return this.variant === 'doctor'
      ? '!bg-gray-200 dark:!bg-gray-700'
      : '!bg-[var(--primary)] !text-white font-semibold shadow-sm';
  }

  get sidebarLinkClass(): string {
    return this.variant === 'doctor'
      ? 'flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      : 'flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors';
  }

  get sidebarIconExtra(): string {
    return this.variant === 'patient' ? 'text-sm w-5 text-center' : 'w-5 text-center';
  }

  get logoutClass(): string {
    return this.variant === 'doctor'
      ? 'w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors'
      : 'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm transition-colors';
  }

  get tabClass(): string {
    return this.variant === 'doctor'
      ? 'flex flex-col items-center justify-center h-full min-h-touch text-gray-500 dark:text-gray-400 hover:text-brand transition-colors'
      : 'flex flex-col items-center justify-center h-full min-h-touch touch-target text-gray-600 dark:text-gray-400';
  }

  onLogout(): void {
    this.menuOpen = false;
    this.logout.emit();
  }
}
