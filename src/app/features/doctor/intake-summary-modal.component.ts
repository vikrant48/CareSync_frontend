import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { PreVisitIntakeRequest, PreVisitIntakeResponse } from '../../core/models/appointment.models';

@Component({
    selector: 'app-intake-summary-modal',
    standalone: true,
    imports: [CommonModule, ModalShellComponent],
    templateUrl: './intake-summary-modal.component.html',
    styleUrl: './intake-summary-modal.component.css'
})
export class IntakeSummaryModalComponent {
    @Input() isOpen: boolean = false;
    @Input() appointmentId: number = 0;
    @Input() summaryText: string = '';
    @Input() intakeData: PreVisitIntakeResponse | PreVisitIntakeRequest | any = null;

    @Output() close = new EventEmitter<void>();

    closeModal(): void {
        this.close.emit();
    }
}
