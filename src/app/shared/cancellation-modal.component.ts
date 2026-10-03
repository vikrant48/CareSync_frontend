import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientAppointmentItem } from '../core/services/appointment.service';
import { ModalShellComponent } from './ui/modal-shell.component';

@Component({
  selector: 'app-cancellation-modal',
  standalone: true,
  imports: [CommonModule, ModalShellComponent],
  templateUrl: './cancellation-modal.component.html',
  styleUrl: './cancellation-modal.component.css'
})
export class CancellationModalComponent {
  @Input() appointment: PatientAppointmentItem | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() confirmCancel = new EventEmitter<void>();
  @Output() requestReschedule = new EventEmitter<void>();

  onClose() { this.close.emit(); }
  onConfirm() { this.confirmCancel.emit(); }
  onReschedule() { this.requestReschedule.emit(); }
}
