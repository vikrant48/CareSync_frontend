import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorAppointmentItem } from '../core/services/appointment.service';
import { RouterModule } from '@angular/router';
import { PdfService } from '../core/services/pdf.service';
import { StatusBadgeComponent } from './ui/status-badge.component';

/**
 * Doctor appointment card — same shell language as patient-appointment-card;
 * actions stay role-specific.
 */
@Component({
  standalone: true,
  selector: 'doctor-appointment-card',
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  template: `
    <div
      class="ui-panel-hover p-4 sm:p-5 group animate-slide-up h-full flex flex-col"
      [class.opacity-60]="disabled || appointment.isActive === false"
      [class.pointer-events-none]="disabled"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold text-lg ring-2 ring-gray-200 dark:ring-gray-700/50 group-hover:ring-brand/40 transition-all overflow-hidden shrink-0">
            <img *ngIf="appointment.patientProfileImageUrl" [src]="appointment.patientProfileImageUrl" class="w-full h-full object-cover" [alt]="appointment.patientName" />
            <span *ngIf="!appointment.patientProfileImageUrl">{{ (appointment.patientName || 'P') | slice:0:1 }}</span>
          </div>
          <div class="min-w-0">
            <h4 class="font-bold text-gray-800 dark:text-gray-100 truncate text-base leading-tight">{{ appointment.patientName }}</h4>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span class="inline-flex items-center gap-1"><i class="fa-solid fa-calendar text-brand"></i>{{ appointment.appointmentDate }}</span>
              <span class="inline-flex items-center gap-1"><i class="fa-solid fa-clock text-brand"></i>{{ appointment.appointmentTime }}</span>
            </div>
          </div>
        </div>
        <app-status-badge [status]="appointment.status" [text]="statusLabel(appointment)"></app-status-badge>
      </div>

      <!-- Details -->
      <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-800/50 mb-4 flex-1">
        <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reason for visit</label>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2" [title]="appointment.reason || 'No reason provided'">
          {{ appointment.reason || 'No specific reason provided.' }}
        </p>
      </div>

      <!-- Actions (doctor-specific) -->
      <div class="pt-3 border-t border-gray-200 dark:border-gray-800 mt-auto flex flex-col gap-2">
        <div class="grid grid-cols-2 gap-2" *ngIf="appointment.status === 'BOOKED'">
          <button type="button" class="btn-secondary !bg-emerald-50 dark:!bg-emerald-900/10 !text-emerald-600 dark:!text-emerald-400 !border-emerald-100 dark:!border-emerald-900/30" (click)="onSchedule()" [disabled]="disabled">
            <i class="fa-solid fa-calendar-check"></i> Accept
          </button>
          <button type="button" class="btn-danger" (click)="onCancel()" [disabled]="disabled">
            <i class="fa-solid fa-xmark"></i> Decline
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2" *ngIf="appointment.status === 'SCHEDULED'">
          <button type="button" class="btn-secondary !bg-emerald-50 dark:!bg-emerald-900/10 !text-emerald-600 dark:!text-emerald-400 !border-emerald-100 dark:!border-emerald-900/30" (click)="onConfirm()" [disabled]="disabled">
            <i class="fa-solid fa-check-double"></i> Confirm
          </button>
          <button type="button" class="btn-danger" (click)="onCancel()" [disabled]="disabled">
            <i class="fa-solid fa-ban"></i> Cancel
          </button>
        </div>

        <button *ngIf="appointment.status === 'CONFIRMED'" type="button" class="btn-primary w-full" (click)="onStart()" [disabled]="disabled">
          <i class="fa-solid fa-stethoscope"></i> Start Consultation
        </button>

        <ng-container *ngIf="appointment.status === 'IN_PROGRESS'">
          <button type="button" class="btn-primary w-full" (click)="onCreateMedicalDescription()" [disabled]="disabled || appointment.isActive === false">
            <i class="fa-solid fa-file-signature"></i> {{ hasMedicalRecord ? 'Edit' : 'Add' }} Medical Record
          </button>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50" (click)="onJoinVideo()" [disabled]="disabled || appointment.isActive === false">
              <i class="fa-solid fa-video"></i> Join Video
            </button>
            <button type="button" class="btn-primary !bg-green-600 hover:!bg-green-700 w-full" (click)="onComplete()" [disabled]="disabled || appointment.isActive === false">
              <i class="fa-solid fa-check-circle"></i> Complete
            </button>
          </div>
          <button type="button" class="btn-secondary w-full" (click)="toggleChat()" [disabled]="disabled || appointment.isActive === false">
            <i class="fa-solid fa-comments"></i> Chat with Patient
          </button>
        </ng-container>

        <ng-container *ngIf="appointment.status === 'COMPLETED'">
          <div *ngIf="hasMedicalRecord; else noRecord" class="grid grid-cols-2 gap-2">
            <button type="button" class="btn-secondary" (click)="onCreateMedicalDescription()" [disabled]="disabled">
              <i class="fa-solid fa-eye"></i> Medical Record
            </button>
            <button type="button" class="btn-primary !bg-emerald-600 hover:!bg-emerald-700" (click)="onDownloadPrescription()" [disabled]="disabled">
              <i class="fa-solid fa-file-pdf"></i> Prescription
            </button>
          </div>
          <ng-template #noRecord>
            <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">No record</span>
              <button type="button" class="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !py-1.5 !min-h-0 text-xs" (click)="onDownloadPrescription()" [disabled]="disabled">
                <i class="fa-solid fa-file-pdf"></i> PDF Rx
              </button>
            </div>
          </ng-template>
        </ng-container>

        <button type="button" class="btn-secondary w-full" (click)="onViewPatient()" [disabled]="disabled">
          <i class="fa-solid fa-id-card"></i> View Patient Details
        </button>
      </div>
    </div>
  `,
})
export class DoctorAppointmentCardComponent {
  @Input() appointment!: DoctorAppointmentItem;
  @Input() disabled = false;
  @Input() showStatusSelect = true;

