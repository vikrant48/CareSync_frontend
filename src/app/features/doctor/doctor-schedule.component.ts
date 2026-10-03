import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { DoctorAppointmentCardComponent } from '../../shared/doctor-appointment-card.component';
import { PatientDetailsModalComponent } from '../../shared/patient-details-modal.component';
import { MedicalHistoryDetailModalComponent } from '../../shared/medical-history-detail-modal.component';
import { MedicalHistoryFormModalComponent } from '../../shared/medical-history-form-modal.component';
import { AppointmentService, DoctorAppointmentItem } from '../../core/services/appointment.service';
import { PatientProfileService, PatientDto, MedicalHistoryItem, MedicalHistoryWithDoctorItem } from '../../core/services/patient-profile.service';
import { AuthService } from '../../core/services/auth.service';
import { SharedChatModalComponent } from '../../shared/chat/shared-chat-modal.component';
import { SelectDropdownComponent } from '../../shared/select-dropdown.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { FilterBarComponent } from '../../shared/ui/filter-bar.component';

@Component({
    selector: 'app-doctor-schedule',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        DoctorLayoutComponent,
        DoctorAppointmentCardComponent,
        PatientDetailsModalComponent,
        MedicalHistoryDetailModalComponent,
        MedicalHistoryFormModalComponent,
        SharedChatModalComponent,
        SelectDropdownComponent,
        EmptyStateComponent,
        SkeletonComponent,
        FilterBarComponent
    ],
    templateUrl: './doctor-schedule.component.html',
    styleUrl: './doctor-schedule.component.css'
})
export class DoctorScheduleComponent implements OnInit {
    private apptApi = inject(AppointmentService);
    private patientApi = inject(PatientProfileService);
    private router = inject(Router);
    private auth = inject(AuthService);
    public cdr = inject(ChangeDetectorRef);

    todayDate = new Date();
    todayAppointments: DoctorAppointmentItem[] = [];
    loading = false;

