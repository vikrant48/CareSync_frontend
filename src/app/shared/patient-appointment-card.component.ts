import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientAppointmentItem } from '../core/services/appointment.service';
import { PdfService } from '../core/services/pdf.service';
import { StatusBadgeComponent } from './ui/status-badge.component';

@Component({
  standalone: true,
  selector: 'patient-appointment-card',
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './patient-appointment-card.component.html',
  styleUrl: './patient-appointment-card.component.css'
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
