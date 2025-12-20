import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AppointmentService } from '../core/services/appointment.service';

declare var JitsiMeetExternalAPI: any;

@Component({
    standalone: true,
    selector: 'app-video-consultation',
    imports: [CommonModule],
    template: `
    <div class="h-full w-full flex flex-col bg-gray-900 border-l border-gray-800 animate-in fade-in duration-500 overflow-hidden relative">
      <!-- Session Header -->
      <div class="absolute top-0 left-0 right-0 z-20 px-6 py-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
        <div class="flex items-center gap-4 pointer-events-auto">
          <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <i class="fa-solid fa-video"></i>
          </div>
          <div>
            <h3 class="text-white font-bold tracking-tight">Consultation Session</h3>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span class="text-[10px] uppercase font-black tracking-widest text-white/60">Live Call</span>
            </div>
          </div>
        </div>
        <button (click)="goBack()" class="pointer-events-auto w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-95 group" title="Leave Call">
          <i class="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
        </button>
      </div>

      <!-- Jitsi Container -->
      <div #jitsiContainer class="flex-1 w-full bg-black"></div>

      <!-- Overlay if script not ready -->
      <div *ngIf="loading" class="absolute inset-0 z-30 bg-gray-950 flex flex-col items-center justify-center text-center p-10">
        <div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6 shadow-lg shadow-blue-500/20"></div>
        <h2 class="text-2xl font-black text-white mb-2">Connecting to Secure Server</h2>
        <p class="text-gray-400 text-sm max-w-xs">Initializing your private video consultation room. Please wait...</p>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class VideoConsultationComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('jitsiContainer') jitsiContainer!: ElementRef;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private auth = inject(AuthService);
    private apptApi = inject(AppointmentService);

    appointmentId: string | null = null;
    loading = true;
    api: any;

    private viewReady = false;
    private secureRoomId: string | null = null;

    ngOnInit() {
        this.appointmentId = this.route.snapshot.paramMap.get('id');
        this.loadAppointmentDetails();
    }

    loadAppointmentDetails() {
        if (!this.appointmentId) return;

        const isDoctor = this.auth.role() === 'DOCTOR';
        const obs: import('rxjs').Observable<any[]> = isDoctor ? this.apptApi.getDoctorAllAppointments() : this.apptApi.getMyAppointments();

        obs.subscribe({
            next: (list: any[]) => {
                const appt = list.find(a => a.appointmentId === Number(this.appointmentId));
                this.secureRoomId = appt?.videoRoomId || `CareSync_Room_${this.appointmentId}`;
                this.attemptInit();
            },
            error: (err: any) => {
                console.error('Error loading appointment details', err);
                this.goBack();
            }
        });
    }

    ngAfterViewInit() {
        this.viewReady = true;
        this.attemptInit();
    }

    private attemptInit() {
        if (this.viewReady && this.secureRoomId) {
            this.initJitsi(this.secureRoomId);
        }
    }

    initJitsi(roomNameOverride?: string) {
        if (!this.appointmentId || !this.jitsiContainer) {
            return;
        }

        const roomName = roomNameOverride || this.secureRoomId || `CareSync_Consultation_${this.appointmentId}`;
        const userName = this.auth.username() || (this.auth.role() === 'DOCTOR' ? 'Doctor' : 'Patient');

        const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: this.jitsiContainer.nativeElement,
            userInfo: { displayName: userName },
            configOverwrite: {
                startWithAudioMuted: false,
                disableDeepLinking: true,
                enableWelcomePage: false,
                prejoinPageEnabled: false
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'info', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ],
            }
        };

        if (typeof JitsiMeetExternalAPI !== 'undefined') {
            this.api = new JitsiMeetExternalAPI("meet.jit.si", options);
            this.loading = false;
            this.api.addEventListeners({
                readyToClose: () => this.goBack(),
                videoConferenceLeft: () => this.goBack()
            });
        } else {
            console.error('Jitsi Meet API not loaded, retrying...');
            setTimeout(() => this.initJitsi(roomName), 2000);
        }
    }

    goBack() {
        const role = this.auth.role()?.toLowerCase();
        this.router.navigate([role === 'doctor' ? '/doctor' : '/patient']);
    }

    ngOnDestroy() {
        if (this.api) {
            this.api.dispose();
        }
    }
}
