import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientAppointmentItem } from '../core/services/appointment.service';
import { PdfService } from '../core/services/pdf.service';

@Component({
  standalone: true,
  selector: 'patient-appointment-card',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="panel rounded-xl p-4 sm:p-5 transition hover:shadow-lg border border-gray-800 hover:border-blue-500/30 group" [class.opacity-60]="appointment.isActive === false">
      <div class="flex flex-col gap-4">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center font-bold text-blue-400 text-lg ring-2 ring-gray-700/50 group-hover:ring-blue-500/50 transition-all overflow-hidden relative">
              <img *ngIf="appointment.doctorProfileImageUrl" [src]="appointment.doctorProfileImageUrl" class="w-full h-full object-cover" alt="Doctor Profile">
              <span *ngIf="!appointment.doctorProfileImageUrl">{{ (appointment.doctorName || 'D') | slice:0:1 }}</span>
            </div>
            <div class="min-w-0">
              <h4 class="font-bold text-gray-800 dark:text-gray-100 truncate text-base leading-tight">
                {{ appointment.doctorName }}
                <span *ngIf="appointment.doctorIsVerified" class="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-black text-blue-400 uppercase tracking-tighter" title="Verified">
                  <i class="fa-solid fa-circle-check"></i>
                  <span>Verified</span>
                </span>
              </h4>
              <p class="text-sm text-gray-800 dark:text-gray-400 truncate">{{ appointment.doctorSpecialization }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="onDownloadReceipt()" 
                    class="p-2 text-gray-500 hover:text-green-600 hover:bg-green-100/50 dark:hover:bg-green-500/10 rounded-lg transition-colors border border-transparent hover:border-green-200 dark:hover:border-transparent" 
                    title="Download Receipt">
               <i class="fas fa-download"></i>
            </button>
            <span class="px-2.5 py-1 rounded-full text-[10px] dark:text-[10px] font-bold tracking-wider uppercase border" [ngClass]="statusClass(appointment)">
              {{ statusLabel(appointment) }}
            </span>
          </div>
        </div>

        <!-- Details -->
        <div class="bg-gray-400/50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2 border border-gray-800/50">
          <div class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300">
            <i class="fa-regular fa-calendar text-blue-400 w-4"></i>
            <span>{{ appointment.appointmentDate | date:'mediumDate' }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300">
            <i class="fa-regular fa-clock text-blue-400 w-4"></i>
            <span>{{ appointment.appointmentTime }}</span>
          </div>
          <div class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-300" *ngIf="appointment.reason">
            <i class="fa-regular fa-note-sticky text-gray-500 w-4 mt-0.5"></i>
            <span class="italic text-gray-400 text-xs">{{ appointment.reason }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
          <div class="flex flex-col gap-2 w-full" *ngIf="canJoinVideo(appointment)">
            <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              (click)="onJoinVideo()"
              [disabled]="disabled || appointment.isActive === false">
              <i class="fa-solid fa-video animate-pulse"></i> Join Video Call
            </button>
          </div>

          <button *ngIf="appointment.status === 'IN_PROGRESS'"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-sm transition-all active:scale-95 flex items-center justify-center gap-2 w-full"
            (click)="toggleChat()"
            [disabled]="disabled || appointment.isActive === false">
            <i class="fa-solid fa-comments"></i> Chat with Doctor
          </button>

          <button *ngIf="appointment.status === 'COMPLETED'"
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md text-xs transition-all active:scale-95 flex items-center justify-center gap-2 w-full"
            (click)="onDownloadPrescription()"
            [disabled]="disabled">
            <i class="fa-solid fa-file-pdf text-sm"></i> Download Prescription PDF
          </button>

          <button class="btn-primary flex-1 text-sm py-2" (click)="onViewDoctor()" [disabled]="disabled">
            Profile
          </button>
          <ng-container *ngIf="canPatientReschedule(appointment)">
            <button class="btn-secondary flex-1 text-sm py-2" (click)="onReschedule()" [disabled]="disabled || appointment.isActive === false">Reschedule</button>
            <button class="px-3 py-2 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-900/20 text-sm transition-colors" (click)="onCancel()" [disabled]="!canPatientCancel(appointment) || disabled || appointment.isActive === false" title="Cancel">
               <i class="fa-solid fa-ban"></i>
            </button>
          </ng-container>
        </div>
      </div>
    </div>
  `,
})
export class PatientAppointmentCardComponent {
  @Input() appointment!: PatientAppointmentItem;
  @Input() disabled = false;

  @Output() reschedule = new EventEmitter<PatientAppointmentItem>();
  @Output() cancel = new EventEmitter<PatientAppointmentItem>();
  @Output() viewDoctor = new EventEmitter<PatientAppointmentItem>();
  @Output() joinVideo = new EventEmitter<PatientAppointmentItem>();
  @Output() openChat = new EventEmitter<PatientAppointmentItem>();

  constructor(private pdfService: PdfService) { }

  onDownloadReceipt() {
    this.pdfService.generateAppointmentReceiptByBookingId(this.appointment.appointmentId, this.appointment);
  }

  onDownloadPrescription() {
    const medHistory = this.appointment.appointmentMedicalHistory
      || (this.appointment.medicalHistory
        ? this.appointment.medicalHistory.find((m: any) => m.appointmentId && Number(m.appointmentId) === Number(this.appointment.appointmentId))
        : null);

    const medicinesList: Array<{ name: string; dosage?: string; duration?: string; instructions?: string }> = [];

    if (medHistory?.medicine) {
      const medNames = String(medHistory.medicine).split(',').map((s: string) => s.trim()).filter(Boolean);
      const dosages = String(medHistory.doses || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      medNames.forEach((name: string, idx: number) => {
        medicinesList.push({
          name: name,
          dosage: dosages[idx] || (dosages.length === 1 ? dosages[0] : 'As prescribed'),
          duration: 'As directed'
        });
      });
    }

    this.pdfService.generatePrescriptionPdf({
      appointmentId: this.appointment.appointmentId,
      patientName: String(this.appointment.patientName),
      doctorName: String(this.appointment.doctorName),
      doctorSpecialization: String(this.appointment.doctorSpecialization),
      visitDate: `${this.appointment.appointmentDate} ${this.appointment.appointmentTime}`,
      symptoms: medHistory?.symptoms || this.appointment.reason || 'General Consultation',
      diagnosis: medHistory?.diagnosis || (medHistory ? 'Consultation Completed' : 'Completed Consultation Record'),
      medicines: medicinesList.length > 0 ? medicinesList : undefined,
      prescriptionNotes: medHistory?.notes || (medHistory?.treatment ? `Treatment Plan: ${medHistory.treatment}` : undefined),
      verificationUrl: `https://caresync.app/verify/prescription/${this.appointment.appointmentId}`
    });
  }

  get isUpcoming() {
    const s = (this.appointment.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'SCHEDULED' || s === 'CONFIRMED';
  }

  get showJoinButton() {
    const s = (this.appointment.status || '').toUpperCase();
    return s === 'CONFIRMED' || s === 'IN_PROGRESS';
  }

  onReschedule() {
    this.reschedule.emit(this.appointment);
  }

  onCancel() {
    this.cancel.emit(this.appointment);
  }

  onViewDoctor() {
    this.viewDoctor.emit(this.appointment);
  }

  onJoinVideo() {
    this.joinVideo.emit(this.appointment);
  }

  toggleChat() {
    this.openChat.emit(this.appointment);
  }

  statusClass(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();

    // Check for expired state first
    if (a.isActive === false && s !== 'COMPLETED' && !s.startsWith('CANCELLED')) {
      return 'bg-gray-200 text-gray-500 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 line-through decoration-gray-400';
    }

    return {
      'bg-blue-500/10 text-blue-400 border-blue-500/20': s === 'CONFIRMED',
      'bg-green-500/10 text-green-400 border-green-500/20': s === 'COMPLETED',
      'bg-red-500/10 text-red-400 border-red-500/20': s.startsWith('CANCELLED'),
      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': s === 'BOOKED',
      'bg-purple-500/10 text-purple-400 border-purple-500/20': s === 'SCHEDULED',
      'bg-orange-500/10 text-orange-400 border-orange-500/20': s === 'RESCHEDULED',
      'bg-gray-700 text-gray-300': !s,
    } as any;
  }

  statusLabel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();

    // Check for expired state first
    if (a.isActive === false && s !== 'COMPLETED' && !s.startsWith('CANCELLED')) {
      return 'Expired';
    }

    if (s === 'CANCELLED_BY_PATIENT') return 'Cancelled by Me';
    if (s === 'CANCELLED_BY_DOCTOR') return 'Cancelled by Doctor';
    if (s === 'CANCELLED') return 'Cancelled';
    return s;
  }

  canPatientReschedule(a: PatientAppointmentItem) {
    return (a.status || '').toUpperCase() === 'BOOKED';
  }

  canPatientCancel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'CONFIRMED';
  }

  canJoinVideo(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'CONFIRMED' || s === 'IN_PROGRESS';
  }
}
