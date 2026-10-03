import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';
import { ModalShellComponent } from '../ui/modal-shell.component';

@Component({
  selector: 'app-shared-chat-modal',
  standalone: true,
  imports: [CommonModule, ChatComponent, ModalShellComponent],
  templateUrl: './shared-chat-modal.component.html',
  styleUrl: './shared-chat-modal.component.css'
})
export class SharedChatModalComponent {
  @Input() isOpen = false;
  @Input() appointmentId: number | null = null;
  @Input() participantName: string | null = null;
  @Input() participantImage: string | null = null;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
