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
    const html = document.documentElement;
    body.classList.remove('theme-dark', 'theme-light', 'dark', 'light');
    html.classList.remove('theme-dark', 'theme-light', 'dark', 'light');

    let resolvedDark = true;
    if (theme === 'system') {
      resolvedDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      resolvedDark = theme !== 'light';
    }

    const themeClass = resolvedDark ? 'dark' : 'light';
    const modeClass = resolvedDark ? 'theme-dark' : 'theme-light';

    body.classList.add(themeClass, modeClass);
    html.classList.add(themeClass, modeClass);
  }
}
