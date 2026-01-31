import { Injectable } from '@angular/core';
import { Client, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private stompClient: Client | null = null;
    private connectionStatus = new BehaviorSubject<boolean>(false);

    // Use a Subject to broadcast notification messages to subscribers
    private notificationSubject = new Subject<any>();

    constructor(private authService: AuthService) {
        this.initializeWebSocketConnection();
    }

    private initializeWebSocketConnection() {
        // Determine the user's role and email/identifier
        // For now we will rely on the token being present in AuthService or LocalStorage
        // The backend endpoint is public for handshake, but usually we pass token

        const socketUrl = `${environment.apiBaseUrl.replace('/api', '')}/ws`;
        // Note: If your API base URL is just http://localhost:8080/api, replace ensures http://localhost:8080/ws

        // We can't easily pass headers with SockJS in the standard way for handshake query params
        // But StompJS allows connectHeaders

        this.stompClient = new Client({
            // brokerURL: 'ws://localhost:8080/ws', // Use this if not using SockJS
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
