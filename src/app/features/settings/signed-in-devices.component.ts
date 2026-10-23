import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { SignedInDevice } from '../../core/models/auth.models';

/**
 * Settings → Signed-in devices: the user's own sessions, with "Sign out" per device and "Sign out all other
 * devices". Signing out this device works like Logout.
 */
@Component({
  selector: 'app-signed-in-devices',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="surface p-5 sm:p-6 shadow-sm space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center text-lg shrink-0">
          <i class="fa-solid fa-laptop-medical" aria-hidden="true"></i>
        </div>
        <div class="min-w-0">
          <h2 class="heading text-base font-bold">Signed-in devices</h2>
          <p class="text-xs sm:text-sm text-muted">Where your account is signed in. Sign out anything you don't recognise.</p>
        </div>
      </div>

      <p *ngIf="loading()" class="text-xs text-muted">Loading your devices…</p>
      <p *ngIf="error()" class="text-xs text-rose-600 dark:text-rose-400" role="alert">{{ error() }}</p>

      <ul *ngIf="!loading() && devices().length" class="space-y-2">
        <li *ngFor="let d of devices()"
            class="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
          <div class="flex items-center gap-3 min-w-0">
            <i class="fa-solid text-muted" [ngClass]="isPhone(d.device) ? 'fa-mobile-screen' : 'fa-desktop'" aria-hidden="true"></i>
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--text)]">
                <span class="truncate">{{ d.device }}</span>
                <span *ngIf="d.current"
                      class="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-px text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-300">This device</span>
              </div>
              <div class="text-[11px] text-muted truncate">
                {{ d.ipAddress }} · Active {{ d.lastActiveAt | date:'d MMM, h:mm a' }} · Signed in {{ d.signedInAt | date:'d MMM' }}
              </div>
            </div>
          </div>
          <button type="button" (click)="signOut(d)" [disabled]="busy()"
                  class="shrink-0 min-h-[36px] px-3 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 transition-colors">
            Sign out
          </button>
        </li>
      </ul>

      <button *ngIf="!loading() && otherCount() > 0" type="button" (click)="signOutOthers()" [disabled]="busy()"
              class="w-full min-h-[44px] rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 transition-colors">
        <i class="fa-solid fa-right-from-bracket mr-1.5" aria-hidden="true"></i>
        Sign out all other devices ({{ otherCount() }})
      </button>
    </div>
  `
})
export class SignedInDevicesComponent implements OnInit {
  private auth = inject(AuthService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  devices = signal<SignedInDevice[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  otherCount(): number {
    return this.devices().filter(d => !d.current).length;
  }

  isPhone(device: string): boolean {
    return /Android|iPhone/.test(device);
  }

  private load() {
    this.loading.set(true);
    this.auth.listSessions().subscribe({
      next: list => {
        this.devices.set(list);
        this.error.set(null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your devices. Please try again.');
        this.loading.set(false);
      }
    });
  }

  async signOut(device: SignedInDevice) {
    if (device.current) {
      const ok = await this.confirm.ask({
        title: 'Sign out of this device',
        message: 'You will be signed out here and taken to the login page.',
        confirmLabel: 'Sign out',
        cancelLabel: 'Stay signed in',
        danger: true
      });
      if (ok) this.auth.logout();
      return;
    }
    this.busy.set(true);
    this.auth.signOutSession(device.id).subscribe({
      next: () => {
        this.devices.update(list => list.filter(d => d.id !== device.id));
        this.toast.showSuccess(`Signed out ${device.device}.`);
        this.busy.set(false);
      },
      error: () => {
        this.toast.showError('Could not sign out that device.');
        this.busy.set(false);
        this.load();
      }
    });
  }

  async signOutOthers() {
    const ok = await this.confirm.ask({
      title: 'Sign out all other devices',
      message: 'Every other phone, tablet and browser signed in to your account will be signed out right away.',
      confirmLabel: 'Sign out others',
      cancelLabel: 'Cancel',
      danger: true
    });
    if (!ok) return;
    this.busy.set(true);
    this.auth.signOutOtherSessions().subscribe({
      next: res => {
        this.devices.update(list => list.filter(d => d.current));
        this.toast.showSuccess(`Signed out ${res.signedOut} other device${res.signedOut === 1 ? '' : 's'}.`);
        this.busy.set(false);
      },
      error: () => {
        this.toast.showError('Could not sign out the other devices.');
        this.busy.set(false);
      }
    });
  }
}
