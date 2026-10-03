import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './session-expired.component.html',
  styleUrl: './session-expired.component.css'
})
export class SessionExpiredComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  goToLogin() {
    // Clear any remaining tokens
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToRegister() {
    // Clear any remaining tokens
    this.authService.logout();
    this.router.navigate(['/register']);
  }

  goToHome() {
    // Clear any remaining tokens
    this.authService.logout();
    this.router.navigate(['/']);
  }
}