import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { ToastService } from '../../core/services/toast.service';
import { SoapReportDto } from '../../core/models/appointment.models';

@Component({
    selector: 'app-soap-report-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './soap-report-editor.component.html',
    styleUrl: './soap-report-editor.component.css'
})
export class SoapReportEditorComponent {
    private appointmentApi = inject(AppointmentApiService);
    private toast = inject(ToastService);

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
    @Output() reportSigned = new EventEmitter<SoapReportDto>();

    transcriptInput: string = '';
    generating: boolean = false;
    signing: boolean = false;

    ngOnChanges(changes: any): void {
        if (changes['isOpen'] && this.isOpen && this.appointmentId) {
            this.loadSavedSoapDraft();
        }
    }

    private loadSavedSoapDraft(): void {
        // 1. Always load pre-visit intake summary to auto-populate transcriptInput
        this.appointmentApi.getPreVisitIntakeSummary(this.appointmentId).subscribe({
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
        this.appointmentApi.getSoapDraft(this.appointmentId).subscribe({
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
        this.appointmentApi.generateSoapDraft(this.appointmentId, this.transcriptInput).subscribe({
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

    @Output() soapSaved = new EventEmitter<SoapReportDto>();

    saveDraftOnly(): void {
        if (!this.soapReport.subjective || !this.soapReport.assessment || !this.soapReport.plan) {
            this.toast.show('Please ensure Subjective, Assessment, and Plan fields are filled.', 'warning');
            return;
        }

        this.signing = true;
        // Save draft via generateSoapDraft endpoint or draft endpoint
        const fullNotes = `SUBJECTIVE: ${this.soapReport.subjective}\nOBJECTIVE: ${this.soapReport.objective}\nASSESSMENT: ${this.soapReport.assessment}\nPLAN: ${this.soapReport.plan}`;
        this.appointmentApi.generateSoapDraft(this.appointmentId, fullNotes).subscribe({
            next: (res: SoapReportDto) => {
                this.signing = false;
                this.soapReport = res;
                this.toast.showSuccess('SOAP Report Draft saved successfully!');
                this.soapSaved.emit(res);
                this.reportSigned.emit(res);
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
