import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SummaryItem, parseVisitSummary } from '../../utils/visit-summary.util';
import { AiTextComponent } from '../../ui/ai-text.component';
import { AppointmentApiService } from '../../../core/services/appointment-api.service';
import { AppointmentHeaderComponent } from './appointment-header.component';
import { StatusStepperComponent } from './status-stepper.component';
import { AppointmentOverviewTabComponent } from './appointment-overview-tab.component';
import { AppointmentProcessTabComponent } from './appointment-process-tab.component';
import { MedicalHistoryTabComponent } from './medical-history-tab.component';
import { AuthService } from '../../../core/services/auth.service';

import { IntakeSummaryModalComponent } from '../../../features/doctor/intake-summary-modal.component';
import { SoapReportEditorComponent } from '../../../features/doctor/soap-report-editor.component';
import { VisitCompletionPreviewModalComponent } from '../../../features/doctor/visit-completion-preview-modal.component';
import { EsignConfirmationModalComponent } from '../../../features/doctor/esign-confirmation-modal.component';
import { MedicalHistoryFormModalComponent } from '../../medical-history-form-modal.component';
import { RescheduleAppointmentModalComponent } from '../../reschedule-appointment-modal.component';
import { SharedChatModalComponent } from '../../chat/shared-chat-modal.component';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientProfileService } from '../../../core/services/patient-profile.service';
import { AppointmentDetails, CompletionPreview, AppointmentFollowThrough, FollowUpSlot } from '../../../core/models/appointment.models';
import { PaymentPopupComponent, PaymentDetails } from '../../payment-popup.component';

@Component({
    selector: 'app-appointment-details-page',
    standalone: true,
    imports: [
        CommonModule,
        AiTextComponent,
        AppointmentHeaderComponent,
        StatusStepperComponent,
        AppointmentOverviewTabComponent,
        AppointmentProcessTabComponent,
        MedicalHistoryTabComponent,
        IntakeSummaryModalComponent,
        SoapReportEditorComponent,
        VisitCompletionPreviewModalComponent,
        EsignConfirmationModalComponent,
        MedicalHistoryFormModalComponent,
        RescheduleAppointmentModalComponent,
        SharedChatModalComponent,
        PaymentPopupComponent
    ],
    templateUrl: './appointment-details-page.component.html',
})
export class AppointmentDetailsPageComponent implements OnInit {
    public auth = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private appointmentApiService = inject(AppointmentApiService);
    private appointmentService = inject(AppointmentService);
    private patientProfileService = inject(PatientProfileService);

    appointmentId?: number;
    appointment: AppointmentDetails | null = null;
    viewerRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';
    activeTab: 'OVERVIEW' | 'PROCESS' | 'MEDICAL_HISTORY' = 'PROCESS';
    loading: boolean = true;
    errorMsg: string = '';
    preVisitBriefLoading: boolean = false;
    preVisitBriefLoaded: boolean = false;
    isPreVisitBriefExpanded: boolean = true;
    preVisitBrief: string = '';
    briefMedications: string = '';
    briefAllergies: string = '';

    // Medical History Form State
    medicalHistoryForm: any = {
        visitDate: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medicine: '',
        doses: '',
        notes: ''
    };
    savingMedicalRecord: boolean = false;
    medicalRecordSaved: boolean = false;
    medicalRecordError: string | null = null;

    // Modal State Triggers
    showIntakeSummaryModal: boolean = false;
    selectedIntakeSummary: any = null;

    showSoapEditorModal: boolean = false;
    selectedSoapAppointment: any = null;

    showCompletionPreviewModal: boolean = false;
    completionPreviewData: CompletionPreview | null = null;

    showEsignModal: boolean = false;

    showMedicalHistoryFormModal: boolean = false;
    showRescheduleModal: boolean = false;
    showChatModal: boolean = false;
    followThrough: AppointmentFollowThrough | null = null;
    selectedFollowUp: FollowUpSlot | null = null;
    followUpPaymentOpen: boolean = false;

