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
        MedicalHistoryFormModalComponent
    ],
    template: `
    <app-doctor-layout>
      <div class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Schedule</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your daily appointments and patient flow</p>
          </div>
          <div class="flex items-center gap-3 self-end sm:self-auto">
            <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-bold text-sm">
               {{ todayDate | date:'fullDate' }}
            </div>
            <button (click)="refreshToday()" class="btn-secondary w-10 h-10 flex items-center justify-center p-0 rounded-xl">
               <i class="fa-solid fa-rotate" [class.animate-spin]="loading"></i>
            </button>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
           
           <!-- Search -->
           <div class="relative w-full sm:max-w-xs">
             <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
             <input type="text" [(ngModel)]="searchTerm" placeholder="Search patient..." class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
           </div>

           <!-- Filter -->
           <div class="flex items-center gap-2 w-full sm:w-auto">
             <label class="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">Filter Status:</label>
             <select class="py-2 px-3 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto" [(ngModel)]="filterStatus">
               <option *ngFor="let s of statusFilterOptions" [value]="s">{{ s === 'ALL' ? 'All Appointments' : s }}</option>
             </select>
           </div>
        </div>

        <!-- Content -->
        <div *ngIf="loading" class="flex flex-col items-center justify-center py-20 text-gray-400 animate-in fade-in">
           <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-blue-500"></i>
           <p>Loading schedule...</p>
        </div>

        <div *ngIf="!loading && filteredAppointments().length === 0" class="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
           <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-inner">
             <i class="fa-regular fa-calendar-xmark text-4xl"></i>
           </div>
           <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No appointments found</h3>
           <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
             {{ filterStatus !== 'ALL' || searchTerm ? 'Try adjusting your filters or search terms.' : 'You have no appointments scheduled for today.' }}
           </p>
           <button *ngIf="filterStatus !== 'ALL' || searchTerm" (click)="resetFilters()" class="mt-6 text-blue-600 font-bold hover:underline">Clear Filters</button>
        </div>

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

      </div>
    </app-doctor-layout>
  `
})
export class DoctorScheduleComponent implements OnInit {
    private apptApi = inject(AppointmentService);
    private patientApi = inject(PatientProfileService);
    private router = inject(Router);
    private auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    todayDate = new Date();
    todayAppointments: DoctorAppointmentItem[] = [];
    loading = false;

    statusFilterOptions: string[] = ['ALL', 'BOOKED', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    filterStatus: string = 'ALL';
    searchTerm: string = '';

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
                this.joinConsultation(updated);
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
        this.mhForm = { visitDate: new Date().toISOString().slice(0, 10) };
        this.editingHistoryId = null;

        if (a.medicalHistory) {
            const record = a.medicalHistory.find(m => m.appointmentId === a.appointmentId) ||
                a.medicalHistory.find(m => m.visitDate === a.appointmentDate);
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
            }
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

        this.patientApi.addMedicalHistoryWithDoctor(this.selectedAppointment.patientId, this.doctorId, data).subscribe({
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
}
