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
  templateUrl: './doctor-appointment-card.component.html',
  styleUrl: './doctor-appointment-card.component.css'
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

  constructor(private pdfService: PdfService) { }

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
