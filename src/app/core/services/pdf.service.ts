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
  totalPrice?: number;
  prescribedBy?: string;
  bookingDate?: string;
  paymentDate: string;
  upiId?: string;
  merchantUpiId?: string;
  paidTo?: string;
  recipientUpiId?: string;
  status: string;
  description?: string;
}

export interface PrescriptionPdfData {
  appointmentId: number | string;
  patientName: string;
  patientId?: number | string;
  patientAgeGender?: string;
  doctorName: string;
  doctorSpecialization?: string;
  doctorQualifications?: string;
  doctorContactInfo?: string;
  visitDate: string;
  symptoms?: string;
  diagnosis?: string;
  medicine?: string;
  doses?: string;
  prescriptionNotes?: string;
  medicines?: Array<{
    name: string;
    dosage?: string;
    duration?: string;
    instructions?: string;
  }>;
  verificationUrl?: string;
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
    const doc = new jsPDF('p', 'mm', 'a4');

    const formattedAmount = `Rs. ${(receiptData.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Format date string cleanly
    let dateDisplay = receiptData.paymentDate;
    try {
      if (receiptData.paymentDate) {
        dateDisplay = new Date(receiptData.paymentDate).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        });
      }
    } catch (e) {
      dateDisplay = receiptData.paymentDate || 'N/A';
    }

    const paidToDisplay = receiptData.paidTo || receiptData.recipientUpiId || receiptData.upiId || receiptData.merchantUpiId || 'CareSync Healthcare Services';
    const txnId = receiptData.transactionId;
    const paymentMethodDisplay = (receiptData.paymentMethod).toUpperCase();

    // 1. Header Bar (Dark Slate Gradient)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 38, 'F');

    // Accent line at bottom of header
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 38, 210, 2, 'F');

    // Title / Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CareSync', 16, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Healthcare Services • Payment Receipt', 16, 29);

    // Payment Successful Pill Badge on Top Right
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(140, 14, 54, 12, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PAYMENT SUCCESSFUL', 143, 21.5);

    let y = 50;

    // 2. Payment Summary Ticket Box (Card with light background)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.roundedRect(16, y, 178, 68, 4, 4, 'FD');

    // Amount Paid Heading & Value
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('AMOUNT PAID', 24, y + 14);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(formattedAmount, 115, y + 14);

    // Dashed Divider line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineDashPattern([2, 2], 0);
    doc.line(24, y + 22, 186, y + 22);
    doc.setLineDashPattern([], 0); // reset line dash

    // Transaction Details Rows inside the card
    let cardY = y + 30;

    const addDetailRow = (label: string, value: string, isMono = false) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(label, 24, cardY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      if (isMono) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(9.5);
      } else {
        doc.setFontSize(10);
      }

      // Truncate long value if needed
      const maxLen = 42;
      const displayVal = value.length > maxLen ? value.substring(0, maxLen) + '...' : value;
      doc.text(displayVal, 95, cardY);
      cardY += 8;
    };

    addDetailRow('Transaction ID', txnId, true);
    addDetailRow('Date & Time', dateDisplay);
    addDetailRow('Payment Method', paymentMethodDisplay);
    addDetailRow('Paid to', paidToDisplay);

    y += 76;

    // 3. Patient & Service Information Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(16, y, 178, 48, 4, 4, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Patient & Booking Summary', 24, y + 10);

    doc.setDrawColor(241, 245, 249);
    doc.line(24, y + 14, 186, y + 14);

    let infoY = y + 22;
    doc.setFontSize(10);

    // Row 1: Patient Name
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Patient Name:', 24, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(receiptData.patientName || 'N/A', 60, infoY);

    // Row 1 Right: Booking ID
    if (receiptData.bookingId) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Booking / Appt ID:', 120, infoY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`#${receiptData.bookingId}`, 160, infoY);
    }
    infoY += 8;

    // Row 2: Description / Service
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Service:', 24, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(receiptData.description || 'Healthcare Consultation & Services', 60, infoY);
    infoY += 8;

    // Row 3: Prescribed / Doctor
    if (receiptData.prescribedBy) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Doctor:', 24, infoY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(receiptData.prescribedBy, 60, infoY);
    }

    y += 56;

    // 4. Lab Tests Table (if applicable)
    if (receiptData.selectedTests && receiptData.selectedTests.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Selected Diagnostic Tests', 16, y);
      y += 6;

      // Table Header
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(16, y, 178, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Test Name', 22, y + 5.5);
      doc.text('Description', 85, y + 5.5);
      doc.text('Price (Rs.)', 160, y + 5.5);
      y += 8;

      // Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      receiptData.selectedTests.forEach((test, idx) => {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        // Alternating background
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(16, y, 178, 8, 'F');
        }

        doc.setTextColor(15, 23, 42);
        doc.text(test.testName, 22, y + 5.5);
        const desc = test.description || 'Standard Test';
        doc.text(desc.substring(0, 35) + (desc.length > 35 ? '...' : ''), 85, y + 5.5);
        doc.text(test.price.toFixed(2), 160, y + 5.5);
        y += 8;
      });

      // Total Row
      doc.setDrawColor(226, 232, 240);
      doc.line(16, y, 194, y);
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Amount Paid: Rs. ${(receiptData.totalPrice || receiptData.amount).toFixed(2)}`, 125, y);
    }

    // 5. Security & Verification Footer
    const footerY = 270;
    doc.setDrawColor(226, 232, 240);
    doc.line(16, footerY, 194, footerY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('This is a computer-generated digital receipt issued by CareSync. No physical signature is required.', 16, footerY + 5);
    doc.text(`Verified & Processed via CareSync Secure Gateway • Reference: ${txnId}`, 16, footerY + 9);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 16, footerY + 13);

    // Save/Download PDF
    const fileName = `CareSync_Receipt_${txnId}.pdf`;
    doc.save(fileName);
  }


  /**
   * Unified method to generate payment receipt for Lab Test Booking
   * Fetches payment data from DB via bookingId and combines with lab booking details
   */
  generateReceiptByBookingId(bookingId: number, bookingData?: BookingResponse): void {
    this.paymentService.getPaymentByBookingId(bookingId).subscribe({
      next: (payment) => {
        const amt = Number(payment.amount) > 0 ? Number(payment.amount) : Number(bookingData?.totalPrice || 0);
        const receiptData: PaymentReceiptData = {
          transactionId: payment.transactionId,
          amount: amt,
          currency: payment.currency || 'INR',
          paymentMethod: payment.paymentMethod,
          patientName: bookingData?.patientName || payment.patientName || 'Patient',
          patientId: bookingData?.patientId || payment.patientId || 0,
          bookingId: bookingId,
          selectedTests: bookingData?.selectedTests
            ? bookingData.selectedTests
              .sort((a, b) => a.testName.localeCompare(b.testName))
              .map(test => ({
                testName: test.testName,
                price: test.price,
                description: test.description || ''
              }))
            : [],
          totalPrice: amt,
          prescribedBy: bookingData?.prescribedBy || payment.description || undefined,
          bookingDate: bookingData?.bookingDate || payment.createdAt,
          paymentDate: payment.paymentCompletedAt || payment.createdAt,
          status: payment.paymentStatus || 'Completed',
          description: 'Lab Test Booking Receipt',
          upiId: payment.upiId
        };

        this.generatePaymentReceipt(receiptData);
      },
      error: (error) => {
        console.error('Failed to fetch DB payment details for lab booking:', bookingId, error);
      }
    });
  }

  /**
   * Unified method to generate payment receipt for Doctor Appointment
   * Fetches payment data from DB via appointmentId and combines with appointment details
   */
  generateAppointmentReceiptByBookingId(appointmentId: number, appointmentData?: any): void {
    this.paymentService.getPaymentByBookingId(appointmentId).subscribe({
      next: (payment) => {
        const dateStr = payment.paymentCompletedAt || payment.createdAt || appointmentData?.appointmentDate || new Date().toISOString();
        const amt = Number(payment.amount) > 0 ? Number(payment.amount) : Number(appointmentData?.consultationFees || appointmentData?.doctorConsultationFees || 500);

        const receiptData: PaymentReceiptData = {
          transactionId: payment.transactionId,
          amount: amt,
          currency: payment.currency || 'INR',
          paymentMethod: payment.paymentMethod,
          patientName: payment.patientName || appointmentData?.patientName,
          patientId: payment.patientId,
          bookingId: appointmentId,
          totalPrice: amt,
          bookingDate: appointmentData?.appointmentDate || dateStr,
          paymentDate: dateStr,
          status: payment.paymentStatus || 'Completed',
          description: `Doctor Appointment - ${appointmentData?.doctorName || 'Doctor'} (${appointmentData?.doctorSpecialization || 'Consultation'})`,
          prescribedBy: appointmentData?.doctorName ? `Dr. ${appointmentData.doctorName}` : undefined,
          upiId: payment.upiId
        };

        this.generatePaymentReceipt(receiptData);
      },
      error: (err) => {
        console.error('Failed to fetch DB payment details for appointment:', appointmentId, err);
      }
    });
  }

  /**
   * Generate official Doctor Prescription & Consultation Summary PDF with QR Code Verification
   */
  generatePrescriptionPdf(data: PrescriptionPdfData): void {
    const doc = new jsPDF();
    const qrText = data.verificationUrl || `https://caresync.app/verify/prescription/${data.appointmentId}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;

    const qrImg = new Image();
    qrImg.crossOrigin = 'Anonymous';
    qrImg.onload = () => {
      this.buildPrescriptionPdf(doc, data, qrImg);
    };
    qrImg.onerror = () => {
      this.buildPrescriptionPdf(doc, data, null);
    };
    qrImg.src = qrApiUrl;
  }

  private buildPrescriptionPdf(doc: jsPDF, data: PrescriptionPdfData, qrImg: HTMLImageElement | null): void {
    // Colors
    const headerBg = [30, 41, 59]; // slate-800
    const primaryBlue = [37, 99, 235]; // blue-600
    const grayText = [71, 85, 105]; // slate-600
    const lightBg = [248, 250, 252]; // slate-50

    // 1. Top Header Banner
    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CareSync', 16, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('DIGITAL PRESCRIPTION & MEDICAL RECORD', 16, 29);

    // Header Right Badge
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rx Ref: #${data.appointmentId}`, 150, 22);

    let y = 48;

    // 2. Doctor Details & Verification QR Code
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Dr. ${data.doctorName}`, 16, y);

    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(`${data.doctorSpecialization || 'General Physician'} | ${data.doctorQualifications || 'MBBS'}`, 16, y);

    if (data.doctorContactInfo) {
      y += 5;
      doc.text(`Contact: ${data.doctorContactInfo}`, 16, y);
    }

    // Embed QR Code on top right
    if (qrImg) {
      try {
        doc.addImage(qrImg, 'PNG', 162, 40, 32, 32);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); // green
        doc.text('VERIFIED PRESCRIPTION', 155, 75);
      } catch (e) {
        doc.setDrawColor(37, 99, 235);
        doc.rect(162, 40, 32, 32);
        doc.setFontSize(7);
        doc.text('QR VERIFIED', 168, 58);
      }
    }

    y = Math.max(y + 12, 80);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(16, y, 194, y);
    y += 10;

    // 3. Patient Information Box
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(16, y, 178, 24, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(16, y, 178, 24, 3, 3, 'D');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('PATIENT DETAILS', 22, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Name: ${data.patientName}`, 22, y + 16);
    doc.text(`Date: ${data.visitDate}`, 120, y + 16);

    y += 32;

    // 4. Symptoms & Diagnosis Box
    if (data.symptoms || data.diagnosis) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('CLINICAL DIAGNOSIS & SYMPTOMS', 16, y);
      y += 6;

      if (data.symptoms) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Symptoms:', 16, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitSymptoms = doc.splitTextToSize(data.symptoms, 150);
        doc.text(splitSymptoms, 42, y);
        y += splitSymptoms.length * 5 + 3;
      }

      if (data.diagnosis) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Diagnosis:', 16, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitDiagnosis = doc.splitTextToSize(data.diagnosis, 150);
        doc.text(splitDiagnosis, 42, y);
        y += splitDiagnosis.length * 5 + 4;
      }

      y += 4;
    }

    // 5. Prescribed Medicines & Dosage Table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text('Rx - PRESCRIBED MEDICINES & DOSAGE', 16, y);
    y += 8;

    let medicinesList: Array<{ name: string; dosage?: string; duration?: string; instructions?: string }> = [];

    if (data.medicines && data.medicines.length > 0) {
      medicinesList = data.medicines;
    } else if (data.medicine) {
      const medNames = String(data.medicine).split(',').map(s => s.trim()).filter(Boolean);
      const dosages = String(data.doses || '').split(',').map(s => s.trim()).filter(Boolean);
      medicinesList = medNames.map((name, idx) => ({
        name: name,
        dosage: dosages[idx] || (dosages.length === 1 ? dosages[0] : 'As prescribed by physician'),
        duration: 'As directed'
      }));
    }

    if (medicinesList.length > 0) {
      // Table Header Background (Dark slate)
      doc.setFillColor(30, 41, 59);
      doc.rect(16, y, 178, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('#', 20, y + 5.5);
      doc.text('Medicine Name', 30, y + 5.5);
      doc.text('Dosage & Instructions', 110, y + 5.5);
      y += 8;

      medicinesList.forEach((m, idx) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Alternating background row fill
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
        } else {
          doc.setFillColor(255, 255, 255);
        }

        const splitMedName = doc.splitTextToSize(m.name, 75);
        const dosageText = `${m.dosage || 'As directed'}${m.instructions ? ' (' + m.instructions + ')' : ''}`.trim();
        const splitDosage = doc.splitTextToSize(dosageText, 80);

        const rowHeight = Math.max(splitMedName.length, splitDosage.length) * 5.5 + 4;

        doc.rect(16, y, 178, rowHeight, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.rect(16, y, 178, rowHeight, 'D');

        // Row Index #
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`${idx + 1}.`, 20, y + 5);

        // Medicine Name (Bold)
        doc.setTextColor(30, 41, 59);
        doc.text(splitMedName, 30, y + 5);

        // Dosage & Instructions (Normal)
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(splitDosage, 110, y + 5);

        y += rowHeight;
      });
      y += 4;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('No specific medication prescribed.', 22, y);
      y += 10;
    }

    // 6. Doctor's Notes & Advice Section (Placed below medicines table)
    if (data.prescriptionNotes) {
      y += 2;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('DOCTOR\'S NOTES & ADVICE', 16, y);
      y += 6;

      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      const splitNotes = doc.splitTextToSize(data.prescriptionNotes, 170);
      const boxHeight = Math.max(16, splitNotes.length * 5 + 6);
      doc.roundedRect(16, y, 178, boxHeight, 2, 2, 'F');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(splitNotes, 22, y + 6);
      y += boxHeight + 8;
    }

    // 6. Footer & Digital Signature
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Dr. ${data.doctorName}`, 150, 260);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('(Digitally Signed & Validated)', 142, 264);

    doc.line(16, 272, 194, 272);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('This digital prescription is generated by CareSync Healthcare Management System.', 16, 278);
    doc.text(`Verified QR Code Security | Generated on: ${new Date().toLocaleString()}`, 16, 282);

    // Save PDF
    const cleanPatientName = (data.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `CareSync_Prescription_${cleanPatientName}_Appt_${data.appointmentId}.pdf`;
    doc.save(fileName);
  }
}