import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserAvatarComponent } from './user-avatar.component';
import { StatusBadgeComponent } from '../ui/status-badge.component';
import { AppointmentDto, CompletionPreview } from '../../core/models/appointment.models';
import { PdfService } from '../../core/services/pdf.service';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { VisitCompletionPreviewModalComponent } from '../../features/doctor/visit-completion-preview-modal.component';

@Component({
    selector: 'app-appointment-card',
    standalone: true,
    imports: [CommonModule, UserAvatarComponent, StatusBadgeComponent, VisitCompletionPreviewModalComponent],
    templateUrl: './appointment-card.component.html',
    styleUrl: './appointment-card.component.css'
})
export class AppointmentCardComponent {
    private router = inject(Router);
    private pdfService = inject(PdfService);
    private appointmentApiService = inject(AppointmentApiService);

    @Input({ required: true }) appointment!: AppointmentDto | any;
    @Input() viewerRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

    @Output() cardClick = new EventEmitter<number>();
    @Output() viewRecord = new EventEmitter<any>();
    @Output() viewPrescription = new EventEmitter<any>();
    @Output() giveFeedback = new EventEmitter<any>();

    showPreviewModal = false;
    previewModalData: CompletionPreview | null = null;

    get otherPersonName(): string {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorName || 'Dr. Assigned';
        }
        return this.appointment?.patientName || 'Patient';
    }

    get otherPersonSubtext(): string {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorSpecialization || 'Healthcare Provider';
        }
        return this.appointment?.patientMobile || `Appointment #${this.appointment?.appointmentId || this.appointment?.id}`;
    }

    get otherPersonAvatar(): string | undefined {
        if (this.viewerRole === 'PATIENT') {
            return this.appointment?.doctorProfileImageUrl;
        }
        return this.appointment?.patientProfileImageUrl;
    }

    onViewAppointment(): void {
        const aptId = this.appointment?.appointmentId || this.appointment?.id;
        if (!aptId) return;

        this.cardClick.emit(aptId);
        if (this.viewerRole === 'PATIENT') {
            this.router.navigate(['/patient/appointments', aptId]);
        } else {
            this.router.navigate(['/doctor/appointments', aptId]);
        }
    }

    onViewMedicalRecord(event: Event): void {
        event.stopPropagation();
        this.openCompletionPreview();
    }

    onViewPrescription(event: Event): void {
        event.stopPropagation();
        this.openCompletionPreview();
    }

    private openCompletionPreview(): void {
        const aptId = this.appointment?.appointmentId || this.appointment?.id;
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
                    patientAge: this.appointment?.patientAge,
                    patientGender: this.appointment?.patientGender,
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

    onGiveFeedback(event: Event): void {
        event.stopPropagation();
        this.giveFeedback.emit(this.appointment);
        this.router.navigate(['/patient/feedback']);
    }

    onDownloadReceipt(event?: Event): void {
        if (event) event.stopPropagation();
        const aptId = this.appointment?.appointmentId || this.appointment?.id;
        if (!aptId) return;
        this.pdfService.generateAppointmentReceiptByBookingId(aptId, this.appointment);
    }

    onDownloadPrescription(event?: Event): void {
        if (event) event.stopPropagation();
        const aptId = this.appointment?.appointmentId || this.appointment?.id;
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
}
