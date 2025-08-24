import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DoctorService } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { DoctorProfile, UpdateDoctorRequest, CreateExperienceRequest, CreateEducationRequest, CreateCertificateRequest } from '../../models/doctor.model';
import { Experience, Education, Certificate } from '../../models/user.model';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  template: `
    <div class="container mx-auto p-6">
      @if (isLoading) {
        <div class="flex justify-center items-center h-64">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      } @else if (doctor) {
        <!-- Header Section -->
        <mat-card class="mb-6">
          <mat-card-content class="p-6">
            @if (!isEditMode) {
              <!-- View Mode -->
              <div class="flex items-start space-x-6">
                <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <mat-icon class="text-4xl text-blue-600">person</mat-icon>
                </div>
                <div class="flex-1">
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">Dr. {{ doctor.name }}</h1>
                  <p class="text-xl text-blue-600 mb-2">{{ doctor.specialization }}</p>
                  <div class="flex items-center space-x-4 text-sm text-gray-600">
                    <span><mat-icon class="text-sm mr-1">email</mat-icon>{{ doctor.email }}</span>
                    <span><mat-icon class="text-sm mr-1">phone</mat-icon>{{ doctor.contactInfo }}</span>
                    <mat-chip [color]="doctor.isActive ? 'primary' : 'warn'" selected>
                      {{ doctor.isActive ? 'Active' : 'Inactive' }}
                    </mat-chip>
                  </div>
                  <p class="text-sm text-gray-500 mt-2">Member since {{ doctor.createdAt | date:'mediumDate' }}</p>
                  @if (doctor.lastLogin) {
                    <p class="text-sm text-gray-500">Last login: {{ doctor.lastLogin | date:'medium' }}</p>
                  }
                </div>
                <div>
                  <button mat-raised-button color="primary" (click)="enterEditMode()">
                    <mat-icon>edit</mat-icon>
                    Edit Profile
                  </button>
                </div>
              </div>
            } @else {
              <!-- Edit Mode -->
              <form [formGroup]="editForm" (ngSubmit)="saveProfile()">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <mat-form-field appearance="outline">
                    <mat-label>First Name</mat-label>
                    <input matInput formControlName="firstName" required>
                    <mat-error *ngIf="editForm.get('firstName')?.hasError('required')">
                      First name is required
                    </mat-error>
                    <mat-error *ngIf="editForm.get('firstName')?.hasError('minlength')">
                      First name must be at least 2 characters
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Last Name</mat-label>
                    <input matInput formControlName="lastName" required>
                    <mat-error *ngIf="editForm.get('lastName')?.hasError('required')">
                      Last name is required
                    </mat-error>
                    <mat-error *ngIf="editForm.get('lastName')?.hasError('minlength')">
                      Last name must be at least 2 characters
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Specialization</mat-label>
                    <input matInput formControlName="specialization" required>
                    <mat-error *ngIf="editForm.get('specialization')?.hasError('required')">
                      Specialization is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email" required>
                    <mat-error *ngIf="editForm.get('email')?.hasError('required')">
                      Email is required
                    </mat-error>
                    <mat-error *ngIf="editForm.get('email')?.hasError('email')">
                      Please enter a valid email
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="md:col-span-2">
                    <mat-label>Mobile Number</mat-label>
                    <input matInput formControlName="contactInfo">
                  </mat-form-field>

                  <div class="md:col-span-2">
                    <mat-slide-toggle formControlName="isActive">
                      Active Status
                    </mat-slide-toggle>
                  </div>
                </div>

                <div class="flex justify-end space-x-4 mt-6">
                  <button mat-outlined-button type="button" (click)="cancelEdit()" [disabled]="isSaving">
                    <mat-icon>cancel</mat-icon>
                    Cancel
                  </button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="editForm.invalid || isSaving">
                    @if (isSaving) {
                      <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                    } @else {
                      <mat-icon>save</mat-icon>
                    }
                    {{ isSaving ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            }
          </mat-card-content>
        </mat-card>

        <!-- Tabs Section -->
        <mat-tab-group>
          <!-- Experience Tab -->
          <mat-tab label="Experience">
            <div class="p-4">
              <!-- Add Experience Button -->
              @if (!isExperienceFormVisible && (!experiences || experiences.length === 0)) {
                <div class="text-center py-8">
                  <mat-icon class="text-4xl text-gray-400 mb-2">work_off</mat-icon>
                  <p class="text-gray-500 mb-4">No experience information available</p>
                  <button mat-raised-button color="primary" (click)="showAddExperienceForm()">
                    <mat-icon>add</mat-icon>
                    Add Experience
                  </button>
                </div>
              }

              <!-- Experience List -->
              @if (experiences && experiences.length > 0 && !isExperienceFormVisible) {
                <div class="mb-4">
                  <button mat-raised-button color="primary" (click)="showAddExperienceForm()">
                    <mat-icon>add</mat-icon>
                    Add New Experience
                  </button>
                </div>
                <div class="space-y-4">
                  @for (experience of experiences; track experience.id) {
                    <mat-card>
                      <mat-card-content class="p-4">
                        <div class="flex justify-between items-start">
                          <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900">{{ experience.position }}</h3>
                            <p class="text-blue-600 font-medium">{{ experience.hospitalName }}</p>
                            <p class="text-sm text-gray-600 mt-1">{{ experience.yearsOfService }} years of service</p>
                            <p class="text-sm text-gray-700 mt-2">{{ experience.details }}</p>
                          </div>
                          <div class="flex items-center space-x-2">
                            <button mat-icon-button color="primary" (click)="editExperience(experience)" 
                                    matTooltip="Edit Experience">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button mat-icon-button color="warn" (click)="deleteExperience(experience.id)" 
                                    matTooltip="Delete Experience">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              }

              <!-- Experience Form -->
              @if (isExperienceFormVisible) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>
                      {{ editingExperienceId ? 'Edit Experience' : 'Add New Experience' }}
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content class="p-4">
                    <form [formGroup]="experienceForm" (ngSubmit)="saveExperience()">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <mat-form-field appearance="outline">
                          <mat-label>Hospital Name</mat-label>
                          <input matInput formControlName="hospitalName" required>
                          <mat-error *ngIf="experienceForm.get('hospitalName')?.hasError('required')">
                            Hospital name is required
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Position</mat-label>
                          <input matInput formControlName="position" required>
                          <mat-error *ngIf="experienceForm.get('position')?.hasError('required')">
                            Position is required
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Years of Service</mat-label>
                          <input matInput type="number" formControlName="yearsOfService" required min="1">
                          <mat-error *ngIf="experienceForm.get('yearsOfService')?.hasError('required')">
                            Years of service is required
                          </mat-error>
                          <mat-error *ngIf="experienceForm.get('yearsOfService')?.hasError('min')">
                            Years of service must be at least 1
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="md:col-span-2">
                          <mat-label>Details</mat-label>
                          <textarea matInput formControlName="details" rows="3"></textarea>
                        </mat-form-field>
                      </div>

                      <div class="flex justify-end space-x-4 mt-4">
                        <button mat-outlined-button type="button" (click)="cancelExperienceForm()">
                          <mat-icon>cancel</mat-icon>
                          Cancel
                        </button>
                        <button mat-raised-button color="primary" type="submit" 
                                [disabled]="experienceForm.invalid">
                          <mat-icon>save</mat-icon>
                          {{ editingExperienceId ? 'Update' : 'Save' }}
                        </button>
                      </div>
                    </form>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Loading Spinner -->
              @if (isExperienceLoading) {
                <div class="flex justify-center py-8">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Education Tab -->
          <mat-tab label="Education">
            <div class="p-4">
              <!-- Add Education Button -->
              @if (!isEducationFormVisible && (!educations || educations.length === 0)) {
                <div class="text-center py-8">
                  <mat-icon class="text-4xl text-gray-400 mb-2">school_off</mat-icon>
                  <p class="text-gray-500 mb-4">No education information available</p>
                  <button mat-raised-button color="primary" (click)="showAddEducationForm()">
                    <mat-icon>add</mat-icon>
                    Add Education
                  </button>
                </div>
              }

              <!-- Education List -->
              @if (educations && educations.length > 0 && !isEducationFormVisible) {
                <div class="mb-4">
                  <button mat-raised-button color="primary" (click)="showAddEducationForm()">
                    <mat-icon>add</mat-icon>
                    Add New Education
                  </button>
                </div>
                <div class="space-y-4">
                  @for (education of educations; track education.id) {
                    <mat-card>
                      <mat-card-content class="p-4">
                        <div class="flex justify-between items-start">
                          <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900">{{ education.degree }}</h3>
                            <p class="text-blue-600 font-medium">{{ education.institution }}</p>
                            <p class="text-sm text-gray-600 mt-1">Graduated: {{ education.yearOfCompletion }}</p>
                            <p class="text-sm text-gray-700 mt-2">{{ education.details }}</p>
                          </div>
                          <div class="flex items-center space-x-2">
                            <button mat-icon-button color="primary" (click)="editEducation(education)" 
                                    matTooltip="Edit Education">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button mat-icon-button color="warn" (click)="deleteEducation(education.id)" 
                                    matTooltip="Delete Education">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              }

              <!-- Education Form -->
              @if (isEducationFormVisible) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>
                      {{ editingEducationId ? 'Edit Education' : 'Add New Education' }}
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content class="p-4">
                    <form [formGroup]="educationForm" (ngSubmit)="saveEducation()">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <mat-form-field appearance="outline">
                          <mat-label>Degree</mat-label>
                          <input matInput formControlName="degree" required>
                          <mat-error *ngIf="educationForm.get('degree')?.hasError('required')">
                            Degree is required
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Institution</mat-label>
                          <input matInput formControlName="institution" required>
                          <mat-error *ngIf="educationForm.get('institution')?.hasError('required')">
                            Institution is required
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Year of Completion</mat-label>
                          <input matInput type="number" formControlName="yearOfCompletion" required>
                          <mat-error *ngIf="educationForm.get('yearOfCompletion')?.hasError('required')">
                            Year of completion is required
                          </mat-error>
                          <mat-error *ngIf="educationForm.get('yearOfCompletion')?.hasError('min')">
                            Year must be 1900 or later
                          </mat-error>
                          <mat-error *ngIf="educationForm.get('yearOfCompletion')?.hasError('max')">
                            Year cannot be in the future
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="md:col-span-2">
                          <mat-label>Details</mat-label>
                          <textarea matInput formControlName="details" rows="3"></textarea>
                        </mat-form-field>
                      </div>

                      <div class="flex justify-end space-x-4 mt-4">
                        <button mat-outlined-button type="button" (click)="cancelEducationForm()">
                          <mat-icon>cancel</mat-icon>
                          Cancel
                        </button>
                        <button mat-raised-button color="primary" type="submit" 
                                [disabled]="educationForm.invalid">
                          <mat-icon>save</mat-icon>
                          {{ editingEducationId ? 'Update' : 'Save' }}
                        </button>
                      </div>
                    </form>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Loading Spinner -->
              @if (isEducationLoading) {
                <div class="flex justify-center py-8">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Certificates Tab -->
          <mat-tab label="Certificates">
            <div class="p-4">
              <!-- Add Certificate Button -->
              @if (!isCertificateFormVisible && (!certificates || certificates.length === 0)) {
                <div class="text-center py-8">
                  <mat-icon class="text-4xl text-gray-400 mb-2">verified</mat-icon>
                  <p class="text-gray-500 mb-4">No certificates available</p>
                  <button mat-raised-button color="primary" (click)="showAddCertificateForm()">
                    <mat-icon>add</mat-icon>
                    Add Certificate
                  </button>
                </div>
              }

              <!-- Certificate List -->
              @if (certificates && certificates.length > 0 && !isCertificateFormVisible) {
                <div class="mb-4">
                  <button mat-raised-button color="primary" (click)="showAddCertificateForm()">
                    <mat-icon>add</mat-icon>
                    Add New Certificate
                  </button>
                </div>
                <div class="space-y-4">
                  @for (certificate of certificates; track certificate.id) {
                    <mat-card>
                      <mat-card-content class="p-4">
                        <div class="flex justify-between items-start">
                          <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900">{{ certificate.name }}</h3>
                            @if (certificate.issuingOrganization) {
                              <p class="text-blue-600 font-medium">{{ certificate.issuingOrganization }}</p>
                            }
                            @if (certificate.issueDate || certificate.expiryDate) {
                              <p class="text-sm text-gray-600 mt-1">
                                @if (certificate.issueDate) {
                                  Issued: {{ certificate.issueDate | date:'mediumDate' }}
                                }
                                @if (certificate.issueDate && certificate.expiryDate) { | }
                                @if (certificate.expiryDate) {
                                  Expires: {{ certificate.expiryDate | date:'mediumDate' }}
                                }
                              </p>
                            }
                            @if (certificate.credentialId) {
                              <p class="text-sm text-gray-600 mt-1">ID: {{ certificate.credentialId }}</p>
                            }
                            <p class="text-sm text-gray-700 mt-2">{{ certificate.details }}</p>
                            <div class="flex items-center space-x-4 mt-2">
                              @if (certificate.url) {
                                <a [href]="certificate.url" target="_blank" 
                                   class="inline-flex items-center text-blue-600 hover:text-blue-800">
                                  <mat-icon class="text-sm mr-1">link</mat-icon>
                                  View Certificate
                                </a>
                              }
                              @if (certificate.credentialUrl) {
                                <a [href]="certificate.credentialUrl" target="_blank" 
                                   class="inline-flex items-center text-blue-600 hover:text-blue-800">
                                  <mat-icon class="text-sm mr-1">verified</mat-icon>
                                  Verify Credential
                                </a>
                              }
                            </div>
                          </div>
                          <div class="flex items-center space-x-2">
                            <button mat-icon-button color="primary" (click)="editCertificate(certificate)" 
                                    matTooltip="Edit Certificate">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button mat-icon-button color="warn" (click)="deleteCertificate(certificate.id)" 
                                    matTooltip="Delete Certificate">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              }

              <!-- Certificate Form -->
              @if (isCertificateFormVisible) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>
                      {{ editingCertificateId ? 'Edit Certificate' : 'Add New Certificate' }}
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content class="p-4">
                    <form [formGroup]="certificateForm" (ngSubmit)="saveCertificate()">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <mat-form-field appearance="outline">
                          <mat-label>Certificate Name</mat-label>
                          <input matInput formControlName="name" required>
                          <mat-error *ngIf="certificateForm.get('name')?.hasError('required')">
                            Certificate name is required
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Certificate URL</mat-label>
                          <input matInput formControlName="url" required>
                          <mat-error *ngIf="certificateForm.get('url')?.hasError('required')">
                            Certificate URL is required
                          </mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Issuing Organization</mat-label>
                          <input matInput formControlName="issuingOrganization">
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Credential ID</mat-label>
                          <input matInput formControlName="credentialId">
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Issue Date</mat-label>
                          <input matInput type="date" formControlName="issueDate">
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Expiry Date</mat-label>
                          <input matInput type="date" formControlName="expiryDate">
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="md:col-span-2">
                          <mat-label>Credential URL</mat-label>
                          <input matInput formControlName="credentialUrl">
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="md:col-span-2">
                          <mat-label>Details</mat-label>
                          <textarea matInput formControlName="details" rows="3"></textarea>
                        </mat-form-field>
                      </div>

                      <div class="flex justify-end space-x-4 mt-4">
                        <button mat-outlined-button type="button" (click)="cancelCertificateForm()">
                          <mat-icon>cancel</mat-icon>
                          Cancel
                        </button>
                        <button mat-raised-button color="primary" type="submit" 
                                [disabled]="certificateForm.invalid">
                          <mat-icon>save</mat-icon>
                          {{ editingCertificateId ? 'Update' : 'Save' }}
                        </button>
                      </div>
                    </form>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Loading Spinner -->
              @if (isCertificateLoading) {
                <div class="flex justify-center py-8">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Appointments Tab -->
          <mat-tab label="Recent Appointments">
            <div class="p-4">
              @if (doctor.appointments && doctor.appointments.length > 0) {
                <div class="space-y-4">
                  @for (appointment of getRecentAppointments(); track appointment.id) {
                    <mat-card>
                      <mat-card-content class="p-4">
                        <div class="flex justify-between items-start">
                          <div>
                            <div class="flex items-center space-x-2 mb-2">
                              <mat-chip [color]="getStatusColor(appointment.status)" selected>
                                {{ appointment.status }}
                              </mat-chip>
                              <span class="text-sm text-gray-500">ID: {{ appointment.id }}</span>
                            </div>
                            <p class="text-sm font-medium text-gray-700">{{ appointment.appointmentDateTime | date:'medium' }}</p>
                            <p class="text-sm text-gray-600 mt-1">Reason: {{ appointment.reason }}</p>
                            <p class="text-xs text-gray-500 mt-2">Last updated: {{ appointment.updatedAt | date:'short' }}</p>
                          </div>
                          <mat-icon class="text-gray-400">event</mat-icon>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              } @else {
                <div class="text-center py-8">
                  <mat-icon class="text-4xl text-gray-400 mb-2">event_busy</mat-icon>
                  <p class="text-gray-500">No appointments found</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Feedback Tab -->
          <mat-tab label="Patient Feedback">
            <div class="p-4">
              @if (doctor.feedbacks && doctor.feedbacks.length > 0) {
                <div class="space-y-4">
                  @for (feedback of doctor.feedbacks; track feedback.id) {
                    <mat-card>
                      <mat-card-content class="p-4">
                        <div class="flex justify-between items-start">
                          <div>
                            <div class="flex items-center space-x-2 mb-2">
                              <span class="font-medium">{{ feedback.patientName }}</span>
                              <div class="flex items-center">
                                @for (star of [1,2,3,4,5]; track star) {
                                  <mat-icon class="text-sm" [class.text-yellow-500]="star <= feedback.rating" 
                                           [class.text-gray-300]="star > feedback.rating">star</mat-icon>
                                }
                              </div>
                            </div>
                            <p class="text-sm text-gray-700">{{ feedback.comment }}</p>
                            <p class="text-xs text-gray-500 mt-2">{{ feedback.createdAt | date:'medium' }}</p>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              } @else {
                <div class="text-center py-8">
                  <mat-icon class="text-4xl text-gray-400 mb-2">feedback</mat-icon>
                  <p class="text-gray-500">No patient feedback available</p>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <mat-card class="p-6">
          <div class="text-center py-12">
            <mat-icon class="text-6xl text-gray-400 mb-4">error</mat-icon>
            <h2 class="text-xl font-semibold text-gray-700 mb-2">Profile Not Found</h2>
            <p class="text-gray-500 mb-6">The requested doctor profile could not be found.</p>
            <button mat-raised-button color="primary" routerLink="/doctor/dashboard">
              <mat-icon>arrow_back</mat-icon>
              Back to Dashboard
            </button>
          </div>
        </mat-card>
      }

      <!-- Back Button -->
      <div class="mt-6 flex justify-center">
        <button mat-outlined-button routerLink="/doctor/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }
    
    mat-tab-group {
      margin-top: 1rem;
    }
    
    .mat-mdc-tab-body-wrapper {
      padding-top: 0;
    }
  `]
})
export class DoctorProfileComponent implements OnInit {
  doctor: DoctorProfile | null = null;
  isLoading = true;
  username: string = '';
  isEditMode = false;
  editForm: FormGroup;
  isSaving = false;
  
