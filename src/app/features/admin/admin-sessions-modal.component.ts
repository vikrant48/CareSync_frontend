import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminUserSession } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { PageLoaderComponent } from '../../shared/ui/page-loader.component';

/** Active sign-ins of one user, with sign-out per session or for all of them. */
@Component({
  selector: 'app-admin-sessions-modal',
  standalone: true,
  imports: [CommonModule, ModalShellComponent, PageLoaderComponent],
  styleUrls: ['./admin-ui.css'],
  template: `
    <app-modal-shell [open]="!!username" title="Active sign-ins" [subtitle]="username || ''"
      icon="fa-solid fa-laptop" iconWrapClass="bg-[var(--primary-soft)] text-[var(--primary)]"
      maxWidthClass="max-w-2xl" bodyClass="p-4 sm:p-5 space-y-3" [hasFooter]="true"
      footerClass="px-4 sm:px-5 py-3 flex items-center justify-between gap-3" (close)="closed.emit()">

      <app-page-loader *ngIf="loading" label="Loading sessions..." [compact]="true"></app-page-loader>

      <div *ngIf="!loading && sessions.length === 0" class="py-10 text-center text-sm text-[var(--muted)]">
        <i class="fa-solid fa-moon text-xl mb-2 block" aria-hidden="true"></i>
        This user is not signed in anywhere.
      </div>

      <div *ngFor="let s of sessions; trackBy: trackSession"
        class="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
        <div class="w-9 h-9 rounded-lg bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] shrink-0">
          <i [class]="deviceIcon(s.userAgent)" aria-hidden="true"></i>
        </div>
        <div class="min-w-0 flex-1 text-xs space-y-0.5">
          <div class="font-semibold text-sm text-[var(--text)] truncate">{{ deviceLabel(s.userAgent) }}</div>
          <div class="text-[var(--muted)]">
            Signed in {{ s.loginTime ? (s.loginTime | date: 'MMM d, y, h:mm a') : 'unknown' }}
            <span *ngIf="s.lastActivity"> · Last active {{ s.lastActivity | date: 'MMM d, h:mm a' }}</span>
          </div>
          <div *ngIf="s.ipAddress" class="text-[var(--muted)] font-mono">IP {{ s.ipAddress }}</div>
        </div>
        <button type="button" class="adm-btn adm-btn--danger adm-btn--sm self-start sm:self-center"
          [disabled]="busySessionId === s.sessionId || signingOutAll" (click)="signOut(s)">
          <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
          {{ busySessionId === s.sessionId ? 'Signing out...' : 'Sign out' }}
        </button>
      </div>

      <div modalFooter class="contents">
        <span class="text-[11px] text-[var(--muted)]">Signing out ends the session and its refresh token.</span>
        <div class="flex items-center gap-2">
          <button type="button" class="adm-btn adm-btn--ghost" (click)="closed.emit()">Close</button>
          <button type="button" class="adm-btn adm-btn--danger" *ngIf="sessions.length > 1"
            [disabled]="signingOutAll" (click)="signOutAll()">
            {{ signingOutAll ? 'Signing out...' : 'Sign out everywhere' }}
          </button>
        </div>
      </div>
    </app-modal-shell>
  `,
})
export class AdminSessionsModalComponent implements OnChanges {
  private admin = inject(AdminService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  /** User whose sessions are shown; null closes the dialog */
  @Input() username: string | null = null;
  @Output() closed = new EventEmitter<void>();

  sessions: AdminUserSession[] = [];
  loading = false;
  busySessionId: string | null = null;
  signingOutAll = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['username'] && this.username) {
      this.load();
    }
  }

  load() {
    if (!this.username) return;
    this.loading = true;
    this.sessions = [];
    this.admin.getUserSessions(this.username).subscribe({
      next: (list) => {
        this.sessions = (list || []).filter((s) => s.active);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Could not load sessions for this user');
      },
    });
  }

  signOut(session: AdminUserSession) {
    this.busySessionId = session.sessionId;
    this.admin.deactivateSession(session.sessionId).subscribe({
      next: () => {
        this.busySessionId = null;
        this.sessions = this.sessions.filter((s) => s.sessionId !== session.sessionId);
        this.toast.showSuccess('Session signed out');
      },
      error: () => {
        this.busySessionId = null;
        this.toast.showError('Could not sign out this session');
      },
    });
  }

  async signOutAll() {
    if (!this.username) return;
    const ok = await this.confirm.ask({
      title: 'Sign out everywhere',
      message: `End all ${this.sessions.length} sessions of ${this.username}? They will have to sign in again.`,
      confirmLabel: 'Sign out all',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    this.signingOutAll = true;
    this.admin.deactivateAllSessions(this.username).subscribe({
      next: () => {
        this.signingOutAll = false;
        this.sessions = [];
        this.toast.showSuccess('All sessions signed out');
      },
      error: () => {
        this.signingOutAll = false;
        this.toast.showError('Could not sign out all sessions');
      },
    });
  }

  deviceLabel(userAgent?: string): string {
    const ua = (userAgent || '').toLowerCase();
    if (!ua) return 'Unknown device';
    const browser = ua.includes('edg/') ? 'Edge' : ua.includes('chrome') ? 'Chrome' : ua.includes('firefox') ? 'Firefox'
      : ua.includes('safari') ? 'Safari' : ua.includes('postman') ? 'Postman' : 'Browser';
    const os = ua.includes('android') ? 'Android' : ua.includes('iphone') || ua.includes('ipad') ? 'iOS'
      : ua.includes('windows') ? 'Windows' : ua.includes('mac os') ? 'macOS' : ua.includes('linux') ? 'Linux' : '';
    return os ? `${browser} on ${os}` : browser;
  }

  deviceIcon(userAgent?: string): string {
    const ua = (userAgent || '').toLowerCase();
    return ua.includes('android') || ua.includes('iphone') ? 'fa-solid fa-mobile-screen' : 'fa-solid fa-laptop';
  }

  trackSession = (_: number, s: AdminUserSession) => s.sessionId;
}