  @Output() viewPatient = new EventEmitter<DoctorAppointmentItem>();
  @Output() openHistoryForm = new EventEmitter<DoctorAppointmentItem>();
  @Output() schedule = new EventEmitter<DoctorAppointmentItem>();
  @Output() confirm = new EventEmitter<DoctorAppointmentItem>();
  @Output() start = new EventEmitter<DoctorAppointmentItem>();
  @Output() complete = new EventEmitter<DoctorAppointmentItem>();
  @Output() cancel = new EventEmitter<DoctorAppointmentItem>();
  @Output() joinVideo = new EventEmitter<DoctorAppointmentItem>();
  @Output() statusChange = new EventEmitter<{ appointment: DoctorAppointmentItem; status: string }>();
  @Output() openChat = new EventEmitter<DoctorAppointmentItem>();

  constructor(private pdfService: PdfService) {}

  onViewPatient() { this.viewPatient.emit(this.appointment); }
  onCreateMedicalDescription() { this.openHistoryForm.emit(this.appointment); }
  onSchedule() { this.schedule.emit(this.appointment); }
  onConfirm() { this.confirm.emit(this.appointment); }
  onStart() { this.start.emit(this.appointment); }
  onComplete() { this.complete.emit(this.appointment); }
  onCancel() { this.cancel.emit(this.appointment); }
  onJoinVideo() { this.joinVideo.emit(this.appointment); }
  changeStatus(appointment: DoctorAppointmentItem, status: string) { this.statusChange.emit({ appointment, status }); }
  toggleChat() { this.openChat.emit(this.appointment); }

  statusLabel(a: DoctorAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    if (a.isActive === false && s !== 'COMPLETED' && !s.startsWith('CANCELLED')) return 'Expired';
    if (s === 'CANCELLED_BY_DOCTOR') return 'Cancelled by Me';
    if (s === 'CANCELLED_BY_PATIENT') return 'Cancelled by Patient';
    if (s === 'CANCELLED') return 'Cancelled';
    return a.status;
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
      patientName: this.appointment.patientName,
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

  get hasMedicalRecord(): boolean {
    if (!this.appointment.medicalHistory) return false;
    const hasExplicitLink = this.appointment.medicalHistory.some(m =>
      m.appointmentId === this.appointment.appointmentId
    );
    if (hasExplicitLink) return true;
    const appointmentDate = this.appointment.appointmentDate;
    return this.appointment.medicalHistory.some(m => m.visitDate === appointmentDate);
  }
}
