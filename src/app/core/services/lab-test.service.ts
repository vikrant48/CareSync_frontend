import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentRequest } from './payment.service';
import { PatientDocumentItem } from './patient-profile.service';

export interface LabTest {
  id: number;
  testName: string;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface BookingRequest {
  patientId?: number | null;
  selectedTestIds: number[];
  isFullBodyCheckup: boolean;
  bookingDate?: string;
  notes?: string;
}

export interface BookingResponse {
  id: number;
  patientId: number;
  patientName: string;
  selectedTests: LabTest[];
  totalPrice: number;
  prescribedBy: string;
  bookingDate: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  labReports?: PatientDocumentItem[];
  paymentTransactionId?: string;
  paymentStatus?: string;
}

export interface CreateLabTestRequest {
  testName: string;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface PatientBookingWithPaymentRequest {
  bookingRequest: BookingRequest;
  paymentRequest: PaymentRequest;
}

@Injectable({
  providedIn: 'root'
})
export class LabTestService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  /**
   * Fetch all available lab tests
   */
  getAllLabTests(): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(`${this.baseUrl}/api/lab-tests`);
  }

  /**
   * Search lab tests by name
   */
  searchLabTests(searchTerm: string): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(`${this.baseUrl}/api/lab-tests/search`, {
      params: { name: searchTerm }
    });
  }

  /**
   * Get a specific lab test by ID
   */
  getLabTestById(id: number): Observable<LabTest> {
    return this.http.get<LabTest>(`${this.baseUrl}/api/lab-tests/${id}`);
  }

  /**
   * Create a new booking for selected lab tests (legacy method - routes based on user role)
   */
  createBooking(bookingRequest: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/api/bookings`, bookingRequest);
  }

  /**
   * Create a patient booking with integrated payment
   */
  createPatientBookingWithPayment(request: PatientBookingWithPaymentRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/api/bookings/patient/with-payment`, request);
  }

  /**
   * Create a doctor booking without payment (for patients to pay later)
   */
  createDoctorBooking(bookingRequest: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/api/bookings/doctor`, bookingRequest);
  }

  /**
   * Get all bookings for the current user
   */
  getUserBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/api/bookings/my-bookings`);
  }

  /**
   * Get booking by ID
   */
  getBookingById(id: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/api/bookings/${id}`);
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: number): Observable<{ message: string; booking: BookingResponse }> {
    return this.http.put<{ message: string; booking: BookingResponse }>(`${this.baseUrl}/api/bookings/${bookingId}/cancel`, {});
  }

  /**
   * Calculate total price for selected tests
   */
  calculateTotalPrice(selectedTests: LabTest[]): number {
    return selectedTests.reduce((total, test) => total + test.price, 0);
  }

  /**
   * Get all lab tests including inactive ones (for admin/doctor management)
   */
  getAllLabTestsIncludingInactive(): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(`${this.baseUrl}/api/lab-tests/all`);
  }

  /**
   * Create a new lab test
   */
  createLabTest(request: CreateLabTestRequest): Observable<LabTest> {
    return this.http.post<LabTest>(`${this.baseUrl}/api/lab-tests`, request);
  }

  /**
   * Update an existing lab test
   */
  updateLabTest(id: number, request: CreateLabTestRequest): Observable<LabTest> {
    return this.http.put<LabTest>(`${this.baseUrl}/api/lab-tests/${id}`, request);
  }

  /**
   * Delete a lab test (soft delete)
   */
  deleteLabTest(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/lab-tests/${id}`);
  }

  /**
   * Upload lab report for a booking
   */
  uploadLabReport(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/files/upload/lab-report`, formData);
  }
}