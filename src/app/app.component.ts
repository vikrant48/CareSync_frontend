import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'caresync-frontend';
  auth = inject(AuthService);
  private theme = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);

  constructor() {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.theme.init();
    }
  }
}
