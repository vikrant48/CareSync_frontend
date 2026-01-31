import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
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
    template: `
    <div class="flex flex-col h-full bg-gray-900 text-gray-100">
      <!-- Header removed (handled by parent modal) -->

      <!-- Messages Area -->
      <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <div *ngFor="let msg of messages" 
             class="flex flex-col max-w-[85%]"
             [class.self-end]="isMyMessage(msg)"
             [class.self-start]="!isMyMessage(msg)">
          
          <div class="px-3 py-2 rounded-2xl text-sm"
               [class.bg-blue-600]="isMyMessage(msg)"
               [class.bg-gray-700]="!isMyMessage(msg)"
               [class.rounded-tr-none]="isMyMessage(msg)"
               [class.rounded-tl-none]="!isMyMessage(msg)">
            {{ msg.content }}
          </div>
          <span class="text-[10px] text-gray-400 mt-1 px-1"
                [class.text-right]="isMyMessage(msg)">
             {{ msg.timestamp | date:'shortTime' }}
          </span>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-3 bg-gray-800 border-t border-gray-700">
        <form (ngSubmit)="sendMessage()" class="flex gap-2">
          <input type="text" 
                 [(ngModel)]="newMessage" 
                 name="message"
                 placeholder="Type a message..."
                 class="flex-1 bg-gray-700 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                 autocomplete="off">
          <button type="submit" 
                  [disabled]="!newMessage.trim()"
                  class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors">
            <i class="fas fa-paper-plane text-xs"></i>
          </button>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 2px; }
  `]
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
