import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Observable } from 'rxjs';
import { PaymentService } from './payment.service';
import { LabTestService, BookingResponse } from './lab-test.service';

export interface PaymentReceiptData {
  transactionId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  patientName: string;
  patientId: number;
  bookingId?: number;
  selectedTests?: Array<{
    testName: string;
    price: number;
    description?: string;
  }>;
  totalPrice: number;
  prescribedBy?: string;
  bookingDate: string;
  paymentDate: string;
  upiId?: string;
  merchantUpiId?: string;
  status: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private paymentService = inject(PaymentService);

  constructor() { }

  /**
   * Generate and download payment receipt PDF
   */
  generatePaymentReceipt(receiptData: PaymentReceiptData): void {
    const doc = new jsPDF();
    
    // Set up colors
    const primaryColor = '#1f2937'; // gray-800
    const secondaryColor = '#3b82f6'; // blue-500
    const successColor = '#10b981'; // green-500
    
    // Header
    doc.setFillColor(31, 41, 55); // gray-800
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo/Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CareSync', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Healthcare Services', 20, 32);
    
    // Receipt title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Receipt', 20, 55);
    
    // Transaction details box
    doc.setDrawColor(59, 130, 246); // blue-500
    doc.setLineWidth(1);
    doc.rect(20, 65, 170, 25);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Transaction ID:', 25, 75);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(receiptData.transactionId, 25, 82);
    
    // Payment status
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // green-500
    doc.text('Status: ' + receiptData.status, 120, 75);
    
