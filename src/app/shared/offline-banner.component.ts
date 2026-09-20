import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-offline-banner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="isOffline" 
         class="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-xl animate-in slide-in-from-top duration-300">
      <i class="fa-solid fa-wifi-slash text-sm animate-pulse"></i>
      <span>You are currently offline. Live video & chat features require internet connection.</span>
    </div>
  `
})
export class OfflineBannerComponent implements OnInit, OnDestroy {
    isOffline = false;
    private onlineListener?: () => void;
    private offlineListener?: () => void;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.isOffline = !navigator.onLine;

            this.onlineListener = () => { this.isOffline = false; };
            this.offlineListener = () => { this.isOffline = true; };

            window.addEventListener('online', this.onlineListener);
            window.addEventListener('offline', this.offlineListener);
        }
    }

    ngOnDestroy() {
        if (isPlatformBrowser(this.platformId)) {
            if (this.onlineListener) window.removeEventListener('online', this.onlineListener);
            if (this.offlineListener) window.removeEventListener('offline', this.offlineListener);
        }
    }
}
