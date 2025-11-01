import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../core/services/appointment.service';
import { Doctor } from '../core/services/doctor.service';

@Component({
  selector: 'app-emergency-appointment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="panel p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button class="absolute top-2 right-2 btn-secondary" (click)="close()">✕</button>
        
        <div class="space-y-6">
          <!-- Header -->
          <div class="text-center">
            <div class="text-2xl font-bold text-red-500 mb-2">🚨 Emergency Appointment</div>
            <p class="text-gray-300 text-sm">
              Book an immediate appointment with an available doctor. 
              This will schedule an appointment for right now.
            </p>
          </div>

          <!-- Warning Notice -->
          <div class="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <div class="text-red-400 text-xl">⚠️</div>
              <div class="text-sm">
                <div class="font-semibold text-red-400 mb-1">Important Notice:</div>
                <ul class="text-gray-300 space-y-1 text-xs">
                  <li>• Emergency appointments are scheduled for immediate consultation</li>
                  <li>• The appointment will be booked for the current time</li>
                  <li>• Please ensure the doctor is available before booking</li>
                  <li>• Additional emergency fees may apply</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Doctor Selection -->
          <div class="space-y-3">
            <label class="block text-sm font-medium">
              Select Doctor <span class="text-red-400">*</span>
            </label>
            <select 
              class="input w-full" 
              [(ngModel)]="selectedDoctorId"
              [class.border-red-500]="showValidation && !selectedDoctorId"
            >
              <option value="">Choose a doctor for emergency consultation</option>
              <option *ngFor="let doctor of availableDoctors" [value]="doctor.id">
                Dr. {{ doctor.firstName }} {{ doctor.lastName }} 
                <span *ngIf="doctor.specialization"> - {{ doctor.specialization }}</span>
                <span *ngIf="doctor.consultationFees"> (₹{{ doctor.consultationFees }})</span>
              </option>
            </select>
            <div *ngIf="showValidation && !selectedDoctorId" class="text-red-400 text-xs">
              Please select a doctor for the emergency appointment
            </div>
          </div>

          <!-- Selected Doctor Details -->
          <div *ngIf="selectedDoctor" class="bg-gray-800/50 rounded-lg p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-white">
                <img *ngIf="selectedDoctor.profileImageUrl" 
                     [src]="selectedDoctor.profileImageUrl" 
                     class="w-full h-full object-cover" 
                     (error)="selectedDoctor.profileImageUrl = ''" />
                <span *ngIf="!selectedDoctor.profileImageUrl">
                  {{ (selectedDoctor.firstName?.charAt(0) || 'D') }}
                </span>
              </div>
              <div>
                <div class="font-semibold">Dr. {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</div>
                <div class="text-sm text-gray-400">{{ selectedDoctor.specialization || 'General Practice' }}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div *ngIf="selectedDoctor.consultationFees">
                <span class="text-gray-400">Consultation Fee:</span>
                <span class="ml-2 font-medium">₹{{ selectedDoctor.consultationFees }}</span>
              </div>
              <div *ngIf="selectedDoctor.contactInfo">
                <span class="text-gray-400">Contact:</span>
                <span class="ml-2 font-medium">{{ selectedDoctor.contactInfo }}</span>
              </div>
              <div *ngIf="selectedDoctor.address" class="col-span-2">
                <span class="text-gray-400">Location:</span>
                <span class="ml-2 font-medium">{{ selectedDoctor.address }}</span>
              </div>
              <div *ngIf="selectedDoctor.email" class="col-span-2">
                <span class="text-gray-400">Email:</span>
                <span class="ml-2 font-medium">{{ selectedDoctor.email }}</span>
              </div>
            </div>
          </div>

          <!-- Reason for Emergency -->
          <div class="space-y-3">
            <label class="block text-sm font-medium">
              Reason for Emergency <span class="text-red-400">*</span>
            </label>
            <textarea 
              class="input w-full h-24 resize-none" 
              [(ngModel)]="reason"
              placeholder="Please describe your emergency situation in detail..."
              [class.border-red-500]="showValidation && !reason?.trim()"
            ></textarea>
            <div *ngIf="showValidation && !reason?.trim()" class="text-red-400 text-xs">
              Please provide a reason for the emergency appointment
            </div>
            <div class="text-xs text-gray-400">
              This information will help the doctor prepare for your consultation
            </div>
          </div>

          <!-- Appointment Details -->
          <div class="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
            <div class="text-sm">
              <div class="font-semibold text-blue-400 mb-2">Appointment Details:</div>
              <div class="space-y-1 text-gray-300">
                <div><strong>Date:</strong> {{ currentDate }}</div>
                <div><strong>Time:</strong> {{ currentTime }}</div>
                <div><strong>Type:</strong> Emergency Consultation</div>
                <div><strong>Status:</strong> Will be marked as "BOOKED" immediately</div>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
            <div class="text-red-400 text-sm">{{ error }}</div>
          </div>

          <!-- Success Message -->
          <div *ngIf="success" class="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
            <div class="text-green-400 text-sm">{{ success }}</div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button 
              class="btn-secondary flex-1" 
              (click)="close()"
              [disabled]="booking"
            >
              Cancel
            </button>
            <button 
              class="btn-primary flex-1 bg-red-600 hover:bg-red-700" 
              (click)="bookEmergencyAppointment()"
              [disabled]="booking || (!selectedDoctorId || !reason?.trim())"
            >
              {{ booking ? 'Booking Emergency Appointment...' : 'Book Emergency Appointment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmergencyAppointmentModalComponent {
  @Input() isOpen = false;
  @Input() availableDoctors: Doctor[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() appointmentBooked = new EventEmitter<any>();

  selectedDoctorId: number | null = null;
  reason = '';
  booking = false;
  error: string | null = null;
  success: string | null = null;
  showValidation = false;

  currentDate = new Date().toLocaleDateString();
  currentTime = new Date().toLocaleTimeString();

  constructor(private appointmentService: AppointmentService) {}

  get selectedDoctor(): Doctor | null {
    if (!this.selectedDoctorId) return null;
    return this.availableDoctors.find(d => d.id === this.selectedDoctorId) || null;
  }

  close() {
    this.reset();
    this.closeModal.emit();
  }

  reset() {
    this.selectedDoctorId = null;
    this.reason = '';
    this.booking = false;
    this.error = null;
    this.success = null;
    this.showValidation = false;
  }

  bookEmergencyAppointment() {
    this.showValidation = true;
    this.error = null;
    this.success = null;

    // Validation
    if (!this.selectedDoctorId || !this.reason?.trim()) {
      this.error = 'Please select a doctor and provide a reason for the emergency appointment.';
      return;
    }

    this.booking = true;

    this.appointmentService.bookEmergencyAppointment(this.selectedDoctorId, this.reason.trim())
      .subscribe({
        next: (response) => {
          this.booking = false;
          this.success = 'Emergency appointment booked successfully! The doctor has been notified.';
          this.appointmentBooked.emit(response);
          
          // Auto-close after 2 seconds
          setTimeout(() => {
            this.close();
          }, 2000);
        },
        error: (err) => {
          this.booking = false;
          this.error = err.error?.error || 'Failed to book emergency appointment. Please try again.';
        }
      });
  }
}