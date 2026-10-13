import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block w-full' },
  template: `
    <div class="caresync-loader" [class.caresync-loader--compact]="compact"
         role="status" aria-live="polite" aria-busy="true" [attr.aria-label]="label">
      <div class="caresync-loader__mark" aria-hidden="true">
        <span class="caresync-loader__ring"></span>
        <span class="caresync-loader__ring caresync-loader__ring--inner"></span>
        <span class="caresync-loader__logo">
          <img src="/logo-cross1.png" alt="" />
        </span>
      </div>
      <p class="caresync-loader__label">{{ label }}</p>
      <p *ngIf="!compact" class="caresync-loader__brand">CareSync</p>
    </div>
  `,
  styles: [`
    .caresync-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 16rem;
      padding: 4rem 1rem;
      text-align: center;
    }

    .caresync-loader--compact {
      min-height: 0;
      padding: 1.75rem 1rem;
    }

    .caresync-loader__mark {
      position: relative;
      width: 4.75rem;
      height: 4.75rem;
    }

    .caresync-loader--compact .caresync-loader__mark {
      width: 3.25rem;
      height: 3.25rem;
    }

    .caresync-loader__ring {
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      background: conic-gradient(from 20deg, transparent 0 28%, #34d399 42%, #2dd4bf 62%, #2563eb 82%, transparent 100%);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px));
      mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px));
      animation: caresync-spin 1.05s linear infinite;
    }

    .caresync-loader__ring--inner {
      inset: 8px;
      opacity: 0.55;
      animation-duration: 1.7s;
      animation-direction: reverse;
    }

    .caresync-loader--compact .caresync-loader__ring--inner {
      inset: 6px;
    }

    .caresync-loader__logo {
      position: absolute;
      inset: 14px;
      border-radius: 9999px;
      overflow: hidden;
      background: var(--panel);
      box-shadow: 0 0 0 1px var(--border), 0 0 18px rgba(37, 99, 235, 0.28);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: caresync-pulse 1.8s ease-in-out infinite;
    }

    .caresync-loader--compact .caresync-loader__logo {
      inset: 10px;
    }

    .caresync-loader__logo img {
      width: 150%;
      height: 150%;
      object-fit: cover;
    }

    .caresync-loader__label {
      margin: 0.95rem 0 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }

    .caresync-loader--compact .caresync-loader__label {
      margin-top: 0.7rem;
      font-size: 0.75rem;
    }

    .caresync-loader__brand {
      margin: 0.2rem 0 0;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      background: linear-gradient(90deg, #34d399, #2dd4bf, #2563eb);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    @keyframes caresync-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes caresync-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(0.94); }
    }
  `]
})
export class PageLoaderComponent {
  @Input() label = 'Loading...';
  @Input() compact = false;
  @Input() accent: 'primary' | 'doctor' = 'primary';
}
