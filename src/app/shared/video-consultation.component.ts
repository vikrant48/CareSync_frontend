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
import { ConfirmService } from '../core/services/confirm.service';
import { ModalShellComponent } from './ui/modal-shell.component';
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
  imports: [CommonModule, FormsModule, ModalShellComponent],
  host: {
    'class': 'block w-full h-[calc(100dvh-3.5rem)] overflow-hidden'
  },
  templateUrl: './video-consultation.component.html',
  styleUrl: './video-consultation.component.css'
})
export class VideoConsultationComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('previewVideo') previewVideoRef!: ElementRef<HTMLVideoElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public auth = inject(AuthService);
  private videoService = inject(VideoService);
  private confirm = inject(ConfirmService);
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

  activeDropdown: string | null = null;

  getSelectedCameraLabel(): string {
    const dev = this.videoDevices.find(d => d.deviceId === this.selectedCameraId);
    return dev?.label || 'Camera (Default)';
  }

  getSelectedMicLabel(): string {
    const dev = this.audioDevices.find(d => d.deviceId === this.selectedMicId);
    return dev?.label || 'Microphone (Default)';
  }

  selectCamera(deviceId: string) {
    this.selectedCameraId = deviceId;
    this.activeDropdown = null;
    this.onDeviceChange();
  }

  selectMic(deviceId: string) {
    this.selectedMicId = deviceId;
    this.activeDropdown = null;
    this.onDeviceChange();
  }

  formatDeviceLabel(label?: string, maxLength: number = 30): string {
    if (!label) return '';
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
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

  async endConsultation() {
    const ok = await this.confirm.ask({
      title: 'End consultation',
      message: 'Are you sure you want to end this consultation session for all participants?',
      confirmLabel: 'End session',
      cancelLabel: 'Stay',
      danger: true,
    });
    if (!ok) return;
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
