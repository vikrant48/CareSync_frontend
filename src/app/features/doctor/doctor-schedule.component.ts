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
    template: `
    <app-doctor-layout>
      <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 class="font-display text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Schedule</h2>
            <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Manage your daily appointments and patient flow</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
            <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm">
               {{ todayDate | date:'fullDate' }}
            </div>
            <button (click)="refreshToday()" class="btn-secondary w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center p-0 rounded-xl text-xs sm:text-sm">
               <i class="fa-solid fa-rotate" [class.animate-spin]="loading"></i>
            </button>
          </div>
        </div>

        <app-filter-bar
          [(expanded)]="isFilterExpanded"
          [activeCount]="scheduleFilterActiveCount"
          gridClass="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          (clear)="resetFilters()"
        >
           <div class="space-y-0.5">
             <label class="filter-label">Search</label>
             <div class="relative w-full">
               <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm pointer-events-none z-10"></i>
               <input type="text" [(ngModel)]="searchTerm" placeholder="Search patient name..." class="filter-input-search">
             </div>
           </div>

           <div class="space-y-0.5">
             <app-select-dropdown
               label="Status"
               [(ngModel)]="filterStatus"
               [options]="statusFilterOptions"
               (ngModelChange)="cdr.detectChanges()"
               placeholder="All Appointments">
             </app-select-dropdown>
           </div>
        </app-filter-bar>

        <app-skeleton *ngIf="loading" variant="card" [count]="6" wrapperClass="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></app-skeleton>

        <app-empty-state
          *ngIf="!loading && filteredAppointments().length === 0 && (filterStatus !== 'ALL' || searchTerm)"
          icon="fa-solid fa-calendar-xmark"
          title="No appointments found"
          message="Try adjusting your filters or search terms."
          [compact]="true"
          [hasAction]="true"
        >
          <button type="button" (click)="resetFilters()" class="mt-2 text-xs sm:text-sm text-blue-600 font-bold hover:underline min-h-touch px-3">Clear Filters</button>
        </app-empty-state>
        <app-empty-state
          *ngIf="!loading && filteredAppointments().length === 0 && filterStatus === 'ALL' && !searchTerm"
          icon="fa-solid fa-calendar-xmark"
          title="No appointments found"
          message="You have no appointments scheduled for today."
          [compact]="true"
        ></app-empty-state>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 fade-in" *ngIf="!loading && filteredAppointments().length > 0">
           <doctor-appointment-card
             *ngFor="let a of filteredAppointments()"
             [appointment]="a"
             [showStatusSelect]="true"
             (viewPatient)="openPatient($event)"
             (openHistoryForm)="openHistoryForm($event)"
             (schedule)="schedule($event)"
             (confirm)="confirm($event)"
             (start)="start($event)"
             (complete)="complete($event)"
             (cancel)="cancel($event)"
             (joinVideo)="joinConsultation($event)"
             (statusChange)="changeStatus($event.appointment, $event.status)"
             (openChat)="openChat($event)"
             class="h-full"
           ></doctor-appointment-card>
        </div>

        <!-- Modals -->
        <app-patient-details-modal
          [open]="showPatientModal"
          [patient]="selectedPatient"
          [history]="selectedPatientHistory"
          [documents]="selectedPatientDocuments"
          (close)="showPatientModal = false"
          (historyClick)="openHistory($event)"
        ></app-patient-details-modal>

        <app-medical-history-detail-modal
          [open]="historyDetailModalOpen"
          [detail]="selectedHistoryDetail"
          [doctorInfo]="selectedHistoryDoctorInfo"
          (close)="historyDetailModalOpen = false"
        ></app-medical-history-detail-modal>

        <app-medical-history-form-modal
          [open]="historyFormModalOpen"
          [form]="mhForm"
          [disabled]="selectedAppointment?.status !== 'IN_PROGRESS'"
          [saving]="savingHistory"
          [saved]="historySaved"
          [error]="historyError"
          [infoText]="selectedAppointment?.status === 'COMPLETED' ? 'This medical record is finalized and cannot be modified.' : (selectedAppointment?.status !== 'IN_PROGRESS' ? 'Form available only for in-progress appointments.' : null)"
          (close)="closeHistoryForm()"
          (submit)="saveMedicalHistory()"
        ></app-medical-history-form-modal>

        <!-- Shared Chat Modal -->
        <app-shared-chat-modal
          [isOpen]="chatOpen"
          [appointmentId]="chatAppointmentId"
          [participantName]="chatParticipantName"
          [participantImage]="chatParticipantImage"
          (close)="closeChat()"
        ></app-shared-chat-modal>

      </div>
    </app-doctor-layout>
  `
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
