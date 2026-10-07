import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorAppointmentItem } from '../core/services/appointment.service';
import { Router, RouterModule } from '@angular/router';
import { PdfService } from '../core/services/pdf.service';
import { AppointmentApiService } from '../core/services/appointment-api.service';
import { StatusBadgeComponent } from './ui/status-badge.component';
import { VisitCompletionPreviewModalComponent } from '../features/doctor/visit-completion-preview-modal.component';
import { CompletionPreview } from '../core/models/appointment.models';

/**
 * Doctor appointment card — same shell language as patient-appointment-card;
 * actions stay role-specific.
 */
@Component({
  standalone: true,
  selector: 'doctor-appointment-card',
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, VisitCompletionPreviewModalComponent],
  templateUrl: './doctor-appointment-card.component.html',
  styleUrl: './doctor-appointment-card.component.css'
})
export class DoctorAppointmentCardComponent {
  private pdfService = inject(PdfService);
  private appointmentApiService = inject(AppointmentApiService);
  private router = inject(Router);

  @Input() appointment!: DoctorAppointmentItem;
  @Input() disabled = false;
  @Input() showStatusSelect = true;

  showPreviewModal = false;
  previewModalData: CompletionPreview | null = null;

  onViewMedicalRecord(event?: Event) {
    if (event) event.stopPropagation();
    const aptId = this.appointment.appointmentId;
    if (!aptId) return;

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

  @Output() viewPatient = new EventEmitter<DoctorAppointmentItem>();
  @Output() openHistoryForm = new EventEmitter<DoctorAppointmentItem>();
  @Output() openIntakeSummary = new EventEmitter<DoctorAppointmentItem>();
  @Output() openSoapEditor = new EventEmitter<DoctorAppointmentItem>();
  @Output() schedule = new EventEmitter<DoctorAppointmentItem>();
  @Output() confirm = new EventEmitter<DoctorAppointmentItem>();
  @Output() start = new EventEmitter<DoctorAppointmentItem>();
  @Output() complete = new EventEmitter<DoctorAppointmentItem>();
  @Output() cancel = new EventEmitter<DoctorAppointmentItem>();
  @Output() joinVideo = new EventEmitter<DoctorAppointmentItem>();
  @Output() statusChange = new EventEmitter<{ appointment: DoctorAppointmentItem; status: string }>();
  @Output() openChat = new EventEmitter<DoctorAppointmentItem>();

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
    const aptId = this.appointment.appointmentId;
    if (!aptId) return;

    const medHistory = this.appointment.appointmentMedicalHistory
      || (this.appointment.medicalHistory
        ? this.appointment.medicalHistory.find((m: any) => m.appointmentId && Number(m.appointmentId) === Number(aptId))
        : null);

    this.appointmentApiService.getSoapDraft(aptId).subscribe({
      next: (soap: any) => {
        this.buildAndDownloadPdf(aptId, medHistory, soap);
      },
      error: () => {
        this.buildAndDownloadPdf(aptId, medHistory, null);
      }
    });
  }

  private buildAndDownloadPdf(aptId: number, medHistory: any, soap: any) {
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
