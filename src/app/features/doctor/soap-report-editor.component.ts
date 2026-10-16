import { ChangeDetectorRef, Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { ToastService } from '../../core/services/toast.service';
import { SoapReportDto } from '../../core/models/appointment.models';
import { ClinicalDictationComponent } from '../../shared/clinical-dictation.component';
import { ClinicalDictationResponse } from '../../core/models/ai.models';
import { markForCheckOn } from '../../shared/utils/mark-for-check';

@Component({
    selector: 'app-soap-report-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalShellComponent, ClinicalDictationComponent],
    templateUrl: './soap-report-editor.component.html',
    styleUrl: './soap-report-editor.component.css'
})
export class SoapReportEditorComponent {
    private appointmentApi = inject(AppointmentApiService);
    private toast = inject(ToastService);
    // Hosted by an OnPush page: HTTP results request a check via markForCheckOn
    private cdr = inject(ChangeDetectorRef);

    @Input() isOpen: boolean = false;
    @Input() appointmentId: number = 0;
    @Input() soapReport: SoapReportDto = {
        appointmentId: 0,
        patientId: 0,
        doctorId: 0,
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        isDraft: true,
        isSigned: false
    };

    @Output() close = new EventEmitter<void>();

    transcriptInput: string = '';
    generating: boolean = false;
    signing: boolean = false;
    showDictation: boolean = false;

    ngOnChanges(changes: any): void {
        if (changes['isOpen'] && this.isOpen && this.appointmentId) {
            this.loadSavedSoapDraft();
        }
    }

    private loadSavedSoapDraft(): void {
        // Never carry a previous patient's transcript into this appointment
        this.transcriptInput = '';

        // 1. Always load pre-visit intake summary to auto-populate transcriptInput
        this.appointmentApi.getPreVisitIntakeSummary(this.appointmentId).pipe(markForCheckOn(this.cdr)).subscribe({
            next: (intake: any) => {
                if (intake) {
                    const aiSummary = intake.aiTriageSummary || intake.preVisitSummary || '';
                    const chiefComplaint = intake.chiefComplaint || '';
                    const symptoms = intake.symptomsSummary || intake.symptoms || '';
                    const formattedSummary = `Patient Intake Summary: ${aiSummary}\nChief Complaint: ${chiefComplaint}\nSymptoms: ${symptoms}`.trim();
                    if (!this.transcriptInput || this.transcriptInput.trim().length === 0) {
                        this.transcriptInput = formattedSummary;
                    }
                    if (!this.soapReport.symptoms) {
                        this.soapReport.symptoms = symptoms || chiefComplaint || aiSummary;
                    }
                }
            },
            error: () => { }
        });

        // 2. Load existing saved SOAP draft to re-populate saved fields
        this.appointmentApi.getSoapDraft(this.appointmentId).pipe(markForCheckOn(this.cdr)).subscribe({
            next: (res: SoapReportDto) => {
                if (res) {
                    this.soapReport = {
                        ...this.soapReport,
                        ...res
                    };
                    if (res.transcript && res.transcript.trim().length > 0) {
                        this.transcriptInput = res.transcript;
                    }
                }
            },
            error: () => { }
        });
    }

    generateDraft(): void {
        if (!this.transcriptInput || this.transcriptInput.trim().length < 5) {
            this.toast.show('Please provide a consultation transcript or summary notes.', 'warning');
            return;
        }

        this.generating = true;
        this.appointmentApi.generateSoapDraft(this.appointmentId, this.transcriptInput).pipe(markForCheckOn(this.cdr)).subscribe({
            next: (res: SoapReportDto) => {
                this.generating = false;
                this.soapReport = res;
                this.toast.showSuccess('AI SOAP report draft generated!');
            },
            error: (err: any) => {
                this.generating = false;
                this.toast.showError('Failed to generate AI SOAP draft. Please enter notes manually.');
            }
        });
    }

    applyDictation(result: ClinicalDictationResponse): void {
        this.showDictation = false;
        if (result.transcript) {
            this.transcriptInput = result.transcript;
        }
        this.soapReport = {
            ...this.soapReport,
            subjective: result.soapNote?.subjective || this.soapReport.subjective,
            objective: result.soapNote?.objective || this.soapReport.objective,
            assessment: result.soapNote?.assessment || result.diagnosis || this.soapReport.assessment,
            plan: result.soapNote?.plan || this.soapReport.plan,
            symptoms: result.chiefComplaint || this.soapReport.symptoms,
            diagnosis: result.diagnosis || this.soapReport.diagnosis,
            medicine: result.prescriptions?.map(item => item.name).filter(Boolean).join(', ') || this.soapReport.medicine,
            doses: result.prescriptions?.map(item =>
                [item.name, item.dosage, item.frequency, item.duration, item.instructions].filter(Boolean).join(' ')
            ).filter(Boolean).join('\n') || this.soapReport.doses,
            transcript: result.transcript || this.transcriptInput
        };
        this.toast.showSuccess('Dictation draft applied. Review and edit every field before saving.');
    }

    @Output() soapSaved = new EventEmitter<SoapReportDto>();

    saveDraftOnly(): void {
        if (!this.soapReport.subjective || !this.soapReport.assessment || !this.soapReport.plan) {
            this.toast.show('Please ensure Subjective, Assessment, and Plan fields are filled.', 'warning');
            return;
        }

        this.signing = true;
        this.soapReport.transcript = this.transcriptInput;
        this.appointmentApi.saveSoapDraft(this.appointmentId, this.soapReport).pipe(markForCheckOn(this.cdr)).subscribe({
            next: (res: SoapReportDto) => {
                this.signing = false;
                this.soapReport = res;
                this.toast.showSuccess('Reviewed SOAP and prescription draft saved. Complete the e-sign step to finalize it.');
                this.soapSaved.emit(res);
                this.closeModal();
            },
            error: (err: any) => {
                this.signing = false;
                this.toast.showError('Failed to save SOAP report draft.');
            }
        });
    }

    closeModal(): void {
        this.close.emit();
    }
}
