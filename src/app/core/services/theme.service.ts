import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Theme = 'dark' | 'light' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'theme';
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  init() {
    if (!this.isBrowser) return;
    const saved = (localStorage.getItem(this.storageKey) as Theme) || 'dark';
    this.apply(saved);
  }

  setTheme(theme: Theme) {
    if (!this.isBrowser) return;
    localStorage.setItem(this.storageKey, theme);
    this.apply(theme);
  }

  getTheme(): Theme {
    if (!this.isBrowser) return 'dark';
    return ((localStorage.getItem(this.storageKey) as Theme) || 'dark');
  }

  private apply(theme: Theme) {
    if (!this.isBrowser) return;
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-light', 'dark', 'light');
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark' : 'light');
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(theme === 'light' ? 'light' : 'dark');
      body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
    }
  }
}
