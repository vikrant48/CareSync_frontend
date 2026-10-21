import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientProfileService } from '../../../core/services/patient-profile.service';
import { MedicineRow, parseMedicines } from '../../utils/medicines.util';

@Component({
    selector: 'app-medical-history-tab',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './medical-history-tab.component.html',
})
export class MedicalHistoryTabComponent implements OnInit {
    private patientProfileService = inject(PatientProfileService);

    @Input() patientId?: number;
    @Input() viewerRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';
    @Input() appointmentStatus?: string;

    /** One row per prescribed medicine with its dose */
    medicineRows(record: { medicine?: string | null; doses?: string | null }): MedicineRow[] {
        return parseMedicines(record?.medicine, record?.doses);
    }

    loading: boolean = false;
    searchQuery: string = '';
    allHistories: any[] = [];
    filteredHistories: any[] = [];

    ngOnInit(): void {
        if (this.patientId) {
            this.loadMedicalHistory();
        }
    }

    loadMedicalHistory(): void {
        if (!this.patientId) return;
        this.loading = true;

        this.patientProfileService.getMedicalHistory(this.patientId).subscribe({
            next: (data: any[]) => {
                this.allHistories = data || [];
                this.filteredHistories = [...this.allHistories];
                this.loading = false;
            },
            error: () => {
                this.allHistories = [];
                this.filteredHistories = [];
                this.loading = false;
            }
        });
    }

    filterRecords(): void {
        if (!this.searchQuery.trim()) {
            this.filteredHistories = [...this.allHistories];
            return;
        }

        const q = this.searchQuery.toLowerCase();
        this.filteredHistories = this.allHistories.filter(r =>
            (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
            (r.symptoms && r.symptoms.toLowerCase().includes(q)) ||
            (r.medicine && r.medicine.toLowerCase().includes(q)) ||
            (r.notes && r.notes.toLowerCase().includes(q))
        );
    }
}
