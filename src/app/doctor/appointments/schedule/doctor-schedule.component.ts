import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../../services/doctor.service';
import { DoctorAppointment } from '../../../models/appointment.model';

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule
  ],
  template: `
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">My Schedule</h1>
        <p class="text-gray-600 mt-2">Manage your availability and schedule</p>
      </div>

      <!-- Calendar Navigation -->
      <mat-card class="mb-6">
        <div class="flex justify-between items-center p-4">
          <div class="flex items-center gap-4">
            <button mat-icon-button (click)="previousWeek()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <h2 class="text-xl font-semibold">{{ getCurrentWeekRange() }}</h2>
            <button mat-icon-button (click)="nextWeek()">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
          <div class="flex gap-2">
            <button mat-raised-button [color]="viewMode === 'week' ? 'primary' : ''" (click)="setViewMode('week')">
              Week
            </button>
            <button mat-raised-button [color]="viewMode === 'day' ? 'primary' : ''" (click)="setViewMode('day')">
              Day
            </button>
            <button mat-raised-button color="primary" (click)="goToToday()">
              Today
            </button>
          </div>
        </div>
      </mat-card>

      <!-- Week View -->
      @if (viewMode === 'week') {
        <mat-card class="schedule-card">
          <div class="schedule-grid">
            <!-- Time slots header -->
            <div class="time-header"></div>
            @for (day of weekDays; track day.date) {
              <div class="day-header">
                <div class="day-name">{{ day.name }}</div>
                <div class="day-date" [class.today]="isToday(day.date)">{{ day.date | date:'d' }}</div>
                <div class="appointment-count">{{ getDayAppointmentCount(day.date) }} appointments</div>
              </div>
            }
            
            <!-- Time slots and appointments -->
            @for (timeSlot of timeSlots; track timeSlot) {
              <div class="time-slot">{{ timeSlot }}</div>
              @for (day of weekDays; track day.date) {
                <div class="schedule-cell" [class.current-time]="isCurrentTimeSlot(day.date, timeSlot)">
                  @for (appointment of getAppointmentsForTimeSlot(day.date, timeSlot); track appointment.appointmentId) {
                    <div class="appointment-block" [class]="'status-' + appointment.status.toLowerCase()" 
                         (click)="viewAppointmentDetails(appointment)">
                      <div class="appointment-time">{{ appointment.appointmentTime }}</div>
                      <div class="appointment-patient">{{ appointment.patientName }}</div>
                      <div class="appointment-reason">{{ appointment.reason | slice:0:20 }}{{ appointment.reason.length > 20 ? '...' : '' }}</div>
                      <mat-chip class="status-chip" [color]="getStatusColor(appointment.status)">{{ appointment.status }}</mat-chip>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </mat-card>
      }

      <!-- Day View -->
      @if (viewMode === 'day') {
        <mat-card class="day-schedule-card">
          <div class="day-schedule-header">
            <h3>{{ selectedDate | date:'fullDate' }}</h3>
            <div class="day-stats">
              <span>{{ getDayAppointmentCount(selectedDate) }} appointments</span>
            </div>
          </div>
          
          <div class="day-schedule-content">
            @if (loading) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading appointments...</p>
              </div>
            } @else {
              @for (timeSlot of timeSlots; track timeSlot) {
                <div class="day-time-slot">
                  <div class="time-label">{{ timeSlot }}</div>
                  <div class="time-content">
                    @for (appointment of getAppointmentsForTimeSlot(selectedDate, timeSlot); track appointment.appointmentId) {
                      <div class="day-appointment" [class]="'status-' + appointment.status.toLowerCase()" 
                           (click)="viewAppointmentDetails(appointment)">
                        <div class="appointment-header">
                          <span class="patient-name">{{ appointment.patientName }}</span>
                          <mat-chip class="status-chip" [color]="getStatusColor(appointment.status)">{{ appointment.status }}</mat-chip>
                        </div>
                        <div class="appointment-details">
                          <p><mat-icon>access_time</mat-icon> {{ appointment.appointmentTime }}</p>
                          <p><mat-icon>email</mat-icon> {{ appointment.patientEmail }}</p>
                          <p><mat-icon>phone</mat-icon> {{ appointment.patientContactInfo }}</p>
                          <p><mat-icon>medical_services</mat-icon> {{ appointment.reason }}</p>
                        </div>
                      </div>
                    } @empty {
                      <div class="empty-slot">Available</div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </mat-card>
      }

      <!-- Quick Actions -->
      <mat-card class="mt-6">
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
          <div class="flex gap-4 flex-wrap">
            <button mat-raised-button color="primary" routerLink="/doctor/appointments">
              <mat-icon>list</mat-icon>
              View All Appointments
            </button>
            <button mat-raised-button color="accent">
              <mat-icon>schedule</mat-icon>
              Set Availability
            </button>
            <button mat-raised-button>
              <mat-icon>block</mat-icon>
              Block Time Slot
            </button>
            <button mat-raised-button routerLink="/doctor/dashboard">
              <mat-icon>dashboard</mat-icon>
              Dashboard
            </button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }
    
    /* Schedule Grid Styles */
    .schedule-grid {
      display: grid;
      grid-template-columns: 80px repeat(7, 1fr);
      gap: 1px;
      background-color: #e5e7eb;
      border: 1px solid #e5e7eb;
    }
    
    .time-header {
      background-color: #f9fafb;
      border-right: 1px solid #e5e7eb;
    }
    
    .day-header {
      background-color: #f9fafb;
      padding: 12px 8px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .day-name {
      font-weight: 600;
      font-size: 14px;
      color: #374151;
    }
    
    .day-date {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 4px 0;
    }
    
    .day-date.today {
      color: #3b82f6;
      background-color: #dbeafe;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 4px auto;
    }
    
    .appointment-count {
      font-size: 12px;
      color: #6b7280;
    }
    
    .time-slot {
      background-color: #f9fafb;
      padding: 8px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .schedule-cell {
      background-color: white;
      border-bottom: 1px solid #e5e7eb;
      min-height: 60px;
      position: relative;
      padding: 2px;
    }
    
    .schedule-cell.current-time {
      background-color: #fef3c7;
    }
    
    .appointment-block {
      background-color: #3b82f6;
      color: white;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 11px;
      margin-bottom: 2px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .appointment-block:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .appointment-block.status-pending {
      background-color: #f59e0b;
    }
    
    .appointment-block.status-confirmed {
      background-color: #10b981;
    }
    
    .appointment-block.status-completed {
      background-color: #6b7280;
    }
    
    .appointment-block.status-cancelled {
      background-color: #ef4444;
    }
    
    .appointment-time {
      font-weight: 600;
      font-size: 10px;
    }
    
    .appointment-patient {
      font-weight: 500;
      margin: 2px 0;
    }
    
    .appointment-reason {
      font-size: 10px;
      opacity: 0.9;
    }
    
    .status-chip {
      font-size: 8px !important;
      height: 16px !important;
      margin-top: 2px;
    }
    
    /* Day View Styles */
    .day-schedule-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .day-stats {
      color: #6b7280;
      font-size: 14px;
    }
    
    .day-schedule-content {
      padding: 16px;
    }
    
    .day-time-slot {
      display: flex;
      border-bottom: 1px solid #f3f4f6;
      min-height: 80px;
    }
    
    .time-label {
      width: 80px;
      padding: 12px 8px;
      font-size: 12px;
      color: #6b7280;
      background-color: #f9fafb;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    
    .time-content {
      flex: 1;
      padding: 8px 12px;
    }
    
    .day-appointment {
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .day-appointment:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }
    
    .day-appointment.status-pending {
      border-left: 4px solid #f59e0b;
    }
    
    .day-appointment.status-confirmed {
      border-left: 4px solid #10b981;
    }
    
    .day-appointment.status-completed {
      border-left: 4px solid #6b7280;
    }
    
    .day-appointment.status-cancelled {
      border-left: 4px solid #ef4444;
    }
    
    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .patient-name {
      font-weight: 600;
      font-size: 16px;
      color: #111827;
    }
    
    .appointment-details p {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
      font-size: 14px;
      color: #6b7280;
    }
    
    .appointment-details mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .empty-slot {
      color: #9ca3af;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #6b7280;
    }
    
    .loading-container p {
      margin-top: 16px;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .schedule-grid {
        grid-template-columns: 60px repeat(7, 1fr);
        font-size: 10px;
      }
      
      .day-header {
        padding: 8px 4px;
      }
      
      .appointment-block {
        font-size: 9px;
        padding: 2px 4px;
      }
      
      .time-label {
        width: 60px;
        font-size: 10px;
      }
    }
  `]
})
export class DoctorScheduleComponent implements OnInit {
  appointments: DoctorAppointment[] = [];
  loading = false;
  viewMode: 'week' | 'day' = 'week';
  selectedDate = new Date();
  currentWeekStart = new Date();
  
