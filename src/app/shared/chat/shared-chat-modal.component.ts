import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';

@Component({
    selector: 'app-shared-chat-modal',
    standalone: true,
    imports: [CommonModule, ChatComponent],
    template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300" (click)="closeModal()">
      <div class="bg-gray-900 w-full max-w-md h-[500px] sm:h-[600px] rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden flex flex-col transform transition-all scale-100" (click)="$event.stopPropagation()">
         <!-- Modal Header -->
         <div class="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700 shrink-0">
           <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-blue-500/20">
                <img *ngIf="participantImage" [src]="participantImage" class="w-full h-full object-cover">
                <span *ngIf="!participantImage" class="font-bold text-gray-400">{{ (participantName || '?') | slice:0:1 }}</span>
              </div>
              <div>
                 <h3 class="font-bold text-gray-100 text-sm md:text-base">Chat with {{ participantName }}</h3>
                 <span class="text-xs text-green-400 flex items-center gap-1.5 font-medium">
                   <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span> Online
                 </span>
              </div>
           </div>
           <button class="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-gray-400 transition-all duration-200" (click)="closeModal()">
             <i class="fa-solid fa-xmark text-lg"></i>
           </button>
         </div>
         
         <!-- Chat Content -->
         <div class="flex-1 overflow-hidden relative bg-gray-900">
           <app-chat *ngIf="appointmentId" [appointmentId]="appointmentId"></app-chat>
         </div>
      </div>
    </div>
  `
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
