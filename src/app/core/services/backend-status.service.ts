import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BackendStatusService {
    private platformId = inject(PLATFORM_ID);
    private baseUrl = environment.apiBaseUrl;

    isConnecting = signal<boolean>(true);
    isWakingUp = signal<boolean>(false);
    isConnected = signal<boolean>(false);
    showSuccessToast = signal<boolean>(false);

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.checkConnection();
        } else {
            // In SSR we don't block and assume connected
            this.isConnecting.set(false);
            this.isConnected.set(true);
        }
    }

    async checkConnection() {
        // If it's already marked as connected, reset to check again
        this.isConnected.set(false);
        this.isConnecting.set(true);
        this.isWakingUp.set(false);

        // Timer to detect if it takes too long (Render cold start)
        const wakingUpTimer = setTimeout(() => {
            if (!this.isConnected()) {
                this.isWakingUp.set(true);
            }
        }, 4000);

        const maxRetries = 40; // ~120s limit to prevent infinite run if backend is completely down
        let attempts = 0;

        while (!this.isConnected() && attempts < maxRetries) {
            attempts++;
            try {
                const url = `${this.baseUrl}/api/auth/check-availability?t=${Date.now()}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    mode: 'cors'
                });

                // Any response status below 500 (or even 500 but not connection failed/gateway errors) suggests the web app is alive
                if (response.ok || (response.status >= 200 && response.status < 500)) {
                    clearTimeout(wakingUpTimer);

                    // Show the green "Connected" success state for a moment before closing
                    this.isConnected.set(true);
                    this.isWakingUp.set(false);
                    this.showSuccessToast.set(true);

                    // Hide loader after 2.5 seconds
                    setTimeout(() => {
                        this.isConnecting.set(false);
                        this.showSuccessToast.set(false);
                    }, 2500);

                    break;
                }
            } catch (error) {
                console.warn(`[BackendStatus] Connection attempt ${attempts} failed. Backend might be starting up...`);
            }

            // Wait 3 seconds before next ping
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        if (!this.isConnected()) {
            // If we timed out completely
            clearTimeout(wakingUpTimer);
            this.isConnecting.set(false);
            this.isWakingUp.set(false);
        }
    }

    setOffline() {
        if (this.isConnected()) {
            this.checkConnection();
        }
    }
}