    statusFilterOptions: string[] = ['ALL', 'BOOKED', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    filterStatus: string = 'ALL';
    searchTerm: string = '';
    isFilterExpanded = false;

    get scheduleFilterActiveCount(): number {
        let count = 0;
        if (this.filterStatus !== 'ALL') count++;
        if (this.searchTerm) count++;
        return count;
    }

    // Modal State
    showPatientModal = false;
    selectedAppointment: DoctorAppointmentItem | null = null;
    selectedPatient: PatientDto | null = null;
    selectedPatientHistory: MedicalHistoryWithDoctorItem[] = [];
    selectedPatientDocuments: any[] = [];

    historyDetailModalOpen = false;
    selectedHistoryDetail: any | null = null;
    selectedHistoryDoctorInfo: any | null = null;

    historyFormModalOpen = false;
    mhForm: Partial<MedicalHistoryItem> = {};
    savingHistory = false;
    historySaved = false;
    historyError: string | null = null;
    editingHistoryId: number | null = null;
    doctorId: number | null = null;

    ngOnInit() {
        this.doctorId = this.auth.userId() ? Number(this.auth.userId()) : null;
        this.refreshToday();
    }

    refreshToday() {
        this.loading = true;
        this.apptApi.getDoctorTodayAppointments().subscribe({
            next: (res) => {
                this.todayAppointments = res || [];
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    filteredAppointments() {
        const term = (this.searchTerm || '').trim().toLowerCase();
        return this.todayAppointments
            .filter(a => this.filterStatus === 'ALL' ? true : a.status === this.filterStatus)
            .filter(a => term ? (a.patientName || '').toLowerCase().includes(term) : true);
    }

    resetFilters() {
        this.filterStatus = 'ALL';
        this.searchTerm = '';
    }

    // Actions
    confirm(a: DoctorAppointmentItem) {
        this.apptApi.confirmAppointment(a.appointmentId).subscribe({ next: () => this.refreshToday() });
    }
    schedule(a: DoctorAppointmentItem) {
        this.apptApi.updateAppointmentStatus(a.appointmentId, 'SCHEDULED').subscribe({ next: () => this.refreshToday() });
    }
    complete(a: DoctorAppointmentItem) {
        this.apptApi.completeAppointment(a.appointmentId).subscribe({ next: () => this.refreshToday() });
    }
    cancel(a: DoctorAppointmentItem) {
        this.apptApi.cancelAppointment(a.appointmentId).subscribe({ next: () => this.refreshToday() });
    }
    start(a: DoctorAppointmentItem) {
        this.apptApi.updateAppointmentStatus(a.appointmentId, 'IN_PROGRESS').subscribe({
            next: (updated) => {
                this.refreshToday();
            }
        });
    }
    joinConsultation(a: DoctorAppointmentItem) {
        this.router.navigate(['/doctor/consultation', a.appointmentId]);
    }
    changeStatus(a: DoctorAppointmentItem, status: string) {
        this.apptApi.updateAppointmentStatus(a.appointmentId, status).subscribe({
            next: () => this.refreshToday()
        });
    }

    // Patient Modal Logic
    openPatient(a: DoctorAppointmentItem) {
        this.selectedAppointment = a;
        this.showPatientModal = true;
        this.patientApi.getCompleteData(a.patientId).subscribe({
            next: (data) => {
                this.selectedPatient = data.patient;
                this.selectedPatientHistory = data.medicalHistory;
                this.selectedPatientDocuments = data.documents || [];
                this.cdr.detectChanges();
            }
        });
    }

    openHistory(item: MedicalHistoryWithDoctorItem) {
        this.selectedHistoryDoctorInfo = item;
        this.historyDetailModalOpen = true;
        this.patientApi.getMedicalHistoryDetail(item.id).subscribe({
            next: (detail) => this.selectedHistoryDetail = detail,
            error: () => this.selectedHistoryDetail = { ...item } as any
        });
    }

    // Medical History Form Logic
    openHistoryForm(a: DoctorAppointmentItem) {
        this.selectedAppointment = a;
        this.editingHistoryId = null;

        let record: any = a.appointmentMedicalHistory || null;

        if (!record && a.medicalHistory) {
            record = a.medicalHistory.find(m => m.appointmentId && Number(m.appointmentId) === Number(a.appointmentId));
        }

        if (record) {
            this.editingHistoryId = record.id;
            this.mhForm = {
                visitDate: record.visitDate,
                symptoms: record.symptoms,
                diagnosis: record.diagnosis,
                treatment: record.treatment,
                medicine: record.medicine,
                doses: record.doses,
                notes: record.notes
            };
        } else {
            this.mhForm = {
                visitDate: a.appointmentDate,
                symptoms: '',
                diagnosis: '',
                treatment: '',
                medicine: '',
                doses: '',
                notes: ''
            };
        }
        this.historyFormModalOpen = true;
    }

    closeHistoryForm() {
        this.historyFormModalOpen = false;
        this.mhForm = {};
        this.historySaved = false;
        this.historyError = null;
    }

    saveMedicalHistory() {
        if (!this.selectedAppointment || this.savingHistory || !this.doctorId) return;

        this.savingHistory = true;
        this.historySaved = false;
        this.historyError = null;

        const data = {
            ...this.mhForm,
            appointmentId: this.selectedAppointment.appointmentId
        };

        const request$ = this.editingHistoryId
            ? this.patientApi.updateMedicalHistory(this.editingHistoryId, data)
            : this.patientApi.addMedicalHistoryWithDoctor(this.selectedAppointment.patientId, this.doctorId, data);

        request$.subscribe({
            next: () => {
                this.savingHistory = false;
                this.historySaved = true;
                setTimeout(() => {
                    this.closeHistoryForm();
                    this.refreshToday(); // Refresh to get updated MH list in appointment objects
                }, 1500);
            },
            error: (e: any) => {
                this.savingHistory = false;
                this.historyError = 'Failed to save record';
            }
        });
    }

    // Chat Logic
    chatOpen = false;
    chatAppointmentId: number | null = null;
    chatParticipantName: string | null = null;
    chatParticipantImage: string | null = null;

    openChat(a: DoctorAppointmentItem) {
        this.chatAppointmentId = a.appointmentId;
        this.chatParticipantName = a.patientName || 'Patient';
        this.chatParticipantImage = a.patientProfileImageUrl || null;
        this.chatOpen = true;
    }

    closeChat() {
        this.chatOpen = false;
        this.chatAppointmentId = null;
        this.chatParticipantName = null;
        this.chatParticipantImage = null;
    }
}