    // Payment amount
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${receiptData.amount.toFixed(2)}`, 120, 82);
    
    let yPosition = 105;
    
    // Patient Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Patient Information', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${receiptData.patientName}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Patient ID: ${receiptData.patientId}`, 25, yPosition);
    yPosition += 7;
    if (receiptData.bookingId) {
      doc.text(`Booking ID: ${receiptData.bookingId}`, 25, yPosition);
      yPosition += 7;
    }
    
    yPosition += 5;
    
    // Payment Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${receiptData.paymentMethod}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Currency: ${receiptData.currency}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Payment Date: ${new Date(receiptData.paymentDate).toLocaleString()}`, 25, yPosition);
    yPosition += 7;
    
    if (receiptData.upiId) {
      doc.text(`UPI ID: ${receiptData.upiId}`, 25, yPosition);
      yPosition += 7;
    }
    
    if (receiptData.merchantUpiId) {
      doc.text(`Merchant UPI: ${receiptData.merchantUpiId}`, 25, yPosition);
      yPosition += 7;
    }
    
    yPosition += 5;
    
    // Booking Information
    if (receiptData.selectedTests && receiptData.selectedTests.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Booking Details', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Booking Date: ${new Date(receiptData.bookingDate).toLocaleString()}`, 25, yPosition);
      yPosition += 7;
      
      if (receiptData.prescribedBy) {
        doc.text(`Prescribed By: ${receiptData.prescribedBy}`, 25, yPosition);
        yPosition += 7;
      }
      
      yPosition += 5;
      
      // Tests table header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Selected Tests', 20, yPosition);
      yPosition += 10;
      
      // Table headers
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition - 5, 170, 8, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Test Name', 25, yPosition);
      doc.text('Description', 80, yPosition);
      doc.text('Price', 150, yPosition);
      yPosition += 10;
      
      // Table rows
      doc.setFont('helvetica', 'normal');
      receiptData.selectedTests.forEach((test) => {
        if (yPosition > 270) { // Check if we need a new page
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(test.testName, 25, yPosition);
        const description = test.description || 'No description';
        doc.text(description.substring(0, 25) + (description.length > 25 ? '...' : ''), 80, yPosition);
        doc.text(`Rs. ${test.price.toFixed(2)}`, 150, yPosition);
        yPosition += 8;
      });
      
      // Total
      yPosition += 5;
      doc.setDrawColor(0, 0, 0);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Amount: Rs. ${receiptData.totalPrice.toFixed(2)}`, 120, yPosition);
    }
    
    // Footer
    yPosition = 280;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated receipt. No signature required.', 20, yPosition);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition + 5);
    doc.text('CareSync Healthcare Services - Your Health, Our Priority', 20, yPosition + 10);
    
    // Download the PDF
    const fileName = `CareSync_Receipt_${receiptData.transactionId}.pdf`;
    doc.save(fileName);
  }

  /**
   * Generate booking confirmation PDF (without payment details)
   */
  generateBookingConfirmation(bookingData: any): void {
    const doc = new jsPDF();
    
    // Similar structure but focused on booking details
    // Implementation can be added based on requirements
    
    doc.setFontSize(20);
    doc.text('Booking Confirmation', 20, 30);
    
    // Add booking details...
    
    const fileName = `CareSync_Booking_${bookingData.id}.pdf`;
    doc.save(fileName);
  }

  /**
   * Unified method to generate payment receipt by booking ID
   * This method fetches payment data and booking data, then generates the PDF
   */
  generateReceiptByBookingId(bookingId: number, bookingData?: BookingResponse): void {
    this.paymentService.getPaymentByBookingId(bookingId).subscribe({
      next: (payment) => {
        // If booking data is provided, use it directly
        if (bookingData) {
          const receiptData: PaymentReceiptData = {
            transactionId: payment.transactionId,
            amount: bookingData.totalPrice,
            currency: 'INR',
            paymentMethod: payment.paymentMethod || 'UPI',
            patientName: bookingData.patientName,
            patientId: bookingData.patientId,
            bookingId: bookingData.id,
            selectedTests: bookingData.selectedTests
              .sort((a, b) => a.testName.localeCompare(b.testName))
              .map(test => ({
                testName: test.testName,
                price: test.price,
                description: test.description || ''
              })),
            totalPrice: bookingData.totalPrice,
            prescribedBy: bookingData.prescribedBy,
            bookingDate: bookingData.bookingDate,
            paymentDate: payment.createdAt,
            status: payment.paymentStatus || 'Completed',
            description: 'Lab Test Booking Receipt',
            upiId: payment.upiId
          };

          this.generatePaymentReceipt(receiptData);
        } else {
          // If booking data is not provided, create a simplified receipt with payment data only
          const receiptData: PaymentReceiptData = {
            transactionId: payment.transactionId,
            amount: payment.amount,
            currency: 'INR',
            paymentMethod: payment.paymentMethod || 'UPI',
            patientName: payment.patientName || 'N/A',
            patientId: payment.patientId || 0,
            bookingId: bookingId,
            selectedTests: [], // Will be empty for simplified receipt
            totalPrice: payment.amount,
            prescribedBy: payment.description || undefined,
            bookingDate: payment.createdAt,
            paymentDate: payment.createdAt,
            status: payment.paymentStatus || 'Completed',
            description: 'Payment Receipt',
            upiId: payment.upiId
          };

          this.generatePaymentReceipt(receiptData);
        }
      },
      error: (error) => {
        console.error('Error fetching payment details:', error);
        
        // Fallback: generate receipt with available booking data if provided
        if (bookingData) {
          const receiptData: PaymentReceiptData = {
            transactionId: `TXN-${bookingData.id}`,
            amount: bookingData.totalPrice,
            currency: 'INR',
            paymentMethod: 'UPI',
            patientName: bookingData.patientName,
            patientId: bookingData.patientId,
            bookingId: bookingData.id,
            selectedTests: bookingData.selectedTests
              .sort((a, b) => a.testName.localeCompare(b.testName))
              .map(test => ({
                testName: test.testName,
                price: test.price,
                description: test.description || ''
              })),
            totalPrice: bookingData.totalPrice,
            prescribedBy: bookingData.prescribedBy,
            bookingDate: bookingData.bookingDate,
            paymentDate: bookingData.createdAt,
            status: 'Completed',
            description: 'Lab Test Booking Receipt'
          };

          this.generatePaymentReceipt(receiptData);
        }
      }
    });
  }
}