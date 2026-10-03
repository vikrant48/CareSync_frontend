import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../core/services/confirm.service';
import { ModalShellComponent } from './modal-shell.component';

/**
 * Global confirm dialog host. Mount once in app shell.
 * UI only — callers keep the same yes/no decision via ConfirmService.ask().
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalShellComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  confirm = inject(ConfirmService);
}
