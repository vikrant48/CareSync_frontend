import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { AppointmentStatusLogDto } from '../../core/models/appointment.models';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';

@Component({
    selector: 'app-appointment-audit-trail-modal',
    standalone: true,
    imports: [CommonModule, ModalShellComponent],
    templateUrl: './appointment-audit-trail-modal.component.html',
})
export class AppointmentAuditTrailModalComponent implements OnChanges {
    private appointmentApi = inject(AppointmentApiService);

    @Input() isOpen: boolean = false;
    @Input() appointmentId: number = 0;
    @Output() close = new EventEmitter<void>();

    logs: AppointmentStatusLogDto[] = [];
    loading: boolean = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen'] && this.isOpen && this.appointmentId > 0) {
            this.loadAuditTrail();
        }
    }

    loadAuditTrail(): void {
        this.loading = true;
        this.appointmentApi.getAppointmentAuditTrail(this.appointmentId).subscribe({
            next: (data: AppointmentStatusLogDto[]) => {
                this.logs = data || [];
                this.loading = false;
            },
            error: (err: any) => {
                this.logs = [];
                this.loading = false;
            }
        });
    }

    closeModal(): void {
        this.close.emit();
    }

    trackLog(_index: number, log: AppointmentStatusLogDto): number {
        return log.id;
    }
}