    ngOnInit(): void {
        const routePath = this.router.url;
        if (routePath.includes('/doctor/')) {
            this.viewerRole = 'DOCTOR';
        } else {
            this.viewerRole = 'PATIENT';
        }

        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.appointmentId = +id;
                this.loadAppointmentDetails();
            } else {
                this.errorMsg = 'No appointment ID specified.';
                this.loading = false;
            }
        });
    }

    loadAppointmentDetails(): void {
        if (!this.appointmentId) return;
        this.loading = true;
        this.errorMsg = '';

        this.appointmentApiService.getAppointmentDetails(this.appointmentId).subscribe({
            next: (data) => {
                this.appointment = data;
                this.loading = false;
                if (this.viewerRole === 'PATIENT') {
                    this.loadFollowThrough();
                }
            },
            error: (err) => {
                this.appointment = null;
                this.loading = false;
                this.errorMsg = err?.error?.message || err?.message || 'Failed to load appointment details.';
            }
        });
    }

    private loadFollowThrough(): void {
        if (!this.appointmentId) return;
        this.appointmentApiService.getFollowThrough(this.appointmentId).subscribe({
            next: response => this.followThrough = response,
            error: () => this.followThrough = null
        });
    }

    /** The visit summary as labelled items (parsed once per summary text) */
    summaryItems(): SummaryItem[] {
        const text = this.followThrough?.plainLanguageSummary || '';
        if (text !== this.parsedSummaryText) {
            this.parsedSummaryText = text;
            this.parsedSummary = parseVisitSummary(text);
        }
        return this.parsedSummary;
    }
    private parsedSummaryText = '';
    private parsedSummary: SummaryItem[] = [];

    hasFollowThrough(): boolean {
        const item = this.followThrough;
        return !!item && (!!item.plainLanguageSummary || item.feedbackRequested || !!item.suggestedFollowUp || !!item.replacementOffer);
    }

    openFollowUpPayment(slot: FollowUpSlot): void {
        this.selectedFollowUp = slot;
        this.followUpPaymentOpen = true;
    }

    followUpBookingDetails() {
        const slot = this.selectedFollowUp;
        if (!slot) return undefined;
        const [hours, minutes] = slot.slot.split(':');
        return {
            doctorId: slot.doctorId,
            appointmentDateTime: `${slot.date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`,
            reason: slot.reason || 'Follow-up visit',
            bookingSource: 'AI_ASSISTED' as const
        };
    }

    onFollowUpPaid(_details: PaymentDetails): void {
        this.followUpPaymentOpen = false;
        this.selectedFollowUp = null;
        this.loadAppointmentDetails();
    }

    requestFeedback(): void {
        this.router.navigate(['/patient/feedback']);
    }

    loadPreVisitBrief(): void {
        if (!this.appointmentId) return;
        this.preVisitBriefLoading = true;
        this.isPreVisitBriefExpanded = true;
        this.appointmentApiService.getPreVisitBrief(this.appointmentId).subscribe({
            next: response => {
                this.preVisitBrief = response.historySummary || 'No prior visits or medical history were found.';
                this.briefMedications = response.currentMedications || 'Not provided';
                this.briefAllergies = response.allergies || 'Not provided';
                this.preVisitBriefLoaded = true;
                this.preVisitBriefLoading = false;
            },
            error: () => {
                this.preVisitBrief = 'Pre-visit history summary is currently unavailable.';
                this.briefMedications = 'Not provided';
                this.briefAllergies = 'Not provided';
                this.preVisitBriefLoaded = true;
                this.preVisitBriefLoading = false;
            }
        });
    }

    togglePreVisitBrief(): void {
        this.isPreVisitBriefExpanded = !this.isPreVisitBriefExpanded;
    }

    goBack(): void {
        this.location.back();
    }

    handleProcessAction(actionKey: string): void {
        const aptId = this.appointment?.appointmentId;
        if (!this.appointment || !aptId) return;

        switch (actionKey) {
            case 'INTAKE':
            case 'SUBMIT_INTAKE':
                this.router.navigate(['/patient/intake', aptId]);
                break;

            case 'RESCHEDULE':
                this.showRescheduleModal = true;
                break;

            case 'CANCEL':
                if (confirm('Are you sure you want to cancel this appointment?')) {
                    this.executeActionApi(aptId, 'CANCEL');
                }
                break;

            case 'CONFIRM':
                this.executeActionApi(aptId, 'CONFIRM');
                break;

            case 'ACCEPT':
                this.executeActionApi(aptId, 'ACCEPT');
                break;

            case 'REJECT':
            case 'DECLINE':
                this.executeActionApi(aptId, 'REJECT');
                break;

            case 'DEVICE_TEST':
            case 'JOIN_WAITING_ROOM':
                this.executeActionApi(aptId, 'JOIN_WAITING_ROOM');
                break;

            case 'START_PROGRESS':
            case 'START_VISIT':
                this.executeActionApi(aptId, 'START_PROGRESS');
                break;

            case 'JOIN_VIDEO':
                const targetRoute = this.viewerRole === 'PATIENT' ? '/patient/consultation' : '/doctor/consultation';
                this.router.navigate([targetRoute, aptId]);
                break;

            case 'CHAT':
                this.showChatModal = true;
                break;

            case 'CONFIRM_INTAKE':
                this.executeActionApi(aptId, 'CONFIRM_INTAKE');
                break;

            case 'OVERRIDE_START_PROGRESS':
                const overrideReason = prompt('Please enter a clinical reason for overriding patient intake confirmation:');
                if (overrideReason && overrideReason.trim().length > 0) {
                    this.executeActionApi(aptId, 'OVERRIDE_START_PROGRESS', { reason: overrideReason });
                } else if (overrideReason !== null) {
                    alert('Reason is required to override patient confirmation gate.');
                }
                break;

            case 'EDIT_INTAKE':
                this.fetchIntakeSummary(aptId);
                break;

            case 'VIEW_INTAKE':
            case 'OPEN_INTAKE':
                this.fetchIntakeSummary(aptId);
                break;

            case 'AI_SOAP':
                this.selectedSoapAppointment = this.appointment;
                this.showSoapEditorModal = true;
                break;

            case 'ADD_MEDICAL_RECORD':
            case 'PROCEED_MEDICAL_RECORD':
                if (this.appointment.status === 'IN_PROGRESS') {
                    this.executeActionApi(aptId, 'ADD_MEDICAL_RECORD');
                } else {
                    this.openMedicalRecordForm(aptId);
                }
                break;

            case 'ADD_RECORD':
            case 'EDIT_RECORD':
                this.openMedicalRecordForm(aptId);
                break;

            case 'MOVE_TO_COMPLETE':
                this.executeActionApi(aptId, 'MOVE_TO_COMPLETE');
                break;

            case 'BACK_TO_MEDICAL_RECORD':
                this.executeActionApi(aptId, 'BACK_TO_MEDICAL_RECORD');
                break;

            case 'PREVIEW_AND_COMPLETE':
                this.openCompletionPreviewModal(aptId);
                break;

            case 'COMPLETE':
            case 'COMPLETE_VISIT':
                this.executeActionApi(aptId, 'COMPLETE');
                break;

            case 'DOWNLOAD_RX':
            case 'PREVIEW_PDF':
            case 'DOWNLOAD_RECEIPT':
                alert(`Downloading / Viewing ${actionKey === 'DOWNLOAD_RX' ? 'Prescription PDF' : actionKey === 'PREVIEW_PDF' ? 'Draft Medical Record PDF' : 'Receipt'}...`);
                break;

            default:
                // Fallback to calling executeAction for any dynamic action key
                this.executeActionApi(aptId, actionKey);
        }
    }

    openCompletionPreviewModal(aptId: number): void {
        this.appointmentService.getCompletionPreview(aptId).subscribe({
            next: (preview: CompletionPreview) => {
                this.completionPreviewData = preview;
                this.showCompletionPreviewModal = true;
            },
            error: (err: any) => {
                alert('Failed to load visit completion preview. ' + (err?.error?.message || ''));
            }
        });
    }

    onProceedToSignFromPreview(): void {
        this.showCompletionPreviewModal = false;
        this.showEsignModal = true;
    }

    onBackToEditFromPreview(): void {
        this.showCompletionPreviewModal = false;
        if (this.appointmentId) {
            this.executeActionApi(this.appointmentId, 'BACK_TO_MEDICAL_RECORD');
        }
    }

    onESignSignedSuccess(): void {
        this.showEsignModal = false;
        this.loadAppointmentDetails();
    }

    private executeActionApi(aptId: number, actionKey: string, payload: any = {}): void {
        this.appointmentApiService.executeAction(aptId, actionKey, payload).subscribe({
            next: (updatedAppointment) => {
                this.appointment = updatedAppointment;
                this.loadAppointmentDetails();
            },
            error: (err) => {
                // Fallback to legacy update if 404
                if (err.status === 404) {
                    this.updateStatus(actionKey);
                } else {
                    alert(err?.error?.message || err?.message || 'Failed to perform stage action');
                }
            }
        });
    }

    private fetchIntakeSummary(aptId: number): void {
        this.appointmentApiService.getPreVisitIntakeSummary(aptId).subscribe({
            next: (intakeData) => {
                this.selectedIntakeSummary = intakeData;
                this.showIntakeSummaryModal = true;
            },
            error: () => {
                alert('No pre-visit intake submitted by patient yet.');
            }
        });
    }

    private updateStatus(newStatus: string): void {
        if (!this.appointmentId) return;
        this.appointmentApiService.updateAppointmentStatus(this.appointmentId, newStatus).subscribe({
            next: () => {
                this.loadAppointmentDetails();
            },
            error: (err) => {
                alert(`Failed to update status: ${err?.error?.message || err?.message || 'Error occurred'}`);
            }
        });
    }

    private cancelAppointment(aptId: number): void {
        const cancelStatus = this.viewerRole === 'PATIENT' ? 'CANCELLED_BY_PATIENT' : 'CANCELLED_BY_DOCTOR';
        this.appointmentApiService.updateAppointmentStatus(aptId, cancelStatus).subscribe({
            next: () => {
                this.loadAppointmentDetails();
            },
            error: (err) => {
                alert(`Failed to cancel appointment: ${err?.error?.message || err?.message || 'Error occurred'}`);
            }
        });
    }

    onSoapSaved(): void {
        this.showSoapEditorModal = false;
        this.loadAppointmentDetails();
    }

    openMedicalRecordForm(aptId: number): void {
        const defaultVisitDate = this.appointment?.appointmentDate
            || new Date().toISOString().split('T')[0];

        this.savingMedicalRecord = false;
        this.medicalRecordSaved = false;
        this.medicalRecordError = null;

        // Fetch pre-visit intake summary to ensure symptoms are auto-populated from intake
        this.appointmentApiService.getPreVisitIntakeSummary(aptId).subscribe({
            next: (intake: any) => {
                const intakeSymptoms = intake?.symptoms
                    || intake?.chiefComplaint
                    || intake?.aiTriageSummary
                    || intake?.preVisitSummary
                    || '';

                this.patientProfileService.getMedicalHistoryByAppointment(aptId).subscribe({
                    next: (mh: any) => {
                        if (mh && (mh.id || mh.diagnosis || mh.symptoms)) {
                            this.medicalHistoryForm = {
                                id: mh.id,
                                visitDate: mh.visitDate || defaultVisitDate,
                                symptoms: mh.symptoms || intakeSymptoms,
                                diagnosis: mh.diagnosis || '',
                                treatment: mh.treatment || '',
                                medicine: mh.medicine || '',
                                doses: mh.doses || '',
                                notes: mh.notes || '',
                                patientId: mh.patientId || this.appointment?.patientId,
                                appointmentId: aptId
                            };
                        } else {
                            this.medicalHistoryForm = {
                                visitDate: defaultVisitDate,
                                symptoms: intakeSymptoms,
                                diagnosis: '',
                                treatment: '',
                                medicine: '',
                                doses: '',
                                notes: '',
                                patientId: this.appointment?.patientId,
                                appointmentId: aptId
                            };
                        }
                        this.showMedicalHistoryFormModal = true;
                    },
                    error: () => {
                        this.medicalHistoryForm = {
                            visitDate: defaultVisitDate,
                            symptoms: intakeSymptoms,
                            diagnosis: '',
                            treatment: '',
                            medicine: '',
                            doses: '',
                            notes: '',
                            patientId: this.appointment?.patientId,
                            appointmentId: aptId
                        };
                        this.showMedicalHistoryFormModal = true;
                    }
                });
            },
            error: () => {
                const fallbackSymptoms = '';
                this.patientProfileService.getMedicalHistoryByAppointment(aptId).subscribe({
                    next: (mh: any) => {
                        this.medicalHistoryForm = {
                            id: mh?.id,
                            visitDate: mh?.visitDate || defaultVisitDate,
                            symptoms: mh?.symptoms || fallbackSymptoms,
                            diagnosis: mh?.diagnosis || '',
                            treatment: mh?.treatment || '',
                            medicine: mh?.medicine || '',
                            doses: mh?.doses || '',
                            notes: mh?.notes || '',
                            patientId: mh?.patientId || this.appointment?.patientId,
                            appointmentId: aptId
                        };
                        this.showMedicalHistoryFormModal = true;
                    },
                    error: () => {
                        this.medicalHistoryForm = {
                            visitDate: defaultVisitDate,
                            symptoms: fallbackSymptoms,
                            diagnosis: '',
                            treatment: '',
                            medicine: '',
                            doses: '',
                            notes: '',
                            patientId: this.appointment?.patientId,
                            appointmentId: aptId
                        };
                        this.showMedicalHistoryFormModal = true;
                    }
                });
            }
        });
    }

    saveMedicalRecordForm(): void {
        if (!this.medicalHistoryForm || this.savingMedicalRecord) return;
        this.savingMedicalRecord = true;
        this.medicalRecordSaved = false;
        this.medicalRecordError = null;

        const patientId = this.medicalHistoryForm.patientId || this.appointment?.patientId;
        const doctorId = this.appointment?.doctorId;
        const appointmentId = this.appointment?.appointmentId || this.appointmentId;
        if (!patientId || !doctorId || !appointmentId) {
            this.savingMedicalRecord = false;
            this.medicalRecordError = 'Patient or doctor information is missing for this appointment.';
            return;
        }
        const data = {
            ...this.medicalHistoryForm,
            patientId,
            doctorId,
            appointmentId
        };

        const request$ = this.medicalHistoryForm.id
            ? this.patientProfileService.updateMedicalHistory(this.medicalHistoryForm.id, data)
            : this.patientProfileService.addMedicalHistoryWithDoctor(patientId, doctorId, data);

        request$.subscribe({
            next: () => {
                this.savingMedicalRecord = false;
                this.medicalRecordSaved = true;
                setTimeout(() => {
                    this.showMedicalHistoryFormModal = false;
                    this.loadAppointmentDetails();
                }, 1000);
            },
            error: (err: any) => {
                this.savingMedicalRecord = false;
                this.medicalRecordError = err?.error?.message || err?.error?.error || 'Failed to save medical history record.';
            }
        });
    }
}
