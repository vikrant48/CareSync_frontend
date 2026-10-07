import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PatientAppointmentItem } from '../core/services/appointment.service';
import { PdfService } from '../core/services/pdf.service';
import { AppointmentApiService } from '../core/services/appointment-api.service';
import { StatusBadgeComponent } from './ui/status-badge.component';
import { VisitCompletionPreviewModalComponent } from '../features/doctor/visit-completion-preview-modal.component';
import { CompletionPreview } from '../core/models/appointment.models';

@Component({
  standalone: true,
  selector: 'patient-appointment-card',
  imports: [CommonModule, RouterModule, StatusBadgeComponent, VisitCompletionPreviewModalComponent],
  templateUrl: './patient-appointment-card.component.html',
  styleUrl: './patient-appointment-card.component.css'
})
export class PatientAppointmentCardComponent {
  private pdfService = inject(PdfService);
  private appointmentApiService = inject(AppointmentApiService);
  private router = inject(Router);

  @Input() appointment!: PatientAppointmentItem;
  @Input() disabled = false;

  @Output() reschedule = new EventEmitter<PatientAppointmentItem>();
  @Output() cancel = new EventEmitter<PatientAppointmentItem>();
  @Output() viewDoctor = new EventEmitter<PatientAppointmentItem>();
  @Output() joinVideo = new EventEmitter<PatientAppointmentItem>();
  @Output() openChat = new EventEmitter<PatientAppointmentItem>();
  @Output() giveFeedback = new EventEmitter<PatientAppointmentItem>();
  @Output() viewPrescription = new EventEmitter<PatientAppointmentItem>();

  showPreviewModal = false;
  previewModalData: CompletionPreview | null = null;

  onViewPrescription(event?: Event) {
    if (event) event.stopPropagation();
    const aptId = this.appointment.appointmentId;
    if (!aptId) return;

    this.viewPrescription.emit(this.appointment);
    this.appointmentApiService.getCompletionPreview(aptId).subscribe({
      next: (data) => {
        this.previewModalData = data;
        this.showPreviewModal = true;
      },
      error: (err) => {
        console.error('Failed to load completion preview, attempting fallback', err);
        this.loadFallbackPreview(aptId);
      }
    });
  }

  private loadFallbackPreview(aptId: number): void {
    this.appointmentApiService.getSoapDraft(aptId).subscribe({
      next: (soap: any) => {
        const medHistory = this.appointment?.appointmentMedicalHistory
          || (this.appointment?.medicalHistory
            ? this.appointment.medicalHistory.find((m: any) => m.appointmentId && Number(m.appointmentId) === Number(aptId))
            : null);

        this.previewModalData = {
          appointmentId: aptId,
          patientName: this.appointment?.patientName || 'Patient',
          patientAge: (this.appointment as any)?.patientAge,
          patientGender: (this.appointment as any)?.patientGender,
          intake: {
            chiefComplaint: soap?.chiefComplaint || this.appointment?.reason || 'Consultation',
            symptoms: soap?.symptoms || 'None specified',
            aiTriageSummary: soap?.notes
          },
          soapReport: soap,
          medicalHistory: medHistory ? {
            diagnosis: medHistory.diagnosis,
            treatment: medHistory.treatment,
            medicine: medHistory.medicine,
            doses: medHistory.doses
          } : {
            diagnosis: soap?.diagnosis || 'Completed',
            treatment: soap?.treatment,
            medicine: soap?.medicine,
            doses: soap?.doses
          },
          isReadyForSign: true,
          readinessReasons: []
        };
        this.showPreviewModal = true;
      },
      error: (e) => {
        console.error('Fallback preview failed', e);
      }
    });
  }

  onDownloadReceipt() {
    this.pdfService.generateAppointmentReceiptByBookingId(this.appointment.appointmentId, this.appointment);
  }

  onDownloadPrescription() {
    const aptId = this.appointment.appointmentId;
    if (!aptId) return;

    const medHistory = this.appointment.appointmentMedicalHistory
      || (this.appointment.medicalHistory
        ? this.appointment.medicalHistory.find((m: any) => m.appointmentId && Number(m.appointmentId) === Number(aptId))
        : null);

    this.appointmentApiService.getSoapDraft(aptId).subscribe({
      next: (soap: any) => {
        this.buildAndDownloadPdf(medHistory, soap);
      },
      error: () => {
        this.buildAndDownloadPdf(medHistory, null);
      }
    });
  }

