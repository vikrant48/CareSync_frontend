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
        <div class="w-14 h-14 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-white text-xl">
          <img *ngIf="doctor?.profileImageUrl" [src]="doctor.profileImageUrl" class="w-full h-full object-cover" (error)="doctor!.profileImageUrl = ''" />
          <span *ngIf="!doctor?.profileImageUrl">{{ doctorInitial() }}</span>
        </div>
        <div>
          <h2 class="text-xl font-semibold">{{ formatDoctorName() }}</h2>
          <div class="text-sm text-gray-400">{{ doctor.specialization || 'General' }}</div>
          <div class="flex gap-2 mt-1 text-sm flex-wrap">
            <div *ngIf="avgRating !== null" class="px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700">Rating: {{ avgRating?.toFixed(1) }} ★</div>
            <div *ngIf="age !== null" class="px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700">Age: {{ age }}</div>
            <div *ngIf="doctor.consultationFees !== undefined && doctor.consultationFees !== null" class="px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700">Fee: {{ doctor.consultationFees }}</div>
          </div>
          <div class="text-sm mt-2">Languages: <span class="text-gray-300">{{ languagesText() }}</span></div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="space-y-3" *ngIf="enableBooking">
          <h3 class="text-lg font-semibold">Book Appointment</h3>
          <button class="btn-primary" (click)="openBooking.emit()">Book Appointment</button>
        </section>

        <section class="space-y-2">
          <h3 class="text-lg font-semibold">Contact</h3>
          <div class="text-sm">Email: {{ doctor.email || 'N/A' }}</div>
          <div class="text-sm">Contact: {{ doctor.contactInfo || 'N/A' }}</div>
          <div class="text-sm" *ngIf="doctor.address">Address: {{ doctor.address }}</div>
        </section>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="space-y-3">
          <h3 class="text-lg font-semibold">Education</h3>
          <div *ngIf="(educations?.length || 0) === 0" class="text-gray-400">No education details available.</div>
          <div class="space-y-3" *ngIf="(educations?.length || 0) > 0">
            <div class="card p-3" *ngFor="let ed of educations">
              <div class="font-medium">
                {{ ed.degree }}
                <span class="text-gray-400" *ngIf="ed.institution"> • {{ ed.institution }}</span>
              </div>
              <div class="text-sm text-gray-300">
                <span>Year: {{ ed.yearOfCompletion || 'N/A' }}</span>
                <span *ngIf="ed.details"> • {{ ed.details }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-lg font-semibold">Experience</h3>
          <div *ngIf="(experiences?.length || 0) === 0" class="text-gray-400">No experience records available.</div>
          <div class="space-y-3" *ngIf="(experiences?.length || 0) > 0">
            <div class="card p-3" *ngFor="let ex of experiences">
              <div class="font-medium">
                {{ ex.hospitalName }}
                <span class="text-gray-400" *ngIf="ex.position"> • {{ ex.position }}</span>
              </div>
              <div class="text-sm text-gray-300">
                <span>Years: {{ ex.yearsOfService || 'N/A' }}</span>
                <span *ngIf="ex.details"> • {{ ex.details }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="space-y-3 mt-6">
        <h3 class="text-lg font-semibold">Certificates</h3>
        <div *ngIf="(certificates?.length || 0) === 0" class="text-gray-400">No certificates available.</div>
        <div class="space-y-3" *ngIf="(certificates?.length || 0) > 0">
          <div class="card p-3" *ngFor="let c of certificates">
            <div class="font-medium">{{ c.name }}</div>
            <div class="text-sm">
              <span *ngIf="c.issuingOrganization">Issued by: {{ c.issuingOrganization }}</span>
              <span *ngIf="c.issueDate"> • Issue: {{ c.issueDate }}</span>
              <span *ngIf="c.expiryDate"> • Expires: {{ c.expiryDate }}</span>
            </div>
            <div class="text-sm">
              <span *ngIf="c.credentialId">Credential ID: {{ c.credentialId }}</span>
              <span *ngIf="c.details"> • {{ c.details }}</span>
            </div>
            <div class="text-sm flex gap-3">
              <a *ngIf="c.credentialUrl" class="link text-blue-400 hover:text-blue-300 underline" [href]="c.credentialUrl" target="_blank">Verify</a>
              <a *ngIf="c.url" class="link text-blue-400 hover:text-blue-300 underline" [href]="c.url" target="_blank">View</a>
            </div>
          </div>
        </div>
      </section>
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

  // New: emit open booking popup request so parent can open modal
  @Output() openBooking = new EventEmitter<void>();

  doctorInitial(): string {
    const base = (this.doctor?.name || `${this.doctor?.firstName || ''} ${this.doctor?.lastName || ''}`).trim();
    const stripped = base.replace(/^dr\.?\s+/i, '');
    return stripped.charAt(0) || '?';
  }

  formatDoctorName(): string {
    const base = (this.doctor?.name || `${this.doctor?.firstName || ''} ${this.doctor?.lastName || ''}`).trim();
    if (!base) return '';
    return /^dr\.?\s+/i.test(base) ? base : `Dr ${base}`;
  }

  languagesText(): string {
    const langs: any = (this.doctor as any)?.languages;
    if (!langs) return 'N/A';
    if (Array.isArray(langs)) return langs.filter((x) => !!x).join(', ') || 'N/A';
    return String(langs);
  }
}