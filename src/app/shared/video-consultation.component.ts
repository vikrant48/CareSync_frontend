import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  LocalTrack,
  ConnectionQuality,
  Track,
  VideoQuality,
  VideoPresets,
  RoomOptions,
  DataPacket_Kind
} from 'livekit-client';
import { AuthService } from '../core/services/auth.service';
import { VideoService, VideoTokenResponse } from '../core/services/video.service';
import { Subscription, interval } from 'rxjs';

export interface ChatMessage {
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
}

@Component({
  standalone: true,
  selector: 'app-video-consultation',
  imports: [CommonModule, FormsModule],
  host: {
    'class': 'block w-full h-screen overflow-hidden'
  },
  template: `
    <div class="h-screen w-full flex flex-col bg-gray-950 text-white font-sans overflow-hidden relative select-none">
      
      <!-- Top Navigation Header -->
      <header class="absolute top-0 left-0 right-0 z-30 px-4 sm:px-6 py-3 bg-gradient-to-b from-gray-950/90 via-gray-950/50 to-transparent flex items-center justify-between pointer-events-none">
        <div class="flex items-center gap-3 pointer-events-auto">
          <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <i class="fa-solid fa-video text-lg"></i>
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              CareSync Consultation
              <span *ngIf="connected" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            </h2>
            <p class="text-xs text-gray-400 font-medium">Room: {{ roomName || 'Connecting...' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 pointer-events-auto">
          <!-- Connection Quality Badge -->
          <div *ngIf="connected" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800 text-xs text-gray-300">
            <i class="fa-solid fa-signal" [ngClass]="{
              'text-emerald-400': connectionQuality === 'excellent' || connectionQuality === 'good',
              'text-amber-400': connectionQuality === 'poor',
              'text-red-400': connectionQuality === 'lost'
            }"></i>
            <span class="capitalize text-[11px] font-medium">{{ connectionQuality }}</span>
          </div>

          <!-- Leave / Exit Button -->
          <button (click)="leaveConsultation()" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Exit</span>
          </button>
        </div>
      </header>

      <!-- PRE-CONSULTATION DEVICE LOBBY / WAITING ROOM (DOCTOR & PATIENT) -->
      <div *ngIf="isWaitingScreen" class="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 z-20 bg-gray-950">
        <div class="max-w-lg w-full bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden">
          
          <!-- Camera Preview Window -->
          <div class="w-full aspect-video bg-black rounded-2xl overflow-hidden relative border border-gray-800 shadow-inner mb-6 flex items-center justify-center">
            <video #previewVideo autoplay playsinline muted class="w-full h-full object-cover" [ngClass]="{'hidden': !cameraEnabled}"></video>
            <div *ngIf="!cameraEnabled" class="flex flex-col items-center justify-center text-gray-500">
              <i class="fa-solid fa-video-slash text-4xl mb-2"></i>
              <span class="text-xs font-medium">Camera Off</span>
            </div>

            <!-- Preview Control Toggles -->
            <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-800">
              <button (click)="togglePreviewMic()" class="w-9 h-9 rounded-full flex items-center justify-center transition-colors" [ngClass]="micEnabled ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500 text-white'">
                <i class="fa-solid" [ngClass]="micEnabled ? 'fa-microphone' : 'fa-microphone-slash'"></i>
              </button>
              <button (click)="togglePreviewCamera()" class="w-9 h-9 rounded-full flex items-center justify-center transition-colors" [ngClass]="cameraEnabled ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500 text-white'">
                <i class="fa-solid" [ngClass]="cameraEnabled ? 'fa-video' : 'fa-video-slash'"></i>
              </button>
            </div>
          </div>

          <!-- Doctor Lobby Card -->
          <div *ngIf="auth.role() === 'DOCTOR'" class="w-full bg-blue-950/40 border border-blue-800/40 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <i class="fa-solid fa-user-doctor text-lg"></i>
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-bold text-white mb-1">Doctor Pre-Consultation Lobby</h4>
              <p class="text-xs text-gray-300 leading-relaxed">
                Verify your camera and microphone below, then click below to launch the video room.
              </p>
            </div>
          </div>

          <!-- Patient Waiting Status Card -->
          <div *ngIf="auth.role() !== 'DOCTOR'" class="w-full bg-blue-950/40 border border-blue-800/40 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <i class="fa-solid fa-clock text-lg animate-spin"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white mb-1">Waiting for your Doctor...</h4>
              <p class="text-xs text-gray-300 leading-relaxed">
                Your doctor will join the consultation room shortly. Please check your camera and microphone settings above while waiting.
              </p>
            </div>
          </div>

          <!-- Hardware Device Selection Controls for BOTH Doctor and Patient -->
          <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <div>
              <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Camera Device</label>
              <select [(ngModel)]="selectedCameraId" (change)="onDeviceChange()" class="w-full bg-gray-950 border border-gray-800 text-xs text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500">
                <option *ngFor="let dev of videoDevices" [value]="dev.deviceId">{{ dev.label || 'Camera (' + dev.deviceId.substring(0,5) + ')' }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Microphone Device</label>
              <select [(ngModel)]="selectedMicId" (change)="onDeviceChange()" class="w-full bg-gray-950 border border-gray-800 text-xs text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500">
                <option *ngFor="let dev of audioDevices" [value]="dev.deviceId">{{ dev.label || 'Microphone (' + dev.deviceId.substring(0,5) + ')' }}</option>
              </select>
            </div>
          </div>

          <!-- Join / Launch & Cancel Action Buttons (MS Teams Style) -->
          <div class="w-full flex flex-col sm:flex-row items-center gap-3">
            <button (click)="connectToRoom()" class="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-98 flex items-center justify-center gap-2">
              <i class="fa-solid fa-video"></i>
              <span>{{ auth.role() === 'DOCTOR' ? 'Launch Consultation Room' : 'Join Consultation Room' }}</span>
            </button>

            <button (click)="leaveConsultation()" class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 hover:text-white border border-gray-700/80 font-semibold text-xs sm:text-sm transition-all active:scale-98 flex items-center justify-center gap-2">
              <i class="fa-solid fa-xmark"></i>
              <span>Cancel</span>
            </button>
          </div>

          <div *ngIf="auth.role() !== 'DOCTOR'" class="flex items-center justify-center gap-2 text-xs text-gray-400 mt-3">
            <span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            <span>Checking doctor availability every 4 seconds...</span>
          </div>

        </div>
      </div>

      <!-- MAIN VIDEO CALL CONTAINER -->
      <div *ngIf="!isWaitingScreen" class="flex-1 w-full h-full relative bg-gray-950 flex flex-col md:flex-row overflow-hidden">
        
        <!-- Video Canvas Grid -->
        <div class="flex-1 h-full relative bg-gray-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          
          <!-- Remote Video (Full Container) -->
          <div class="w-full h-full rounded-2xl overflow-hidden bg-gray-900 border border-gray-800/80 shadow-2xl relative flex items-center justify-center">
            
            <video #remoteVideo autoplay playsinline class="w-full h-full object-cover" [ngClass]="{'hidden': !hasRemoteVideo}"></video>
            
            <!-- Full-Screen Demo User Profile when Camera is Off or Waiting -->
            <div *ngIf="!hasRemoteVideo" class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 relative overflow-hidden">
              
              <!-- Subtle Background Glow Effects -->
              <div class="absolute w-96 h-96 rounded-full bg-blue-600/10 blur-3xl -top-20 -left-20 pointer-events-none"></div>
              <div class="absolute w-96 h-96 rounded-full bg-purple-600/10 blur-3xl -bottom-20 -right-20 pointer-events-none"></div>

              <!-- Main Profile Card Container -->
              <div class="relative z-10 flex flex-col items-center max-w-sm w-full bg-gray-900/60 border border-gray-800/80 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
                
                <!-- Avatar with Animated Glowing Ring -->
                <div class="relative mb-6">
                  <div class="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 blur-sm opacity-70 animate-pulse"></div>
                  <div class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-2xl ring-4 ring-gray-900">
                    <i class="fa-solid fa-user-doctor" *ngIf="auth.role() === 'PATIENT'"></i>
                    <i class="fa-solid fa-user-injured" *ngIf="auth.role() === 'DOCTOR'"></i>
                  </div>
                  <!-- Status Indicator Badge -->
                  <div class="absolute bottom-1 right-1 w-7 h-7 rounded-full border-3 border-gray-900 flex items-center justify-center text-xs shadow-md" [ngClass]="hasRemoteParticipant ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'">
                    <i class="fa-solid" [ngClass]="hasRemoteParticipant ? 'fa-video-slash' : 'fa-clock'"></i>
                  </div>
                </div>

                <!-- Role Badge -->
                <span class="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 mb-3">
                  {{ auth.role() === 'PATIENT' ? 'Attending Physician' : 'Patient' }}
                </span>

                <!-- Participant Name -->
                <h3 class="text-xl sm:text-2xl font-black text-white mb-1 tracking-tight">
                  {{ remoteParticipantName || 'Waiting for Participant...' }}
                </h3>
                
                <!-- Status Description -->
                <p class="text-xs text-gray-400 font-medium mb-6">
                  {{ hasRemoteParticipant ? 'Camera is currently turned off' : 'Waiting for participant to join room...' }}
                </p>

                <!-- Audio Waveform Visualizer Indicator when participant connected -->
                <div *ngIf="hasRemoteParticipant" class="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-950/80 border border-gray-800/80 text-xs font-semibold text-emerald-400 shadow-inner">
                  <span class="flex items-end gap-1 h-3">
                    <span class="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] h-2"></span>
                    <span class="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms] h-3"></span>
                    <span class="w-1 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] h-1.5"></span>
                  </span>
                  <span class="text-[11px] font-bold text-gray-300">Audio Active</span>
                </div>

              </div>
            </div>

            <!-- Remote Participant Name Tag Overlay when Video is Live -->
            <div *ngIf="hasRemoteParticipant && hasRemoteVideo" class="absolute bottom-4 left-4 bg-gray-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-800 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
              <i class="fa-solid fa-circle text-[8px] text-emerald-400"></i>
              <span>{{ remoteParticipantName }}</span>
            </div>
          </div>

          <!-- Local Video PIP (Picture-in-Picture Floating Window) -->
          <div class="absolute bottom-20 sm:bottom-24 right-4 sm:right-6 w-32 sm:w-44 aspect-video rounded-2xl overflow-hidden bg-gray-900 border-2 border-gray-700/80 shadow-2xl z-20 transition-all hover:scale-105">
            <video #localVideo autoplay playsinline muted class="w-full h-full object-cover" [ngClass]="{'hidden': !cameraEnabled}"></video>
            
            <!-- Local User Demo Profile Card when Camera is Off -->
            <div *ngIf="!cameraEnabled" class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 text-gray-300 p-2 text-center relative border border-gray-800/50">
              <div class="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold mb-1 shadow-sm">
                <i class="fa-solid fa-user"></i>
              </div>
              <span class="text-[10px] font-bold text-white tracking-wide">You</span>
              <span class="text-[8px] font-medium text-red-400 flex items-center gap-1 mt-0.5">
                <i class="fa-solid fa-video-slash text-[7px]"></i> Off
              </span>
            </div>
            
            <div *ngIf="cameraEnabled" class="absolute bottom-1.5 left-1.5 bg-gray-950/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              You
            </div>
          </div>

          <!-- Reconnecting Toast Overlay -->
          <div *ngIf="isReconnecting" class="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-gray-950 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 font-bold text-xs">
            <i class="fa-solid fa-rotate animate-spin"></i>
            <span>Network unstable. Reconnecting...</span>
          </div>

        </div>

        <!-- In-Call Floating Control Toolbar -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 bg-gray-900/90 backdrop-blur-xl px-4 py-2.5 rounded-full border border-gray-800 shadow-2xl">
          
          <!-- Mic Toggle -->
          <button (click)="toggleMicrophone()" class="w-10 sm:w-11 h-10 sm:h-11 rounded-full flex items-center justify-center transition-all active:scale-95" [ngClass]="micEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'" [title]="micEnabled ? 'Mute Mic' : 'Unmute Mic'">
            <i class="fa-solid text-sm sm:text-base" [ngClass]="micEnabled ? 'fa-microphone' : 'fa-microphone-slash'"></i>
          </button>

          <!-- Camera Toggle -->
          <button (click)="toggleCamera()" class="w-10 sm:w-11 h-10 sm:h-11 rounded-full flex items-center justify-center transition-all active:scale-95" [ngClass]="cameraEnabled ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'" [title]="cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'">
            <i class="fa-solid text-sm sm:text-base" [ngClass]="cameraEnabled ? 'fa-video' : 'fa-video-slash'"></i>
          </button>

          <!-- Screen Share Toggle -->
          <button (click)="toggleScreenShare()" class="w-10 sm:w-11 h-10 sm:h-11 rounded-full flex items-center justify-center transition-all active:scale-95" [ngClass]="screenShareEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'" title="Share Screen">
            <i class="fa-solid fa-desktop text-sm sm:text-base"></i>
          </button>

          <!-- Device Settings Picker Modal Toggle -->
          <button (click)="showDeviceModal = !showDeviceModal" class="w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-all active:scale-95" title="Audio/Video Settings">
            <i class="fa-solid fa-gear text-sm sm:text-base"></i>
          </button>

          <!-- Chat Toggle -->
          <button (click)="showChat = !showChat" class="w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-all active:scale-95 relative" title="In-call Chat">
            <i class="fa-solid fa-comments text-sm sm:text-base"></i>
            <span *ngIf="unreadChatCount > 0" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-gray-900">
              {{ unreadChatCount }}
            </span>
          </button>

          <div class="h-6 w-px bg-gray-800 mx-1"></div>

          <!-- Doctor: End Consultation Button -->
          <button *ngIf="auth.role() === 'DOCTOR'" (click)="endConsultation()" class="px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95" title="End Consultation for both participants">
            <i class="fa-solid fa-phone-slash"></i>
            <span class="hidden sm:inline">End Consultation</span>
          </button>

          <!-- Patient / General Leave Button -->
          <button *ngIf="auth.role() !== 'DOCTOR'" (click)="leaveConsultation()" class="w-10 sm:w-11 h-10 sm:h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all active:scale-95" title="Leave Consultation">
            <i class="fa-solid fa-phone-slash text-sm sm:text-base"></i>
          </button>
        </div>

        <!-- In-Call Chat Drawer -->
        <div *ngIf="showChat" class="w-full md:w-80 h-72 md:h-full bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col z-20 shadow-2xl">
          <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/50">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <i class="fa-solid fa-comments text-blue-400"></i>
              Consultation Chat
            </h4>
            <button (click)="showChat = false" class="text-gray-400 hover:text-white text-sm">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Chat Messages Scroll Area -->
          <div class="flex-1 p-3 overflow-y-auto space-y-3">
            <div *ngFor="let msg of messages" [ngClass]="msg.isSelf ? 'text-right' : 'text-left'">
              <div class="inline-block max-w-[85%] text-xs p-2.5 rounded-2xl" [ngClass]="msg.isSelf ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'">
                <div class="text-[9px] font-bold text-white/70 mb-0.5">{{ msg.senderName }}</div>
                <div class="leading-relaxed break-words">{{ msg.text }}</div>
                <div class="text-[8px] text-white/50 text-right mt-1">{{ msg.timestamp }}</div>
              </div>
            </div>
            <div *ngIf="messages.length === 0" class="text-center text-xs text-gray-500 mt-10">
              No messages yet. Send a message to start chatting!
            </div>
          </div>

          <!-- Chat Input -->
          <div class="p-3 border-t border-gray-800 bg-gray-950">
            <form (ngSubmit)="sendChatMessage()" class="flex items-center gap-2">
              <input type="text" [(ngModel)]="chatInput" name="chatInput" placeholder="Type a message..." class="flex-1 bg-gray-900 border border-gray-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500" />
              <button type="submit" [disabled]="!chatInput.trim()" class="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors">
                <i class="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </form>
          </div>
        </div>

        <!-- Audio / Video Settings Modal -->
        <div *ngIf="showDeviceModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-white">Media Device Settings</h3>
              <button (click)="showDeviceModal = false" class="text-gray-400 hover:text-white">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">Camera Device</label>
                <select [(ngModel)]="selectedCameraId" (change)="onDeviceChange()" class="w-full bg-gray-950 border border-gray-800 text-xs text-white rounded-xl p-2.5">
                  <option *ngFor="let dev of videoDevices" [value]="dev.deviceId">{{ dev.label || 'Camera' }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">Microphone Device</label>
                <select [(ngModel)]="selectedMicId" (change)="onDeviceChange()" class="w-full bg-gray-950 border border-gray-800 text-xs text-white rounded-xl p-2.5">
                  <option *ngFor="let dev of audioDevices" [value]="dev.deviceId">{{ dev.label || 'Microphone' }}</option>
                </select>
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <button (click)="showDeviceModal = false" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">Done</button>
            </div>
          </div>
        </div>

      </div>

      <!-- High-Visibility Toast Banner Modal for Early / Expired Consultation Error -->
      <div *ngIf="showToastError" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
        <div class="max-w-md w-full bg-gray-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
          
          <div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mb-4 shadow-lg">
            <i class="fa-solid fa-clock-rotate-left" *ngIf="toastErrorMessage?.includes('scheduled')"></i>
            <i class="fa-solid fa-calendar-xmark" *ngIf="!toastErrorMessage?.includes('scheduled')"></i>
          </div>

          <h3 class="text-base sm:text-lg font-bold text-white mb-2">Consultation Room Access Restricted</h3>
          
          <p class="text-xs text-gray-300 leading-relaxed mb-6 bg-gray-950/60 p-4 rounded-2xl border border-gray-800">
            {{ toastErrorMessage }}
          </p>

          <div class="flex items-center gap-3 w-full">
            <button (click)="goBack()" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              <i class="fa-solid fa-arrow-left mr-1.5"></i>
              Return to Dashboard
            </button>
            <button (click)="showToastError = false" class="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all">
              Dismiss
            </button>
          </div>

        </div>
      </div>

      <!-- Loading / Connecting Overlay -->
      <div *ngIf="loading && !showToastError" class="absolute inset-0 z-40 bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <div class="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-blue-500/20"></div>
        <h3 class="text-lg font-bold text-white mb-1">Securing LiveKit Connection</h3>
        <p class="text-xs text-gray-400 max-w-xs">{{ loadingStatusText }}</p>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class VideoConsultationComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('previewVideo') previewVideoRef!: ElementRef<HTMLVideoElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public auth = inject(AuthService);
  private videoService = inject(VideoService);
  private zone = inject(NgZone);

  appointmentId: string | null = null;
  roomName: string = '';
  loading = true;
  loadingStatusText = 'Authenticating video consultation permissions...';

  // LiveKit Room instance
  room?: Room;
  connected = false;
  isWaitingScreen = false;
  isReconnecting = false;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'lost' = 'excellent';

  // Controls state
  micEnabled = true;
  cameraEnabled = true;
  screenShareEnabled = false;

  // Track attachments
  hasRemoteParticipant = false;
  hasRemoteVideo = false;
  remoteParticipantName = '';

  // Devices & Preview
  videoDevices: MediaDeviceInfo[] = [];
  audioDevices: MediaDeviceInfo[] = [];
  selectedCameraId: string = '';
  selectedMicId: string = '';
  previewStream?: MediaStream;
  showDeviceModal = false;

  // In-call Chat
  showChat = false;
  chatInput = '';
  messages: ChatMessage[] = [];
  unreadChatCount = 0;

  // Polling subscription for patient waiting screen
  private pollSub?: Subscription;

  ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('id');
    if (!this.appointmentId) {
      this.goBack();
      return;
    }
    this.initDevices();
    this.startFlow();
  }

  async initDevices() {
    await this.startPreviewCamera();
  }

  startFlow() {
    this.loading = false;
    this.isWaitingScreen = true;
    this.startPreviewCamera();

    const isDoctor = this.auth.role() === 'DOCTOR';
    const apptId = Number(this.appointmentId);

    if (!isDoctor) {
      // Patient checks doctor status and polls presence
      this.pollSub = interval(4000).subscribe(() => {
        this.videoService.getVideoStatus(apptId).subscribe({
          next: (status) => {
            if (status.doctorInRoom && this.isWaitingScreen && !this.loading) {
              this.pollSub?.unsubscribe();
              this.stopPreviewCamera();
              this.connectToRoom();
            }
          }
        });
      });
    }
  }

  async startPreviewCamera() {
    try {
      if (this.previewStream) {
        this.previewStream.getTracks().forEach(t => t.stop());
        this.previewStream = undefined;
      }

      const constraints: MediaStreamConstraints = {
        video: this.selectedCameraId && this.selectedCameraId !== '' ? { deviceId: { exact: this.selectedCameraId } } : true,
        audio: this.selectedMicId && this.selectedMicId !== '' ? { deviceId: { exact: this.selectedMicId } } : true
      };

      try {
        this.previewStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Fallback to default media constraints:', err);
        this.previewStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      // Enumerate devices AFTER getUserMedia grants permission so labels are populated!
      await this.refreshDevices();

      // Apply mic & camera toggle states to stream tracks
      this.previewStream.getAudioTracks().forEach(t => t.enabled = this.micEnabled);
      this.previewStream.getVideoTracks().forEach(t => t.enabled = this.cameraEnabled);

      this.zone.run(() => {
        setTimeout(() => {
          if (this.previewVideoRef?.nativeElement && this.previewStream) {
            this.previewVideoRef.nativeElement.srcObject = this.previewStream;
          }
        }, 100);
      });
    } catch (e) {
      console.warn('Could not start preview camera:', e);
    }
  }

  async refreshDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.zone.run(() => {
        this.videoDevices = devices.filter(d => d.kind === 'videoinput');
        this.audioDevices = devices.filter(d => d.kind === 'audioinput');
        if (!this.selectedCameraId && this.videoDevices.length > 0) {
          this.selectedCameraId = this.videoDevices[0].deviceId;
        }
        if (!this.selectedMicId && this.audioDevices.length > 0) {
          this.selectedMicId = this.audioDevices[0].deviceId;
        }
      });
    } catch (e) {
      console.warn('Error refreshing media devices:', e);
    }
  }

  stopPreviewCamera() {
    if (this.previewStream) {
      this.previewStream.getTracks().forEach(t => t.stop());
      this.previewStream = undefined;
    }
  }

  async togglePreviewMic() {
    this.micEnabled = !this.micEnabled;
    if (!this.micEnabled) {
      if (this.previewStream) {
        this.previewStream.getAudioTracks().forEach(t => {
          t.stop();
          this.previewStream?.removeTrack(t);
        });
      }
    } else {
      try {
        const constraints: any = this.selectedMicId && this.selectedMicId !== ''
          ? { deviceId: { exact: this.selectedMicId } }
          : true;
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          if (!this.previewStream) {
            this.previewStream = new MediaStream();
          }
          this.previewStream.addTrack(audioTrack);
        }
      } catch (e) {
        console.warn('Error re-enabling preview microphone:', e);
        this.micEnabled = false;
      }
    }
  }

  async togglePreviewCamera() {
    this.cameraEnabled = !this.cameraEnabled;
    if (!this.cameraEnabled) {
      // Completely stop video tracks to release camera hardware and turn off camera LED light
      if (this.previewStream) {
        this.previewStream.getVideoTracks().forEach(t => {
          t.stop();
          this.previewStream?.removeTrack(t);
        });
      }
    } else {
      // Re-acquire camera stream track and turn camera hardware back on
      try {
        const constraints: any = this.selectedCameraId && this.selectedCameraId !== ''
          ? { deviceId: { exact: this.selectedCameraId } }
          : true;
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: constraints });
        const videoTrack = videoStream.getVideoTracks()[0];
        if (videoTrack) {
          if (!this.previewStream) {
            this.previewStream = new MediaStream();
          }
          this.previewStream.addTrack(videoTrack);
        }
        this.zone.run(() => {
          setTimeout(() => {
            if (this.previewVideoRef?.nativeElement && this.previewStream) {
              this.previewVideoRef.nativeElement.srcObject = this.previewStream;
            }
          }, 100);
        });
      } catch (e) {
        console.warn('Error re-enabling preview camera:', e);
        this.cameraEnabled = false;
      }
    }
  }

  // Toast error state for early/expired join warnings
  toastErrorMessage: string | null = null;
  showToastError = false;

  connectToRoom() {
    const apptId = Number(this.appointmentId);
    this.loading = true;
    this.loadingStatusText = 'Authenticating LiveKit access token...';
    this.showToastError = false;

    this.videoService.getVideoToken(apptId).subscribe({
      next: async (tokenData: VideoTokenResponse) => {
        try {
          this.zone.run(() => {
            this.roomName = tokenData.roomName;
          });
          await this.joinLiveKitRoom(tokenData.url, tokenData.token);
        } catch (e: any) {
          console.error('Failed to join LiveKit room:', e);
          this.zone.run(() => {
            this.loading = false;
            this.toastErrorMessage = 'Failed to connect to video room: ' + (e?.message || e);
            this.showToastError = true;
          });
        }
      },
      error: (err) => {
        console.error('Token request error:', err);
        const errorMsg = err?.error?.error || err?.error?.message || 'Unable to join consultation room.';
        this.zone.run(() => {
          this.loading = false;
          this.toastErrorMessage = errorMsg;
          this.showToastError = true;
        });
      }
    });
  }

  async joinLiveKitRoom(url: string, token: string) {
    const roomOptions: RoomOptions = {
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
        deviceId: this.selectedCameraId || undefined
      },
      audioCaptureDefaults: {
        deviceId: this.selectedMicId || undefined
      }
    };

    this.room = new Room(roomOptions);
    this.setupRoomEventListeners();

    this.loadingStatusText = 'Connecting to WebRTC media server...';
    await this.room.connect(url, token);

    this.zone.run(() => {
      this.connected = true;
      this.loading = false;
      this.isWaitingScreen = false;
      this.stopPreviewCamera();
    });

    // Publish local camera & mic according to pre-join toggles
    try {
      if (this.cameraEnabled) {
        await this.room.localParticipant.setCameraEnabled(true, this.selectedCameraId ? { deviceId: this.selectedCameraId } : undefined);
      } else {
        await this.room.localParticipant.setCameraEnabled(false);
      }

      if (this.micEnabled) {
        await this.room.localParticipant.setMicrophoneEnabled(true, this.selectedMicId ? { deviceId: this.selectedMicId } : undefined);
      } else {
        await this.room.localParticipant.setMicrophoneEnabled(false);
      }

      // Attach local video track
      const localVidPub = Array.from(this.room.localParticipant.videoTrackPublications.values())[0] as any;
      if (localVidPub && localVidPub.track) {
        setTimeout(() => {
          if (this.localVideoRef?.nativeElement) {
            localVidPub.track.attach(this.localVideoRef.nativeElement);
          }
        }, 300);
      }
    } catch (e) {
      console.warn('Error publishing local tracks:', e);
    }

    // Check existing participants
    this.room.remoteParticipants.forEach((participant: RemoteParticipant) => {
      this.handleParticipantConnected(participant);
    });
  }

  setupRoomEventListeners() {
    if (!this.room) return;

    this.room
      .on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
        this.zone.run(() => this.handleParticipantConnected(p));
      })
      .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
        this.zone.run(() => {
          this.hasRemoteParticipant = false;
          this.hasRemoteVideo = false;
          this.remoteParticipantName = '';
        });
      })
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        this.zone.run(() => {
          if (track.kind === Track.Kind.Video) {
            this.hasRemoteVideo = true;
            setTimeout(() => {
              if (this.remoteVideoRef?.nativeElement) {
                track.attach(this.remoteVideoRef.nativeElement);
              }
            }, 200);
          } else if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            document.body.appendChild(el);
          }
        });
      })
      .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        this.zone.run(() => {
          if (track.kind === Track.Kind.Video) {
            this.hasRemoteVideo = false;
          }
          const attachedEls = track.detach();
          attachedEls.forEach((el: HTMLElement) => el.remove());
        });
      })
      .on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality) => {
        this.zone.run(() => {
          if (quality === ConnectionQuality.Excellent) this.connectionQuality = 'excellent';
          else if (quality === ConnectionQuality.Good) this.connectionQuality = 'good';
          else if (quality === ConnectionQuality.Poor) this.connectionQuality = 'poor';
          else this.connectionQuality = 'lost';
        });
      })
      .on(RoomEvent.Reconnecting, () => {
        this.zone.run(() => this.isReconnecting = true);
      })
      .on(RoomEvent.Reconnected, () => {
        this.zone.run(() => this.isReconnecting = false);
      })
      .on(RoomEvent.Disconnected, () => {
        this.zone.run(() => this.leaveConsultation());
      })
      .on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        this.zone.run(() => {
          try {
            const str = new TextDecoder().decode(payload);
            const data = JSON.parse(str);
            const msg: ChatMessage = {
              senderName: participant?.name || participant?.identity || 'Participant',
              senderRole: 'REMOTE',
              text: data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSelf: false
            };
            this.messages.push(msg);
            if (!this.showChat) {
              this.unreadChatCount++;
            }
          } catch (e) {
            console.warn('Error parsing received data channel message:', e);
          }
        });
      });
  }

  handleParticipantConnected(participant: RemoteParticipant) {
    this.hasRemoteParticipant = true;
    this.remoteParticipantName = participant.name || participant.identity;

    participant.videoTrackPublications.forEach((pub: RemoteTrackPublication) => {
      if (pub.isSubscribed && pub.track) {
        this.hasRemoteVideo = true;
        setTimeout(() => {
          if (this.remoteVideoRef?.nativeElement) {
            pub.track?.attach(this.remoteVideoRef.nativeElement);
          }
        }, 200);
      }
    });
  }

  async toggleMicrophone() {
    if (!this.room) return;
    this.micEnabled = !this.micEnabled;
    await this.room.localParticipant.setMicrophoneEnabled(this.micEnabled);
  }

  async toggleCamera() {
    if (!this.room) return;
    this.cameraEnabled = !this.cameraEnabled;
    await this.room.localParticipant.setCameraEnabled(this.cameraEnabled);

    if (this.cameraEnabled) {
      const localVidPub = Array.from(this.room.localParticipant.videoTrackPublications.values())[0];
      if (localVidPub && localVidPub.track) {
        setTimeout(() => {
          if (this.localVideoRef?.nativeElement) {
            localVidPub.track?.attach(this.localVideoRef.nativeElement);
          }
        }, 200);
      }
    }
  }

  async toggleScreenShare() {
    if (!this.room) return;
    try {
      this.screenShareEnabled = !this.screenShareEnabled;
      await this.room.localParticipant.setScreenShareEnabled(this.screenShareEnabled);
    } catch (e) {
      console.warn('Error toggling screen share:', e);
      this.screenShareEnabled = false;
    }
  }

  async onDeviceChange() {
    if (this.room) {
      if (this.selectedCameraId) {
        await this.room.switchActiveDevice('videoinput', this.selectedCameraId);
      }
      if (this.selectedMicId) {
        await this.room.switchActiveDevice('audioinput', this.selectedMicId);
      }
    } else if (this.isWaitingScreen) {
      this.startPreviewCamera();
    }
  }

  sendChatMessage() {
    if (!this.chatInput.trim() || !this.room) return;
    const text = this.chatInput.trim();
    this.chatInput = '';

    const payload = JSON.stringify({ text });
    const encoded = new TextEncoder().encode(payload);

    this.room.localParticipant.publishData(encoded, { reliable: true });

    const selfMsg: ChatMessage = {
      senderName: 'You',
      senderRole: this.auth.role() || 'USER',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };
    this.messages.push(selfMsg);
  }

  endConsultation() {
    if (!confirm('Are you sure you want to end this consultation session for all participants?')) {
      return;
    }
    const apptId = Number(this.appointmentId);
    this.videoService.endVideoConsultation(apptId).subscribe({
      next: () => {
        this.cleanUp();
        this.goBack();
      },
      error: (err) => {
        console.error('Error ending consultation:', err);
        this.cleanUp();
        this.goBack();
      }
    });
  }

  leaveConsultation() {
    this.cleanUp();
    this.goBack();
  }

  goBack() {
    const role = this.auth.role()?.toLowerCase();
    this.router.navigate([role === 'doctor' ? '/doctor' : '/patient']);
  }

  cleanUp() {
    this.pollSub?.unsubscribe();
    this.stopPreviewCamera();
    if (this.room) {
      this.room.disconnect();
      this.room = undefined;
    }
    this.connected = false;
  }

  ngOnDestroy() {
    this.cleanUp();
  }
}
