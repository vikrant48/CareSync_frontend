import { Component, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { DoctorProfileService } from './core/services/doctor-profile.service';
import { PatientProfileService } from './core/services/patient-profile.service';
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
  private doctorProfiles = inject(DoctorProfileService);
  private patientProfiles = inject(PatientProfileService);
  private theme = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);

  // Navbar avatar & dropdown state
  profileImageUrl: string = '';
  avatarInitial: string = '';
  menuOpen = false;

  onLogout() {
    this.auth.logout();
    // Clear avatar state to avoid stale image until next login
    this.profileImageUrl = '';
    this.avatarInitial = '';
    this.menuOpen = false;
  }

  // Reactively update avatar when auth signals change (login/logout or role switch)
  avatarEffect = effect(() => {
    const uname = this.auth.username() || '';
    const role = this.auth.role();
    if (!uname || !role) {
      this.profileImageUrl = '';
      this.avatarInitial = 'U';
      return;
    }
    this.avatarInitial = (uname[0] || 'U').toUpperCase();
    if (role === 'DOCTOR') {
      this.doctorProfiles.getProfile(uname).subscribe({
        next: (d) => (this.profileImageUrl = d?.profileImageUrl || ''),
        error: () => (this.profileImageUrl = ''),
      });
    } else if (role === 'PATIENT') {
      this.patientProfiles.getProfile(uname).subscribe({
        next: (p) => (this.profileImageUrl = p?.profileImageUrl || ''),
        error: () => (this.profileImageUrl = ''),
      });
    }
  });

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  constructor() {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.theme.init();
    }
  }
}
