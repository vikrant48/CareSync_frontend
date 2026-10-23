import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest, Role } from '../../core/models/auth.models';
import { ToastService } from '../../core/services/toast.service';
import { FeatureCarouselComponent } from './feature-carousel.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FeatureCarouselComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  loading = false;
  error = '';
  showPassword = false;

  model: LoginRequest = { username: '', password: '' };
  selectedRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

  /** Shown when the user arrived from a shared doctor link */
  get doctorLinkHint(): boolean {
    return (this.auth.pendingReturnUrl() || '').startsWith('/patient/doctor/');
  }

  /** Open the remembered page (e.g. a shared doctor) or the dashboard */
  private continueAfterAuth(role: Role | null) {
    if (this.auth.redirectAfterAuth(role)) {
      this.toast.showInfo('That link is for patients, so you were taken to your dashboard.');
    }
  }

  codeStep = false;
  codeChallengeId = '';
  codeMessage = '';
  loginCode = '';

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login(this.model).subscribe({
      next: (resp) => {
        if (resp.mfaRequired && resp.mfaChallengeId) {
          // Password was right; no tokens until the code is entered
          this.codeStep = true;
          this.codeChallengeId = resp.mfaChallengeId;
          this.codeMessage = resp.message || 'Enter the 6-digit code we emailed you.';
          this.loginCode = '';
          this.loading = false;
          return;
        }
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Logged in successfully. Redirecting...');
        setTimeout(() => {
          this.continueAfterAuth(resp.role);
        }, 800);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Login failed';
        this.toast.showError(this.error);
        this.loading = false;
      },
    });
  }

  onSubmitCode() {
    const code = this.loginCode.trim();
    if (!/^\d{6}$/.test(code)) {
      this.error = 'Enter the 6-digit code from the email.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.verifyLoginCode(this.codeChallengeId, code).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Logged in successfully. Redirecting...');
        setTimeout(() => this.continueAfterAuth(resp.role), 800);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Invalid or expired code.';
        this.toast.showError(this.error);
        this.loading = false;
      },
    });
  }

  cancelCodeStep() {
    this.codeStep = false;
    this.codeChallengeId = '';
    this.loginCode = '';
    this.error = '';
    this.model.password = '';
  }

  onGoogleLogin() {
    // Check if google library is loaded, if not load it dynamically
    if (typeof (window as any).google === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => this.initGoogleAuth();
      document.head.appendChild(script);
    } else {
      this.initGoogleAuth();
    }
  }

  private initGoogleAuth() {
    const google = (window as any).google;
    if (!google) {
      this.toast.showError('Unable to load Google Identity Services');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleResponse(response),
    });

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to standard OAuth popup if One Tap prompt is dismissed
        this.toast.showInfo('Select your Google account to sign in');
      }
    });
  }

  private handleGoogleResponse(response: any) {
    if (!response || !response.credential) {
      this.toast.showError('Google authentication cancelled or failed');
      return;
    }

    this.loading = true;
    this.auth.loginWithGoogle(response.credential, this.selectedRole).subscribe({
      next: (resp) => {
        this.auth.storeAuth(resp);
        this.toast.showSuccess('Google Login successful!');
        setTimeout(() => {
          this.continueAfterAuth(resp.role);
        }, 800);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Google login failed';
        this.toast.showError(this.error);
        this.loading = false;
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}