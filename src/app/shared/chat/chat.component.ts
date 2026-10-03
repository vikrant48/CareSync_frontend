import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';

interface ChatMessage {
    id?: number;
    appointmentId: number;
    content: string;
    senderRole: string;
    senderId: number;
    timestamp: string;
}

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
    @Input() appointmentId!: number;

    messages: ChatMessage[] = [];
    newMessage = '';
    private subscription?: Subscription;
    private myUserId: number = 0;
    private myRole: string = '';

    @ViewChild('scrollContainer') scrollContainer!: ElementRef;

    private webSocketService = inject(WebSocketService);
    private authService = inject(AuthService);
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);

    ngOnInit() {
        this.myUserId = Number(this.authService.userId());
        this.myRole = String(this.authService.role() || '');

        this.loadChatHistory();
        this.subscribeToTopic();
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    isMyMessage(msg: ChatMessage): boolean {
        return msg.senderId === this.myUserId;
    }

    loadChatHistory() {
        this.http.get<ChatMessage[]>(`${environment.apiBaseUrl}/api/chat/${this.appointmentId}`)
            .subscribe(msgs => {
                this.messages = msgs;
                this.scrollToBottom();
            });
    }

    subscribeToTopic() {
        // We need to access the socket client directly or via a specific method
        // Since WebSocketService focuses on user queue, we might need to add a generic subscribe method to it
        // Or just use the stompClient if exposed. 
        // Let's assume we update WebSocketService to expose a generic subscribe method.
        // For now, I will use a method I will add to WebSocketService: subscribeToTopic

        this.subscription = this.webSocketService.subscribeToTopic(`/topic/appointment/${this.appointmentId}`)
            .subscribe((msg: any) => {
                this.messages.push(msg);
                this.scrollToBottom();
                this.cdr.detectChanges();
            });
    }

    sendMessage() {
        if (!this.newMessage.trim()) return;

        const msg: Partial<ChatMessage> = {
            appointmentId: this.appointmentId,
            content: this.newMessage,
            senderRole: this.myRole,
            senderId: this.myUserId
        };

        this.webSocketService.publish('/app/chat.sendMessage', msg);
        this.newMessage = '';
    }

    private scrollToBottom() {
        setTimeout(() => {
            if (this.scrollContainer) {
                this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
            }
        }, 100);
    }
}
