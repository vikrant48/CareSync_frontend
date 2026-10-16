import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .pwd-input {
      padding-right: 3rem;
    }
    .pwd-toggle {
      color: var(--muted);
    }
    .pwd-toggle:hover {
      color: var(--text);
    }
    .pwd-toggle:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--primary-muted);
      border-radius: 0.75rem;
    }
    .form-section.is-divided {
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
  `],
  template: `
    <div class="surface p-5 sm:p-6 shadow-sm space-y-6">

      <div *ngIf="showIntro" class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <i class="fa-solid fa-lock" aria-hidden="true"></i>
        </div>
        <div class="min-w-0">
          <h2 class="heading text-base font-bold">Change Password</h2>
          <p class="text-xs sm:text-sm text-muted">Ensure your account is secure by using a strong password.</p>
        </div>
      </div>

      <div class="form-section space-y-5" [class.is-divided]="showIntro">

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

          <div class="xl:col-span-7 space-y-3.5">

            <div>
              <label for="current-password" class="form-label">Current Password</label>
              <div class="relative">
                <input id="current-password" [type]="showCurrent ? 'text' : 'password'" [(ngModel)]="form.currentPassword"
                  name="current_user_pass_field" autocomplete="new-password" placeholder="••••••••"
                  class="form-input pwd-input text-xs sm:text-sm">
                <button type="button" (click)="toggleCurrent()"
                  class="pwd-toggle touch-target absolute right-1 top-1/2 -translate-y-1/2"
                  [attr.aria-label]="showCurrent ? 'Hide current password' : 'Show current password'"
                  [attr.aria-pressed]="showCurrent">
                  <i [class]="showCurrent ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <div>
              <label for="new-password" class="form-label">New Password</label>
              <div class="relative">
                <input id="new-password" [type]="showNew ? 'text' : 'password'" [(ngModel)]="form.newPassword"
                  name="new_user_pass_field" autocomplete="new-password" placeholder="Enter new password"
                  class="form-input pwd-input text-xs sm:text-sm">
                <button type="button" (click)="toggleNew()"
                  class="pwd-toggle touch-target absolute right-1 top-1/2 -translate-y-1/2"
                  [attr.aria-label]="showNew ? 'Hide new password' : 'Show new password'"
                  [attr.aria-pressed]="showNew">
                  <i [class]="showNew ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <div>
              <label for="confirm-password" class="form-label">Confirm New Password</label>
              <div class="relative">
                <input id="confirm-password" [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="form.confirmPassword"
                  name="confirm_user_pass_field" autocomplete="new-password" placeholder="Confirm new password"
                  class="form-input pwd-input text-xs sm:text-sm">
                <button type="button" (click)="toggleConfirm()"
                  class="pwd-toggle touch-target absolute right-1 top-1/2 -translate-y-1/2"
                  [attr.aria-label]="showConfirm ? 'Hide password confirmation' : 'Show password confirmation'"
                  [attr.aria-pressed]="showConfirm">
                  <i [class]="showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" aria-hidden="true"></i>
                </button>
              </div>
            </div>

          </div>

          <div class="xl:col-span-5 xl:mt-7 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 space-y-2.5">
            <h3 class="text-sm font-bold">Password Requirements</h3>
            <div class="space-y-1.5 text-xs">
              <div class="flex items-center gap-2" [ngClass]="form.newPassword.length >= 8 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted'">
                <i class="fa-solid fa-circle-check text-xs" aria-hidden="true"></i>
                <span>At least 8 characters</span>
              </div>
              <div class="flex items-center gap-2" [ngClass]="hasUppercase(form.newPassword) ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted'">
                <i class="fa-solid fa-circle-check text-xs" aria-hidden="true"></i>
                <span>One uppercase letter</span>
              </div>
              <div class="flex items-center gap-2" [ngClass]="hasLowercase(form.newPassword) ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted'">
                <i class="fa-solid fa-circle-check text-xs" aria-hidden="true"></i>
                <span>One lowercase letter</span>
              </div>
              <div class="flex items-center gap-2" [ngClass]="hasNumber(form.newPassword) ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted'">
                <i class="fa-solid fa-circle-check text-xs" aria-hidden="true"></i>
                <span>One number</span>
              </div>
              <div class="flex items-center gap-2" [ngClass]="hasSpecial(form.newPassword) ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted'">
                <i class="fa-solid fa-circle-check text-xs" aria-hidden="true"></i>
                <span>One special character</span>
              </div>
            </div>
          </div>

        </div>

        <div class="flex justify-stretch sm:justify-end pt-2">
          <button type="button" (click)="submit()" [disabled]="loading || !isValid()"
            class="btn-primary w-full sm:w-auto">
            <i *ngIf="loading" class="fa-solid fa-circle-notch fa-spin text-xs" aria-hidden="true"></i>
            <span>{{ loading ? 'Updating...' : 'Update Password' }}</span>
          </button>
        </div>

      </div>

    </div>
  `,
})
export class ChangePasswordFormComponent implements OnInit, AfterViewInit {
  /** Settings already shows this title inside the card. Dedicated pages use the page header instead. */
  @Input() showIntro = true;
  form = { currentPassword: '', newPassword: '', confirmPassword: '' };
  loading = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private toast: ToastService) { }

  ngOnInit() {
    this.resetForm();
  }

  ngAfterViewInit() {
    // Clear any browser autofilled values shortly after render
    setTimeout(() => this.resetForm(), 100);
    setTimeout(() => this.resetForm(), 300);
  }

  isValid(): boolean {
    const next = this.form.newPassword;
    return !!(
      this.form.currentPassword &&
      next &&
      this.form.confirmPassword &&
      next.length >= 8 &&
      this.hasUppercase(next) &&
      this.hasLowercase(next) &&
      this.hasNumber(next) &&
      this.hasSpecial(next) &&
      next === this.form.confirmPassword
    );
  }

  hasUppercase(str: string): boolean { return /[A-Z]/.test(str); }
  hasLowercase(str: string): boolean { return /[a-z]/.test(str); }
  hasNumber(str: string): boolean { return /[0-9]/.test(str); }
  hasSpecial(str: string): boolean { return /[^A-Za-z0-9]/.test(str); }

  submit() {
    if (!this.form.currentPassword || !this.form.newPassword || !this.form.confirmPassword) {
      this.toast.showError('All fields are required.');
      return;
    }
    if (this.form.newPassword !== this.form.confirmPassword) {
      this.toast.showError('New password and confirmation do not match.');
      return;
    }
    if (!this.isValid()) {
      this.toast.showError('Password does not meet the requirements.');
      return;
    }

    this.loading = true;
    this.http
      .post<{ message?: string }>(`${this.baseUrl}/api/auth/change-password`, {
        currentPassword: this.form.currentPassword,
        newPassword: this.form.newPassword,
        confirmPassword: this.form.confirmPassword,
      })
      .subscribe({
        next: (res) => {
          this.toast.showSuccess(res?.message || 'Password changed successfully!');
          this.loading = false;
          this.resetForm();
        },
        error: (err) => {
          const serverMsg = (err?.error?.message || err?.error?.error || 'Failed to change password.').toString();
          this.toast.showError(serverMsg);
          this.loading = false;
        },
      });
  }

  toggleCurrent() { this.showCurrent = !this.showCurrent; }
  toggleNew() { this.showNew = !this.showNew; }
  toggleConfirm() { this.showConfirm = !this.showConfirm; }

  resetForm() {
    this.form = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.showCurrent = false;
    this.showNew = false;
    this.showConfirm = false;
  }
}

