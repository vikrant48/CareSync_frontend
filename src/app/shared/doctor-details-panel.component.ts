import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Doctor } from '../core/services/doctor.service';

@Component({
  selector: 'doctor-details-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel p-6 space-y-6" *ngIf="doctor; else loadingTpl">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-white text-xl">
          {{ (doctor.name || (doctor.firstName + ' ' + doctor.lastName))?.charAt(0) }}
        </div>
        <div>
          <h2 class="text-xl font-semibold">{{ doctor.name || (doctor.firstName + ' ' + doctor.lastName) }}</h2>
          <div class="text-sm text-gray-400">{{ doctor.specialization || 'General' }}</div>
          <div class="text-sm" *ngIf="avgRating !== null">{{ avgRating?.toFixed(1) }} ★</div>
          <div class="text-sm" *ngIf="age !== null">Age: {{ age }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="space-y-3" *ngIf="enableBooking">
          <h3 class="text-lg font-semibold">Book Appointment</h3>
          <div class="flex gap-3 items-end">
            <div class="flex-1">
              <label class="block text-sm mb-1">Date</label>
              <input
                type="date"
                class="input w-full"
                [ngModel]="selectedDate"
                (ngModelChange)="selectedDateChange.emit($event)"
                (change)="loadSlots.emit()"
              />
            </div>
            <button class="btn-secondary" (click)="loadSlots.emit()">Check Slots</button>
          </div>

          <div *ngIf="loadingSlots" class="text-gray-400">Loading slots...</div>
          <div *ngIf="!loadingSlots && (slots?.length || 0) === 0" class="text-gray-400">No available slots for selected date.</div>
          <div class="flex flex-wrap gap-2" *ngIf="!loadingSlots && (slots?.length || 0) > 0">
            <button class="btn-outline" *ngFor="let s of slots" (click)="selectSlot.emit(s)">{{ s }}</button>
          </div>

          <div class="space-y-2" *ngIf="selectedSlot">
            <label class="block text-sm">Reason (optional)</label>
            <textarea
              class="input w-full"
              rows="3"
              [ngModel]="reason"
              (ngModelChange)="reasonChange.emit($event)"
              placeholder="Describe your symptoms or reason"
            ></textarea>
            <button class="btn-primary" (click)="book.emit()" [disabled]="booking">{{ booking ? 'Booking...' : 'Book Selected Slot' }}</button>
            <div class="text-green-500" *ngIf="bookSuccess">Appointment booked successfully.</div>
            <div class="text-red-500" *ngIf="bookError">{{ bookError }}</div>
          </div>
        </section>

        <section class="space-y-2">
          <h3 class="text-lg font-semibold">Contact</h3>
          <div class="text-sm">Email: {{ doctor.email || 'N/A' }}</div>
          <div class="text-sm">Contact: {{ doctor.contactInfo || 'N/A' }}</div>
          <div class="text-sm" *ngIf="doctor.profileImageUrl">Profile Image: <a class="link" [href]="doctor.profileImageUrl" target="_blank">View</a></div>
        </section>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section class="space-y-3">
          <h3 class="text-lg font-semibold">Education</h3>
          <div *ngIf="(educations?.length || 0) === 0" class="text-gray-400">No education details available.</div>
          <div class="space-y-3" *ngIf="(educations?.length || 0) > 0">
            <div class="card" *ngFor="let ed of educations">
              <div class="font-medium">{{ ed.degree }}</div>
              <div class="text-sm text-gray-400">{{ ed.institution }}</div>
              <div class="text-sm">Year: {{ ed.yearOfCompletion || 'N/A' }}</div>
              <div class="text-sm" *ngIf="ed.details">{{ ed.details }}</div>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-lg font-semibold">Experience</h3>
          <div *ngIf="(experiences?.length || 0) === 0" class="text-gray-400">No experience records available.</div>
          <div class="space-y-3" *ngIf="(experiences?.length || 0) > 0">
            <div class="card" *ngFor="let ex of experiences">
              <div class="font-medium">{{ ex.hospitalName }}</div>
              <div class="text-sm text-gray-400">{{ ex.position }}</div>
              <div class="text-sm">Years: {{ ex.yearsOfService || 'N/A' }}</div>
              <div class="text-sm" *ngIf="ex.details">{{ ex.details }}</div>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-lg font-semibold">Certificates</h3>
          <div *ngIf="(certificates?.length || 0) === 0" class="text-gray-400">No certificates available.</div>
          <div class="space-y-3" *ngIf="(certificates?.length || 0) > 0">
            <div class="card" *ngFor="let c of certificates">
              <div class="font-medium">{{ c.name }}</div>
              <div class="text-sm" *ngIf="c.issuingOrganization">Issued by: {{ c.issuingOrganization }}</div>
              <div class="text-sm">
                <span *ngIf="c.issueDate">Issue: {{ c.issueDate }}</span>
                <span *ngIf="c.expiryDate"> • Expires: {{ c.expiryDate }}</span>
              </div>
              <div class="text-sm" *ngIf="c.credentialId">Credential ID: {{ c.credentialId }}</div>
              <div class="text-sm" *ngIf="c.details">{{ c.details }}</div>
              <div class="text-sm flex gap-3">
                <a *ngIf="c.credentialUrl" class="link" [href]="c.credentialUrl" target="_blank">Verify</a>
                <a *ngIf="c.url" class="link" [href]="c.url" target="_blank">View</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    <ng-template #loadingTpl>
      <div class="p-6 text-center text-gray-400">Loading doctor profile…</div>
    </ng-template>
  `,
})
export class DoctorDetailsPanelComponent {
  @Input() doctor: Doctor | null = null;
  @Input() avgRating: number | null = null;
  @Input() age: number | null = null;

  @Input() educations: any[] = [];
  @Input() experiences: any[] = [];
  @Input() certificates: any[] = [];

  @Input() enableBooking = false;

  // Booking-related inputs/outputs for reuse
  @Input() selectedDate = '';
  @Output() selectedDateChange = new EventEmitter<string>();

  @Input() slots: string[] = [];
  @Input() selectedSlot: string | null = null;
  @Output() selectSlot = new EventEmitter<string>();

  @Input() reason = '';
  @Output() reasonChange = new EventEmitter<string>();

  @Input() loadingSlots = false;
  @Output() loadSlots = new EventEmitter<void>();

  @Input() booking = false;
  @Input() bookSuccess = false;
  @Input() bookError: string | null = null;
  @Output() book = new EventEmitter<void>();
}