  private buildAndDownloadPdf(medHistory: any, soap: any) {
    const aptId = this.appointment.appointmentId;
    const medicinesList: Array<{ name: string; dosage?: string; duration?: string; instructions?: string }> = [];

    const medString = medHistory?.medicine || soap?.medicine || '';
    const doseString = medHistory?.doses || soap?.doses || '';

    if (medString) {
      const medNames = String(medString).split(',').map((s: string) => s.trim()).filter(Boolean);
      const dosages = String(doseString).split(',').map((s: string) => s.trim()).filter(Boolean);
      medNames.forEach((name: string, idx: number) => {
        medicinesList.push({
          name: name,
          dosage: dosages[idx] || (dosages.length === 1 ? dosages[0] : 'As prescribed'),
          duration: 'As directed'
        });
      });
    }

    const soapReport = (soap && (soap.subjective || soap.objective || soap.assessment || soap.plan || soap.notes)) ? {
      subjective: soap.subjective || undefined,
      objective: soap.objective || undefined,
      assessment: soap.assessment || undefined,
      plan: soap.plan || undefined,
      notes: soap.notes || undefined
    } : undefined;

    this.pdfService.generatePrescriptionPdf({
      appointmentId: aptId,
      patientName: String(this.appointment.patientName || 'Patient'),
      doctorName: String(this.appointment.doctorName || 'Doctor'),
      doctorSpecialization: String(this.appointment.doctorSpecialization || ''),
      visitDate: `${this.appointment.appointmentDate || ''} ${this.appointment.appointmentTime || ''}`.trim(),
      symptoms: medHistory?.symptoms || soap?.symptoms || this.appointment.reason || 'General Consultation',
      diagnosis: medHistory?.diagnosis || soap?.diagnosis || (medHistory || soap ? 'Consultation Completed' : 'Completed Consultation Record'),
      medicines: medicinesList.length > 0 ? medicinesList : undefined,
      prescriptionNotes: medHistory?.notes || soap?.notes || (medHistory?.treatment || soap?.treatment ? `Treatment Plan: ${medHistory?.treatment || soap?.treatment}` : undefined),
      verificationUrl: `https://caresync.app/verify/prescription/${aptId}`,
      soapReport: soapReport
    });
  }

  get isUpcoming() {
    const s = (this.appointment.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'SCHEDULED' || s === 'CONFIRMED';
  }

  get canFillIntake(): boolean {
    const s = (this.appointment.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'CONFIRMED' || s === 'SCHEDULED';
  }

  get showJoinButton(): boolean {
    const s = (this.appointment.status || '').toUpperCase();
    return s === 'CONFIRMED' || s === 'READY_FOR_VISIT' || s === 'IN_PROGRESS' || s === 'INTAKE_COMPLETED';
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

  statusLabel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    if (a.isActive === false && s !== 'COMPLETED' && !s.startsWith('CANCELLED')) {
      return 'Expired';
    }
    if (s === 'CANCELLED_BY_PATIENT') return 'Cancelled by Me';
    if (s === 'CANCELLED_BY_DOCTOR') return 'Cancelled by Doctor';
    if (s === 'INTAKE_COMPLETED') return 'Intake Completed';
    if (s === 'READY_FOR_VISIT') return 'Ready for Visit';
    if (s === 'REPORT_DRAFTED') return 'Report Drafted';
    return s;
  }

  canPatientReschedule(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'CONFIRMED' || s === 'SCHEDULED';
  }

  canPatientCancel(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'BOOKED' || s === 'CONFIRMED' || s === 'SCHEDULED' || s === 'INTAKE_COMPLETED';
  }

  canJoinVideo(a: PatientAppointmentItem) {
    const s = (a.status || '').toUpperCase();
    return s === 'CONFIRMED' || s === 'READY_FOR_VISIT' || s === 'IN_PROGRESS' || s === 'INTAKE_COMPLETED';
  }
}
