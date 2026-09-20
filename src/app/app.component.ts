import { Component, inject, PLATFORM_ID, ElementRef, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { BackendStatusService } from './core/services/backend-status.service';
import { OfflineBannerComponent } from './shared/offline-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, OfflineBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'caresync-frontend';
  auth = inject(AuthService);
  statusService = inject(BackendStatusService);
  private theme = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);
  private elementRef = inject(ElementRef);
  isBrowser = isPlatformBrowser(this.platformId);
  isGitDropdownOpen = false;

  constructor() { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.theme.init();
    }
  }

  toggleGitDropdown(event: Event) {
    event.stopPropagation();
    this.isGitDropdownOpen = !this.isGitDropdownOpen;
  }

  closeGitDropdown() {
    this.isGitDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isGitDropdownOpen && !this.elementRef.nativeElement.querySelector('.git-repo-dropdown-container')?.contains(event.target as Node)) {
      this.isGitDropdownOpen = false;
    }
  }
}
