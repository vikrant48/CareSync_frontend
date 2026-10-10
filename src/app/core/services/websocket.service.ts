import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private stompClient: Client | null = null;
    private connectionStatus = new BehaviorSubject<boolean>(false);

    // Use a Subject to broadcast notification messages to subscribers
    private notificationSubject = new Subject<any>();

    constructor(private authService: AuthService) {
        if (this.isBrowser) {
            this.initializeWebSocketConnection();
        }
    }

    private async initializeWebSocketConnection() {
        if (!this.isBrowser) {
            return;
        }

        const socketUrl = `${environment.apiBaseUrl.replace('/api', '')}/ws`;
        const sockJsModule = await import('sockjs-client');
        const SockJS = (sockJsModule as any).default || sockJsModule;

        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => {
                // console.log(str); // Uncomment for debugging
            }
        });

        this.stompClient.onConnect = (frame) => {
            console.log('Connected to WebSocket');
            this.connectionStatus.next(true);

            this.subscribeToQueue();
        };

        this.stompClient.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        this.stompClient.activate();
    }

    private subscribeToQueue() {
        // Subscribe to user-specific queue
        // The backend sends to /user/{email}/queue/notifications or just /user/queue/notifications
        // When using convertAndSendToUser, Spring automatically translates /user/queue/notifications 
        // to /user/queue/notifications-user{session-id}

        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.subscribe('/user/queue/notifications', (message) => {
                if (message.body) {
                    const notification = JSON.parse(message.body);
                    this.notificationSubject.next(notification);
                }
            });
        }
    }

    public getNotificationStream(): Observable<any> {
        return this.notificationSubject.asObservable();
    }

    public isConnected(): Observable<boolean> {
        return this.connectionStatus.asObservable();
    }

    public subscribeToTopic(topic: string): Observable<any> {
        return new Observable(observer => {
            if (!this.stompClient || !this.stompClient.connected) {
                // Wait for connection potentially? For now error if not connected or check connectionStatus
                const sub = this.connectionStatus.subscribe(connected => {
                    if (connected && this.stompClient) {
                        const stompSub = this.stompClient.subscribe(topic, message => {
                            if (message.body) {
                                observer.next(JSON.parse(message.body));
                            }
                        });
                        // Override teardown
                        observer.add(() => stompSub.unsubscribe());
                    }
                });
                return () => sub.unsubscribe();
            } else {
                const stompSub = this.stompClient.subscribe(topic, message => {
                    if (message.body) {
                        observer.next(JSON.parse(message.body));
                    }
                });
                return () => stompSub.unsubscribe();
            }
        });
    }

    public publish(destination: string, body: any) {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.publish({ destination: destination, body: JSON.stringify(body) });
        }
    }
}
