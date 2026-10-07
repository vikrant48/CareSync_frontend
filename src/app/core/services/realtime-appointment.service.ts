import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { AppointmentStateService } from './appointment-state.service';
import { AppointmentStatus } from '../models/appointment.models';

export interface AppointmentUpdateEvent {
    appointmentId: number;
    status: AppointmentStatus | string;
    previousStatus?: string;
    changedBy?: string;
    timestamp?: string;
    message?: string;
}

@Injectable({ providedIn: 'root' })
export class RealtimeAppointmentService {
    private wsService = inject(WebSocketService);
    private stateService = inject(AppointmentStateService);

    private updateSubject = new Subject<AppointmentUpdateEvent>();

    constructor() {
        this.listenToTopicUpdates();
    }

    private listenToTopicUpdates(): void {
        this.wsService.subscribeToTopic('/topic/appointment-updates').subscribe({
            next: (event: AppointmentUpdateEvent) => {
                if (event && event.appointmentId) {
                    // If active appointment matches, update local signal state
                    const active = this.stateService.activeAppointment();
                    if (active && (active.appointmentId === event.appointmentId || active.id === event.appointmentId)) {
                        this.stateService.updateStatusLocally(event.status, event.changedBy || 'SYSTEM');
                    }
                    this.updateSubject.next(event);
                }
            },
            error: (err) => console.warn('WebSocket appointment topic error:', err)
        });
    }

    getAppointmentUpdateStream(): Observable<AppointmentUpdateEvent> {
        return this.updateSubject.asObservable();
    }

    getNotificationStream(): Observable<any> {
        return this.wsService.getNotificationStream();
    }
}
