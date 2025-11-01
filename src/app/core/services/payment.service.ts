import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentRequest {
  amount: number;
  description?: string; // Optional - will be auto-generated if not provided
  paymentType: 'LAB_TEST' | 'APPOINTMENT' | 'CONSULTATION' | 'MEDICINE' | 'HEALTH_CHECKUP' | 'SUBSCRIPTION' | 'OTHER';
  additionalInfo?: string; // Optional additional info for auto-generating descriptions
  paymentMethod: 'UPI' | 'CARD' | 'QR_CODE';
  patientId: number; // Required field as per backend
  bookingId?: number;
  currency?: string;
  // UPI specific field (flattened from upiDetails)
  upiId?: string;
  // Card details (matching backend CardDetailsDto structure)
  cardDetails?: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  paymentMethod: string;
  amount: number;
  currency?: string;
  paymentUrl?: string;
  qrCodeData?: string;
  razorpayOrderId?: string;
  status?: string;
  createdAt?: string;
  // Additional fields from backend PaymentResponseDto
  id?: number;
  paymentGatewayTransactionId?: string;
  paymentStatus?: string;
  description?: string;
  patientId?: number;
  patientName?: string;
  bookingId?: number;
  paymentCompletedAt?: string;
  failureReason?: string;
  upiId?: string;
  cardLastFour?: string;
  cardType?: string;
}

export interface PaymentStatusResponse {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  patientId: number;
  bookingId?: number;
  createdAt: string;
  updatedAt: string;
  // Additional fields to match backend response
  id?: number;
  paymentGatewayTransactionId?: string;
  paymentStatus?: string;
  description?: string;
  patientName?: string;
  paymentCompletedAt?: string;
  failureReason?: string;
  upiId?: string;
  cardLastFour?: string;
  cardType?: string;
  razorpayPaymentId?: string;
  upiTransactionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  /**
   * Create payment success details for display using backend response
   */
  createPaymentSuccessDetails(
    paymentResponse: PaymentResponse
  ): Observable<PaymentStatusResponse> {
    const successDetails: PaymentStatusResponse = {
      transactionId: paymentResponse.transactionId || '',
      status: 'SUCCESS',
      amount: paymentResponse.amount,
      currency: paymentResponse.currency || 'INR',
      paymentMethod: paymentResponse.paymentMethod,
      patientId: paymentResponse.patientId || 0,
      bookingId: paymentResponse.bookingId,
      createdAt: paymentResponse.createdAt || new Date().toISOString(),
      updatedAt: paymentResponse.createdAt || new Date().toISOString(),
      description: paymentResponse.description,
      paymentStatus: paymentResponse.paymentStatus,
      paymentCompletedAt: paymentResponse.paymentCompletedAt,
      upiId: paymentResponse.upiId,
      cardLastFour: paymentResponse.cardLastFour,
      cardType: paymentResponse.cardType
    };

    return of(successDetails);
  }

  /**
   * Store payment details locally (for demo purposes)
   */
  storePaymentLocally(paymentDetails: PaymentStatusResponse): void {
    const existingPayments = this.getStoredPayments();
    existingPayments.push(paymentDetails);
    localStorage.setItem('careSync_payments', JSON.stringify(existingPayments));
  }

  /**
   * Get stored payments from local storage
   */
  getStoredPayments(): PaymentStatusResponse[] {
    const stored = localStorage.getItem('careSync_payments');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get stored payment by transaction ID
   */
  getStoredPayment(transactionId: string): PaymentStatusResponse | null {
    const payments = this.getStoredPayments();
    return payments.find(p => p.transactionId === transactionId) || null;
  }

  /**
   * Initiate payment using the selected method
   */
  initiatePayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/api/payments/initiate`, paymentRequest);
  }

  /**
   * Get payment status by transaction ID
   */
  getPaymentStatus(transactionId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.baseUrl}/api/payments/transaction/${transactionId}`);
  }

  /**
   * Link payment to booking after booking creation
   */
  linkPaymentToBooking(transactionId: string, bookingId: number): Observable<string> {
    return this.http.put<string>(`${this.baseUrl}/api/payments/link-booking`, null, {
      params: {
        transactionId: transactionId,
        bookingId: bookingId.toString()
      },
      responseType: 'text' as 'json'
    });
  }

  /**
   * Get payment by booking ID
   */
  getPaymentByBookingId(bookingId: number): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.baseUrl}/api/payments/booking/${bookingId}`);
  }

  /**
   * Get patient payments
   */
  getPatientPayments(patientId: number): Observable<PaymentStatusResponse[]> {
    return this.http.get<PaymentStatusResponse[]>(`${this.baseUrl}/api/payments/patient/${patientId}`);
  }

  /**
   * Pay for an existing doctor-created booking
   */
  payForBooking(bookingId: number, paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/api/payments/booking/${bookingId}/pay`, paymentRequest);
  }

  /**
   * Verify payment status (for manual verification)
   */
  verifyPayment(transactionId: string): Observable<PaymentStatusResponse> {
    return this.http.post<PaymentStatusResponse>(`${this.baseUrl}/api/payments/${transactionId}/verify`, {});
  }

  /**
   * Cancel a pending payment
   */
  cancelPayment(transactionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/api/payments/${transactionId}/cancel`, {});
  }

  /**
   * Validate UPI ID format
   */
  validateUpiId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Get card type from card number
   */
  getCardType(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) {
      return 'Visa';
    } else if (/^5[1-5]/.test(cleanNumber)) {
      return 'Mastercard';
    } else if (/^3[47]/.test(cleanNumber)) {
      return 'American Express';
    } else if (/^6/.test(cleanNumber)) {
      return 'Discover';
    } else {
      return 'Unknown';
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  /**
   * Process payment using the selected method (legacy method for backward compatibility)
   * @deprecated Use initiatePayment instead
   */
  processPayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.initiatePayment(paymentRequest);
  }
}