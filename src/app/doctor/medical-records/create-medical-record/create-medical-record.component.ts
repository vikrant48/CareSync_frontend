import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { DoctorService } from '../../../services/doctor.service';
import { TodayAppointmentForRecord, CreateMedicalRecordRequest, COMMON_SYMPTOMS, COMMON_TREATMENTS } from '../../../models/medical-record.model';

@Component({
  selector: 'app-create-medical-record',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="create-record-dialog">
      <h2 mat-dialog-title>
        <mat-icon>assignment</mat-icon>
        Create Medical Record
      </h2>

      <mat-dialog-content>
        <!-- Patient Info Card -->
        <mat-card class="patient-info-card">
          <mat-card-header>
            <mat-card-title>Patient Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="patient-details">
              <div class="detail-row">
                <mat-icon>person</mat-icon>
                <span><strong>Name:</strong> {{ data.appointment.patientName }}</span>
              </div>
              <div class="detail-row">
                <mat-icon>email</mat-icon>
                <span><strong>Email:</strong> {{ data.appointment.patientEmail }}</span>
              </div>
              <div class="detail-row">
                <mat-icon>schedule</mat-icon>
                <span><strong>Appointment Time:</strong> {{ data.appointment.appointmentTime }}</span>
              </div>
              <div class="detail-row">
                <mat-icon>today</mat-icon>
                <span><strong>Visit Date:</strong> {{ getCurrentDate() }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Medical Record Form -->
        <form [formGroup]="medicalRecordForm" class="medical-record-form">
          <!-- Symptoms Section -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Symptoms</mat-card-title>
              <mat-card-subtitle>Select or add patient symptoms</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <!-- Common Symptoms -->
              <div class="common-symptoms">
                <h4>Common Symptoms</h4>
                <div class="symptoms-grid">
                  <div *ngFor="let category of commonSymptoms" class="symptom-category">
                    <h5>{{ category.category }}</h5>
                    <div class="symptom-chips">
                      <mat-chip 
                        *ngFor="let symptom of category.symptoms" 
                        [class.selected]="isSymptomSelected(symptom)"
                        (click)="toggleSymptom(symptom)"
                        class="symptom-chip">
                        {{ symptom }}
                      </mat-chip>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Custom Symptom Input -->
              <mat-form-field class="full-width">
                <mat-label>Add Custom Symptom</mat-label>
                <input matInput 
                       #customSymptomInput
                       (keyup.enter)="addCustomSymptom(customSymptomInput.value); customSymptomInput.value=''">
                <button matSuffix mat-icon-button 
                        (click)="addCustomSymptom(customSymptomInput.value); customSymptomInput.value=''">
                  <mat-icon>add</mat-icon>
                </button>
              </mat-form-field>

              <!-- Selected Symptoms -->
              <div class="selected-symptoms" *ngIf="selectedSymptoms.length > 0">
                <h4>Selected Symptoms</h4>
                <mat-chip-listbox>
                  <mat-chip-option *ngFor="let symptom of selectedSymptoms" 
                                   (removed)="removeSymptom(symptom)">
                    {{ symptom }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip-option>
                </mat-chip-listbox>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Diagnosis Section -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Diagnosis</mat-card-title>
              <mat-card-subtitle>Primary diagnosis and assessment</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field class="full-width">
                <mat-label>Diagnosis *</mat-label>
                <textarea matInput 
                          formControlName="diagnosis"
                          rows="3"
                          placeholder="Enter primary diagnosis...">
                </textarea>
                <mat-error *ngIf="medicalRecordForm.get('diagnosis')?.hasError('required')">
                  Diagnosis is required
                </mat-error>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- Treatment Section -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Treatment Plan</mat-card-title>
              <mat-card-subtitle>Recommended treatments and interventions</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <!-- Common Treatments -->
              <div class="common-treatments">
                <h4>Common Treatments</h4>
                <div class="treatment-chips">
                  <mat-chip 
                    *ngFor="let treatment of commonTreatments" 
                    [class.selected]="isTreatmentSelected(treatment)"
                    (click)="toggleTreatment(treatment)"
                    class="treatment-chip">
                    {{ treatment }}
                  </mat-chip>
                </div>
              </div>

              <!-- Treatment Details -->
              <div formArrayName="treatments">
                <div *ngFor="let treatment of treatmentsArray.controls; let i = index" 
                     [formGroupName]="i" 
                     class="treatment-item">
                  <mat-card class="treatment-card">
                    <mat-card-content>
                      <div class="treatment-header">
                        <h4>Treatment {{ i + 1 }}</h4>
                        <button mat-icon-button 
                                type="button"
                                (click)="removeTreatment(i)"
                                [disabled]="treatmentsArray.length === 1">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                      
                      <div class="treatment-fields">
                        <mat-form-field>
                          <mat-label>Treatment Name *</mat-label>
                          <input matInput formControlName="name" placeholder="e.g., Medication, Physical Therapy">
                          <mat-error *ngIf="treatment.get('name')?.hasError('required')">
                            Treatment name is required
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field>
                          <mat-label>Description *</mat-label>
                          <textarea matInput 
                                    formControlName="description" 
                                    rows="2"
                                    placeholder="Detailed description of treatment">
                          </textarea>
                          <mat-error *ngIf="treatment.get('description')?.hasError('required')">
                            Description is required
                          </mat-error>
                        </mat-form-field>

                        <div class="treatment-details-row">
                          <mat-form-field>
                            <mat-label>Duration</mat-label>
                            <input matInput formControlName="duration" placeholder="e.g., 2 weeks, 1 month">
                          </mat-form-field>

                          <mat-form-field>
                            <mat-label>Frequency</mat-label>
                            <input matInput formControlName="frequency" placeholder="e.g., Twice daily, Once weekly">
                          </mat-form-field>
                        </div>

                        <mat-form-field class="full-width">
                          <mat-label>Instructions</mat-label>
                          <textarea matInput 
                                    formControlName="instructions" 
                                    rows="2"
                                    placeholder="Special instructions for the patient">
                          </textarea>
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>

              <button mat-stroked-button 
                      type="button"
                      (click)="addTreatment()"
                      class="add-treatment-btn">
                <mat-icon>add</mat-icon>
                Add Another Treatment
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Additional Notes -->
          <mat-card class="form-section">
            <mat-card-header>
              <mat-card-title>Additional Notes</mat-card-title>
              <mat-card-subtitle>Any additional observations or recommendations</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field class="full-width">
                <mat-label>Notes</mat-label>
                <textarea matInput 
                          formControlName="notes"
                          rows="3"
                          placeholder="Additional notes, observations, or recommendations...">
                </textarea>
              </mat-form-field>

              <mat-form-field class="full-width">
                <mat-label>Follow-up Date</mat-label>
                <input matInput 
                       [matDatepicker]="followUpPicker"
                       formControlName="followUpDate"
                       placeholder="Select follow-up date">
                <mat-datepicker-toggle matSuffix [for]="followUpPicker"></mat-datepicker-toggle>
                <mat-datepicker #followUpPicker></mat-datepicker>
              </mat-form-field>
            </mat-card-content>
          </mat-card>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSave()"
                [disabled]="medicalRecordForm.invalid || saving">
          <mat-icon *ngIf="saving">hourglass_empty</mat-icon>
          <mat-icon *ngIf="!saving">save</mat-icon>
          {{ saving ? 'Saving...' : 'Save Medical Record' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .create-record-dialog {
      max-height: 90vh;
      overflow-y: auto;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #1976d2;
    }

    mat-dialog-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .patient-info-card {
      margin-bottom: 24px;
      background: #f5f5f5;
    }

    .patient-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-row mat-icon {
      color: #666;
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
    }

    .medical-record-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .common-symptoms {
      margin-bottom: 16px;
    }

    .symptoms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }

    .symptom-category h5 {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .symptom-chips, .treatment-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .symptom-chip, .treatment-chip {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .symptom-chip:hover, .treatment-chip:hover {
       transform: translateY(-1px);
     }

     .symptom-chip.selected, .treatment-chip.selected {
       background-color: #1976d2 !important;
       color: white !important;
     }

    .selected-symptoms {
      margin-top: 16px;
    }

    .selected-symptoms h4 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .common-treatments {
      margin-bottom: 24px;
    }

    .common-treatments h4 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .treatment-item {
      margin-bottom: 16px;
    }

    .treatment-card {
      background: #fafafa;
    }

    .treatment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .treatment-header h4 {
      margin: 0;
      color: #333;
    }

    .treatment-fields {
      display: grid;
      gap: 16px;
    }

    .treatment-details-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .add-treatment-btn {
      margin-top: 16px;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .symptoms-grid {
        grid-template-columns: 1fr;
      }

      .treatment-details-row {
        grid-template-columns: 1fr;
      }

      mat-dialog-content {
        padding: 0 16px;
      }

      mat-dialog-actions {
        padding: 16px;
      }
    }
  `]
})
export class CreateMedicalRecordComponent implements OnInit {
  medicalRecordForm: FormGroup;
  selectedSymptoms: string[] = [];
  commonSymptoms = COMMON_SYMPTOMS;
  commonTreatments = COMMON_TREATMENTS;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CreateMedicalRecordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      appointment: TodayAppointmentForRecord;
      doctorId: number;
    }
  ) {
    this.medicalRecordForm = this.createForm();
  }

  ngOnInit(): void {
    // Auto-populate form with appointment data
    this.medicalRecordForm.patchValue({
      visitDate: new Date(),
      followUpDate: this.getDefaultFollowUpDate()
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      diagnosis: ['', Validators.required],
      treatments: this.fb.array([this.createTreatmentGroup()]),
      notes: [''],
      followUpDate: [null]
    });
  }

  createTreatmentGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      duration: [''],
      frequency: [''],
      instructions: ['']
    });
  }

  get treatmentsArray(): FormArray {
    return this.medicalRecordForm.get('treatments') as FormArray;
  }

  addTreatment(): void {
    this.treatmentsArray.push(this.createTreatmentGroup());
  }

  removeTreatment(index: number): void {
    if (this.treatmentsArray.length > 1) {
      this.treatmentsArray.removeAt(index);
    }
  }

  isSymptomSelected(symptom: string): boolean {
    return this.selectedSymptoms.includes(symptom);
  }

  toggleSymptom(symptom: string): void {
    const index = this.selectedSymptoms.indexOf(symptom);
    if (index > -1) {
      this.selectedSymptoms.splice(index, 1);
    } else {
      this.selectedSymptoms.push(symptom);
    }
  }

  addCustomSymptom(symptom: string): void {
    if (symptom.trim() && !this.selectedSymptoms.includes(symptom.trim())) {
      this.selectedSymptoms.push(symptom.trim());
    }
  }

  removeSymptom(symptom: string): void {
    const index = this.selectedSymptoms.indexOf(symptom);
    if (index > -1) {
      this.selectedSymptoms.splice(index, 1);
    }
  }

  isTreatmentSelected(treatment: string): boolean {
    return this.treatmentsArray.value.some((t: any) => t.name === treatment);
  }

  toggleTreatment(treatment: string): void {
    const existingIndex = this.treatmentsArray.value.findIndex((t: any) => t.name === treatment);
    
    if (existingIndex > -1) {
      // Remove if exists
      this.removeTreatment(existingIndex);
    } else {
      // Add new treatment
      const newTreatment = this.createTreatmentGroup();
      newTreatment.patchValue({
        name: treatment,
        description: `${treatment} as recommended`
      });
      this.treatmentsArray.push(newTreatment);
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getDefaultFollowUpDate(): Date {
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 14); // Default to 2 weeks from now
    return followUp;
  }

  onSave(): void {
    if (this.medicalRecordForm.valid) {
      this.saving = true;
      
      const formValue = this.medicalRecordForm.value;
      const medicalRecordData: CreateMedicalRecordRequest = {
        appointmentId: this.data.appointment.id,
        symptoms: this.selectedSymptoms,
        diagnosis: formValue.diagnosis,
        treatment: formValue.treatments,
        notes: formValue.notes,
        followUpDate: formValue.followUpDate
      };

      this.doctorService.createMedicalRecord(medicalRecordData).subscribe({
        next: (result) => {
          this.saving = false;
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error creating medical record:', error);
          this.saving = false;
          this.snackBar.open('Error creating medical record', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.medicalRecordForm.controls).forEach(key => {
      const control = this.medicalRecordForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach(nestedKey => {
              arrayControl.get(nestedKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }
}