  weekDays: { name: string; date: Date }[] = [];
  timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  constructor(
    private doctorService: DoctorService,
    private snackBar: MatSnackBar
  ) {
    this.initializeWeek();
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  initializeWeek(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    this.currentWeekStart = startOfWeek;
    this.generateWeekDays();
  }

  generateWeekDays(): void {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);
      this.weekDays.push({
        name: dayNames[i],
        date: date
      });
    }
  }

  loadAppointments(): void {
    this.loading = true;
    this.doctorService.getDoctorAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.snackBar.open('Error loading appointments', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
  }

  goToToday(): void {
    this.selectedDate = new Date();
    this.initializeWeek();
  }

  setViewMode(mode: 'week' | 'day'): void {
    this.viewMode = mode;
  }

  getCurrentWeekRange(): string {
    const endOfWeek = new Date(this.currentWeekStart);
    endOfWeek.setDate(this.currentWeekStart.getDate() + 6);
    
    const startMonth = this.currentWeekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const startDay = this.currentWeekStart.getDate();
    const endDay = endOfWeek.getDate();
    const year = this.currentWeekStart.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  getDayAppointmentCount(date: Date): number {
    return this.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.toDateString() === date.toDateString();
    }).length;
  }

  getAppointmentsForTimeSlot(date: Date, timeSlot: string): DoctorAppointment[] {
    return this.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const appointmentTime = appointment.appointmentTime;
      
      return appointmentDate.toDateString() === date.toDateString() && 
             this.isTimeInSlot(appointmentTime, timeSlot);
    });
  }

  private isTimeInSlot(appointmentTime: string, timeSlot: string): boolean {
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const [appointmentHour, appointmentMinute] = appointmentTime.split(':').map(Number);
    
    const slotMinutes = slotHour * 60 + slotMinute;
    const appointmentMinutes = appointmentHour * 60 + appointmentMinute;
    
    return appointmentMinutes >= slotMinutes && appointmentMinutes < slotMinutes + 30;
  }

  isCurrentTimeSlot(date: Date, timeSlot: string): boolean {
    const now = new Date();
    if (date.toDateString() !== now.toDateString()) {
      return false;
    }
    
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const slotMinutes = slotHour * 60 + slotMinute;
    const currentMinutes = currentHour * 60 + currentMinute;
    
    return currentMinutes >= slotMinutes && currentMinutes < slotMinutes + 30;
  }

  viewAppointmentDetails(appointment: DoctorAppointment): void {
    // Navigate to appointment details or open a dialog
    console.log('View appointment details:', appointment);
    this.snackBar.open(`Viewing details for ${appointment.patientName}`, 'Close', { duration: 2000 });
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'PENDING':
      case 'SCHEDULED':
        return 'warn';
      case 'BOOKED':
        return 'primary';
      case 'CONFIRMED':
        return 'accent';
      case 'COMPLETED':
        return 'primary';
      case 'CANCELLED':
        return 'warn';
      case 'RESCHEDULED':
        return 'accent';
      default:
        return 'primary';
    }
  }
}