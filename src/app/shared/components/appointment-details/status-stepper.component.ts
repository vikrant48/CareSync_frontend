import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PipelineStage {
    id: string;
    name: string;
    state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'CANCELLED';
    statuses: string[];
}

@Component({
    selector: 'app-status-stepper',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './status-stepper.component.html',
    styleUrl: './status-stepper.component.css'
})
export class StatusStepperComponent implements OnChanges {
    @Input() currentStatus: string = 'BOOKED';

    stages: PipelineStage[] = [
        { id: '1', name: 'Booked', state: 'UPCOMING', statuses: ['HELD', 'BOOKED'] },
        { id: '2', name: 'Confirmed', state: 'UPCOMING', statuses: ['CONFIRMED', 'SCHEDULED'] },
        { id: '3', name: 'Intake Done', state: 'UPCOMING', statuses: ['INTAKE', 'INTAKE_COMPLETED'] },
        { id: '4', name: 'Waiting Room', state: 'UPCOMING', statuses: ['WAITING_ROOM', 'READY_FOR_VISIT'] },
        { id: '5', name: 'In Progress', state: 'UPCOMING', statuses: ['IN_PROGRESS'] },
        { id: '6', name: 'Medical Report', state: 'UPCOMING', statuses: ['MEDICAL_RECORD', 'REPORT_DRAFTED'] },
        { id: '7', name: 'Completed', state: 'UPCOMING', statuses: ['READY_TO_COMPLETE', 'COMPLETED'] }
    ];

    get isCancelled(): boolean {
        return (this.currentStatus || '').startsWith('CANCELLED');
    }

    get isNoShow(): boolean {
        return (this.currentStatus || '').startsWith('NO_SHOW') || this.currentStatus === 'AUTO_CLOSED';
    }

    get isTerminalState(): boolean {
        return this.isCancelled || this.isNoShow;
    }

    get currentStatusLabel(): string {
        return (this.currentStatus || '').replace(/_/g, ' ');
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentStatus']) {
            this.updatePipelineStages();
        }
    }

    private updatePipelineStages(): void {
        const status = this.currentStatus || 'BOOKED';

        if (this.isTerminalState) {
            this.stages.forEach(s => s.state = 'CANCELLED');
            return;
        }

        // Map backend statuses to 7 pipeline stage index
        const stageOrder: { [key: string]: number } = {
            'HELD': 0, 'BOOKED': 0,
            'CONFIRMED': 1, 'SCHEDULED': 1,
            'INTAKE': 2, 'INTAKE_COMPLETED': 2,
            'WAITING_ROOM': 3, 'READY_FOR_VISIT': 3,
            'IN_PROGRESS': 4,
            'MEDICAL_RECORD': 5, 'REPORT_DRAFTED': 5,
            'READY_TO_COMPLETE': 6,
            'COMPLETED': 6
        };

        const currentIndex = stageOrder[status] !== undefined ? stageOrder[status] : 0;

        if (status === 'COMPLETED') {
            this.stages.forEach(stage => stage.state = 'COMPLETED');
            return;
        }

        this.stages.forEach((stage, idx) => {
            if (idx < currentIndex) {
                stage.state = 'COMPLETED';
            } else if (idx === currentIndex) {
                stage.state = 'CURRENT';
            } else {
                stage.state = 'UPCOMING';
            }
        });
    }
}