  // Experience management properties
  experiences: Experience[] = [];
  isExperienceFormVisible = false;
  experienceForm: FormGroup;
  editingExperienceId: number | null = null;
  isExperienceLoading = false;

  // Education management properties
  educations: Education[] = [];
  isEducationFormVisible = false;
  educationForm: FormGroup;
  editingEducationId: number | null = null;
  isEducationLoading = false;

  // Certificate management properties
  certificates: Certificate[] = [];
  isCertificateFormVisible = false;
  certificateForm: FormGroup;
  editingCertificateId: number | null = null;
  isCertificateLoading = false;

  constructor(
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.editForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      specialization: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      contactInfo: [''],
      isActive: [true]
    });
    
    // Initialize experience form
    this.experienceForm = this.fb.group({
      hospitalName: ['', [Validators.required]],
      position: ['', [Validators.required]],
      yearsOfService: ['', [Validators.required, Validators.min(1)]],
      details: ['']
    });
    
    // Initialize education form
    this.educationForm = this.fb.group({
      degree: ['', [Validators.required]],
      institution: ['', [Validators.required]],
      yearOfCompletion: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      details: ['']
    });
    
    // Initialize certificate form
    this.certificateForm = this.fb.group({
      name: ['', [Validators.required]],
      url: ['', [Validators.required]],
      details: [''],
      issuingOrganization: [''],
      issueDate: [''],
      expiryDate: [''],
      credentialId: [''],
      credentialUrl: ['']
    });
  }

  ngOnInit(): void {
    // Get username from route parameters or current logged-in user
    this.route.params.subscribe(params => {
      if (params['username']) {
        // If username is provided in route, use it
        this.username = params['username'];
        console.log('Username from route:', this.username);
      } else {
        // If no username in route, get current logged-in user's username
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.username) {
          this.username = currentUser.username;
          console.log('Username from current user:', this.username);
        } else {
          console.error('No current user found or user has no username');
          // Redirect to login if no user is found
          return;
        }
      }
      this.loadDoctorProfile();
      this.loadExperiences();
      this.loadEducations();
      this.loadCertificates();
    });
  }

  loadDoctorProfile(): void {
    this.isLoading = true;
    this.doctorService.getDoctorProfile(this.username).subscribe({
      next: (doctor: DoctorProfile) => {
        this.doctor = doctor;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading doctor profile:', error);
        this.snackBar.open('Failed to load doctor profile', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'primary';
      case 'BOOKED':
      case 'CONFIRMED':
        return 'accent';
      case 'CANCELLED':
        return 'warn';
      default:
        return '';
    }
  }

  getRecentAppointments() {
    if (!this.doctor?.appointments) return [];
    return this.doctor.appointments
      .sort((a, b) => new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime())
      .slice(0, 10); // Show only recent 10 appointments
  }

  enterEditMode(): void {
    if (this.doctor) {
      this.editForm.patchValue({
        firstName: this.doctor.firstName,
        lastName: this.doctor.lastName,
        specialization: this.doctor.specialization,
        email: this.doctor.email,
        contactInfo: this.doctor.contactInfo,
        isActive: this.doctor.isActive
      });
      this.isEditMode = true;
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.editForm.reset();
  }

  saveProfile(): void {
    if (this.editForm.valid && this.doctor) {
      this.isSaving = true;
      const updateRequest: UpdateDoctorRequest = this.editForm.value;
      
      console.log('🚀 DoctorProfileComponent.saveProfile called:');
      console.log('  - Username:', this.username);
      console.log('  - Form data:', updateRequest);
      console.log('  - Doctor object:', this.doctor);
      
      this.doctorService.updateDoctorProfile(this.username, updateRequest).subscribe({
        next: (updatedDoctor) => {
          // Update the local doctor object with the response
          if (this.doctor) {
            this.doctor.firstName = updatedDoctor.firstName;
            this.doctor.lastName = updatedDoctor.lastName;
            this.doctor.specialization = updatedDoctor.specialization;
            this.doctor.email = updatedDoctor.email;
            this.doctor.contactInfo = updatedDoctor.contactInfo;
            this.doctor.isActive = updatedDoctor.isActive;
            this.doctor.name = `${updatedDoctor.firstName} ${updatedDoctor.lastName}`;
          }
          
          this.isEditMode = false;
          this.isSaving = false;
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.isSaving = false;
          this.snackBar.open('Failed to update profile. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  // Experience Management Methods
  loadExperiences(): void {
    this.isExperienceLoading = true;
    this.doctorService.getDoctorExperiences(this.username).subscribe({
      next: (experiences) => {
        this.experiences = experiences;
        this.isExperienceLoading = false;
      },
      error: (error) => {
        console.error('Error loading experiences:', error);
        this.isExperienceLoading = false;
      }
    });
  }

  showAddExperienceForm(): void {
    this.isExperienceFormVisible = true;
    this.editingExperienceId = null;
    this.experienceForm.reset();
  }

  editExperience(experience: Experience): void {
    this.isExperienceFormVisible = true;
    this.editingExperienceId = experience.id;
    this.experienceForm.patchValue({
      hospitalName: experience.hospitalName,
      position: experience.position,
      yearsOfService: experience.yearsOfService,
      details: experience.details
    });
  }

  cancelExperienceForm(): void {
    this.isExperienceFormVisible = false;
    this.editingExperienceId = null;
    this.experienceForm.reset();
  }

  saveExperience(): void {
    if (this.experienceForm.valid) {
      const experienceData: CreateExperienceRequest = this.experienceForm.value;
      
      if (this.editingExperienceId) {
        // Update existing experience
        this.doctorService.updateExperience(this.username, this.editingExperienceId, experienceData).subscribe({
          next: () => {
            this.snackBar.open('Experience updated successfully!', 'Close', { duration: 3000 });
            this.loadExperiences();
            this.cancelExperienceForm();
          },
          error: (error) => {
            console.error('Error updating experience:', error);
            this.snackBar.open('Failed to update experience', 'Close', { duration: 3000 });
          }
        });
      } else {
        // Add new experience
        this.doctorService.addExperience(this.username, experienceData).subscribe({
          next: () => {
            this.snackBar.open('Experience added successfully!', 'Close', { duration: 3000 });
            this.loadExperiences();
            this.cancelExperienceForm();
          },
          error: (error) => {
            console.error('Error adding experience:', error);
            this.snackBar.open('Failed to add experience', 'Close', { duration: 3000 });
          }
        });
      }
    }
  }

  deleteExperience(experienceId: number): void {
    if (confirm('Are you sure you want to delete this experience?')) {
      this.doctorService.deleteExperience(this.username, experienceId).subscribe({
        next: () => {
          this.snackBar.open('Experience deleted successfully!', 'Close', { duration: 3000 });
          this.loadExperiences();
        },
        error: (error) => {
          console.error('Error deleting experience:', error);
          this.snackBar.open('Failed to delete experience', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Education management methods
  loadEducations(): void {
    this.isEducationLoading = true;
    this.doctorService.getDoctorEducations(this.username).subscribe({
      next: (educations: Education[]) => {
        this.educations = educations;
        this.isEducationLoading = false;
      },
      error: (error) => {
        console.error('Error loading educations:', error);
        this.snackBar.open('Failed to load educations', 'Close', { duration: 3000 });
        this.isEducationLoading = false;
      }
    });
  }

  showAddEducationForm(): void {
    this.isEducationFormVisible = true;
    this.editingEducationId = null;
    this.educationForm.reset();
  }

  editEducation(education: Education): void {
    this.isEducationFormVisible = true;
    this.editingEducationId = education.id;
    this.educationForm.patchValue({
      degree: education.degree,
      institution: education.institution,
      yearOfCompletion: education.yearOfCompletion,
      details: education.details
    });
  }

  cancelEducationForm(): void {
    this.isEducationFormVisible = false;
    this.editingEducationId = null;
    this.educationForm.reset();
  }

  saveEducation(): void {
    if (this.educationForm.valid) {
      const educationData: CreateEducationRequest = this.educationForm.value;

      if (this.editingEducationId) {
        // Update existing education
        this.doctorService.updateEducation(this.username, this.editingEducationId, educationData).subscribe({
          next: () => {
            this.snackBar.open('Education updated successfully!', 'Close', { duration: 3000 });
            this.loadEducations();
            this.cancelEducationForm();
          },
          error: (error) => {
            console.error('Error updating education:', error);
            this.snackBar.open('Failed to update education', 'Close', { duration: 3000 });
          }
        });
      } else {
        // Add new education
        this.doctorService.addEducation(this.username, educationData).subscribe({
          next: () => {
            this.snackBar.open('Education added successfully!', 'Close', { duration: 3000 });
            this.loadEducations();
            this.cancelEducationForm();
          },
          error: (error) => {
            console.error('Error adding education:', error);
            this.snackBar.open('Failed to add education', 'Close', { duration: 3000 });
          }
        });
      }
    }
  }

  deleteEducation(educationId: number): void {
    if (confirm('Are you sure you want to delete this education?')) {
      this.doctorService.deleteEducation(this.username, educationId).subscribe({
        next: () => {
          this.snackBar.open('Education deleted successfully!', 'Close', { duration: 3000 });
          this.loadEducations();
        },
        error: (error) => {
          console.error('Error deleting education:', error);
          this.snackBar.open('Failed to delete education', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Certificate Management Methods
  loadCertificates(): void {
    this.isCertificateLoading = true;
    this.doctorService.getDoctorCertificates(this.username).subscribe({
      next: (certificates) => {
        this.certificates = certificates;
        this.isCertificateLoading = false;
      },
      error: (error) => {
        console.error('Error loading certificates:', error);
        this.isCertificateLoading = false;
      }
    });
  }

  showAddCertificateForm(): void {
    this.isCertificateFormVisible = true;
    this.editingCertificateId = null;
    this.certificateForm.reset();
  }

  editCertificate(certificate: Certificate): void {
    this.isCertificateFormVisible = true;
    this.editingCertificateId = certificate.id;
    this.certificateForm.patchValue({
      name: certificate.name,
      url: certificate.url,
      details: certificate.details,
      issuingOrganization: certificate.issuingOrganization,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      credentialId: certificate.credentialId,
      credentialUrl: certificate.credentialUrl
    });
  }

  cancelCertificateForm(): void {
    this.isCertificateFormVisible = false;
    this.editingCertificateId = null;
    this.certificateForm.reset();
  }

  saveCertificate(): void {
    if (this.certificateForm.valid) {
      const certificateData: CreateCertificateRequest = this.certificateForm.value;
      
      if (this.editingCertificateId) {
        // Update existing certificate
        this.doctorService.updateCertificate(this.username, this.editingCertificateId, certificateData).subscribe({
          next: () => {
            this.snackBar.open('Certificate updated successfully!', 'Close', { duration: 3000 });
            this.loadCertificates();
            this.cancelCertificateForm();
          },
          error: (error) => {
            console.error('Error updating certificate:', error);
            this.snackBar.open('Failed to update certificate', 'Close', { duration: 3000 });
          }
        });
      } else {
        // Add new certificate
        this.doctorService.addCertificate(this.username, certificateData).subscribe({
          next: () => {
            this.snackBar.open('Certificate added successfully!', 'Close', { duration: 3000 });
            this.loadCertificates();
            this.cancelCertificateForm();
          },
          error: (error) => {
            console.error('Error adding certificate:', error);
            this.snackBar.open('Failed to add certificate', 'Close', { duration: 3000 });
          }
        });
      }
    }
  }

  deleteCertificate(certificateId: number): void {
    if (confirm('Are you sure you want to delete this certificate?')) {
      this.doctorService.deleteCertificate(this.username, certificateId).subscribe({
        next: () => {
          this.snackBar.open('Certificate deleted successfully!', 'Close', { duration: 3000 });
          this.loadCertificates();
        },
        error: (error) => {
          console.error('Error deleting certificate:', error);
          this.snackBar.open('Failed to delete certificate', 'Close', { duration: 3000 });
        }
      });
    }
  }
}