import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { BackendStatusService } from './core/services/backend-status.service';
import { OfflineBannerComponent } from './shared/offline-banner.component';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog.component';
import { ToastContainerComponent } from './shared/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, OfflineBannerComponent, ConfirmDialogComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'caresync-frontend';
  auth = inject(AuthService);
  statusService = inject(BackendStatusService);
  private theme = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  constructor() { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.theme.init();
    }
  }
}
