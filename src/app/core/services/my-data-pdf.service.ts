import { Injectable } from '@angular/core';
// Type-only import: jspdf itself is loaded on demand, like PdfService does
import type { jsPDF } from 'jspdf';
import { parseMedicines } from '../../shared/utils/medicines.util';

type Row = Record<string, any>;

interface Column {
  title: string;
  width: number;
  value: (row: Row) => string;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 16;

const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const BLUE: [number, number, number] = [37, 99, 235]; // blue-600
const GRAY: [number, number, number] = [71, 85, 105]; // slate-600
const LIGHT: [number, number, number] = [248, 250, 252]; // slate-50
const LINE: [number, number, number] = [226, 232, 240]; // slate-200

/**
 * "Download My Data" as a readable PDF: the patient's own data export (GET /api/patients/me/export) laid out
 * in sections. Built in the browser from the JSON the patient already receives; chats are left out (they stay
 * in the JSON copy).
 */
@Injectable({ providedIn: 'root' })
export class MyDataPdfService {
  private doc!: jsPDF;
  private y = 0;

  async download(data: Row): Promise<void> {
    const { jsPDF: JsPDF } = await import('jspdf');
    this.doc = new JsPDF('p', 'mm', 'a4');
    this.y = 0;

    this.header(data);
    this.profile(data['profile'] || {});
    this.visits(asList(data['medicalRecords']));
    this.table('Appointments', asList(data['appointments']), [
      { title: 'Date', width: 34, value: r => dateTime(r['dateTime']) },
      { title: 'Doctor', width: 42, value: r => text(r['doctor']) },
      { title: 'Speciality', width: 38, value: r => text(r['specialization']) },
      { title: 'Reason', width: 46, value: r => text(r['reason']) },
      { title: 'Status', width: 22, value: r => label(r['status']) },
    ], 'No appointments yet.');
    this.table('Vitals', asList(data['vitals']), [
      { title: 'Recorded', width: 34, value: r => dateTime(r['recordedAt']) },
      { title: 'BP (mmHg)', width: 24, value: r => bp(r) },
      { title: 'Sugar (mg/dL)', width: 24, value: r => num(r['sugarLevel']) },
      { title: 'Weight (kg)', width: 22, value: r => num(r['weight']) },
      { title: 'Temp (°F)', width: 20, value: r => num(r['temperature']) },
      { title: 'Pulse (/min)', width: 22, value: r => num(r['heartRate']) },
      { title: 'Breaths (/min)', width: 16, value: r => num(r['respiratoryRate']) },
    ], 'No vitals recorded.');
    this.intakes(asList(data['preVisitIntakes']));
    this.table('Documents & lab reports', asList(data['documents']), [
      { title: 'Uploaded', width: 34, value: r => dateTime(r['uploadDate']) },
      { title: 'Type', width: 34, value: r => label(r['documentType']) },
      { title: 'File', width: 60, value: r => text(r['filename']) },
      { title: 'Description', width: 54, value: r => text(r['description']) },
    ], 'No documents uploaded.');
    this.table('Payments', asList(data['payments']), [
      { title: 'Date', width: 34, value: r => dateTime(r['paymentCompletedAt'] || r['createdAt']) },
      { title: 'Description', width: 62, value: r => text(r['description']) },
      { title: 'Amount', width: 30, value: r => money(r['amount'], r['currency']) },
      { title: 'Method', width: 28, value: r => label(r['paymentMethod']) },
      { title: 'Status', width: 28, value: r => label(r['paymentStatus']) },
    ], 'No payments.');
    this.table('Feedback you gave', asList(data['feedbackGiven']), [
      { title: 'Date', width: 34, value: r => dateTime(r['createdAt']) },
      { title: 'Doctor', width: 42, value: r => text(r['doctorName']) },
      { title: 'Rating', width: 18, value: r => (r['rating'] ? `${r['rating']}/5` : '-') },
      { title: 'Comment', width: 88, value: r => text(r['comment']) },
    ], 'No feedback given.');

    this.footers();
    this.doc.save(`caresync-my-data-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ---- Sections

  private header(data: Row) {
    const doc = this.doc;
    doc.setFillColor(...DARK);
    doc.rect(0, 0, PAGE_W, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CareSync', MARGIN, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('MY HEALTH DATA', MARGIN, 25);
    doc.setFontSize(8);
    doc.text(`Generated ${dateTime(data['exportedAt'] || new Date().toISOString())}`, PAGE_W - MARGIN, 18, { align: 'right' });
    doc.text('Personal & confidential', PAGE_W - MARGIN, 25, { align: 'right' });
    this.y = 42;
  }

  private profile(p: Row) {
    this.sectionTitle('Profile');
    const name = [p['firstName'], p['lastName']].filter(Boolean).join(' ') || p['name'] || p['username'];
    const rows: [string, string][] = [
      ['Name', text(name)],
      ['Username', text(p['username'])],
      ['Email', text(p['email'])],
      ['Phone', text(p['contactInfo'])],
      ['Date of birth', date(p['dateOfBirth'])],
      ['Gender', label(p['gender'])],
      ['Blood group', text(p['bloodGroup'])],
      ['Health conditions', text(p['illnessDetails'])],
      ['Member since', date(p['createdAt'])],
    ];
    this.keyValues(rows);
  }

  private visits(records: Row[]) {
    this.sectionTitle('Visits & prescriptions');
    if (!records.length) {
      this.note('No signed visit records yet.');
      return;
    }
    for (const r of records) {
      const doctor = [r['doctorName'] ? `Dr. ${r['doctorName']}` : '', r['doctorSpecialization']].filter(Boolean).join(' · ');
      const medicines = parseMedicines(r['medicine'], r['doses']);
      const fields: [string, string][] = [
        ['Diagnosis', r['diagnosis']],
        ['Symptoms', r['symptoms']],
        ['Treatment', r['treatment']],
        ['Notes', r['notes']],
      ].filter(([, v]) => !!String(v ?? '').trim()) as [string, string][];

      // Card heading
      this.ensure(14);
      const doc = this.doc;
      doc.setFillColor(...LIGHT);
      doc.setDrawColor(...LINE);
      doc.roundedRect(MARGIN, this.y, CONTENT_W, 9, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text(date(r['visitDate']), MARGIN + 3, this.y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(clip(doc, doctor || '-', CONTENT_W - 40), PAGE_W - MARGIN - 3, this.y + 6, { align: 'right' });
      this.y += 12;

      this.keyValues(fields, 30);
      if (medicines.length) {
        this.ensure(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        doc.text('Medicines', MARGIN + 2, this.y + 3);
        this.y += 5;
        this.rowsTable(medicines.map(m => ({ name: m.name, dosage: m.dosage })), [
          { title: 'Medicine', width: 80, value: m => text(m['name']) },
          { title: 'Dose', width: CONTENT_W - 80, value: m => text(m['dosage']) },
        ]);
      }
      this.y += 4;
    }
  }

  private intakes(intakes: Row[]) {
    this.sectionTitle('Pre-visit forms');
    if (!intakes.length) {
      this.note('No pre-visit forms.');
      return;
    }
    for (const i of intakes) {
      this.ensure(10);
      const doc = this.doc;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...BLUE);
      doc.text(`Submitted ${dateTime(i['submittedAt'])}`, MARGIN, this.y + 3);
      this.y += 6;
      const severity = [i['duration'], i['severity']].filter(Boolean).join(' · ');
      this.keyValues(([
        ['Main complaint', i['chiefComplaint']],
        ['Symptoms', i['symptoms']],
        ['Duration / severity', severity],
        ['Current medicines', i['currentMedications']],
        ['Allergies', i['allergies']],
        ['Warning signs', i['redFlags']],
      ] as [string, string][]).filter(([, v]) => !!String(v ?? '').trim()), 36);
      this.y += 2;
    }
  }

  // ---- Building blocks

  private sectionTitle(title: string) {
    this.ensure(16);
    const doc = this.doc;
    this.y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text(title, MARGIN, this.y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, this.y + 2, MARGIN + 18, this.y + 2);
    doc.setLineWidth(0.2);
    this.y += 7;
  }

  private note(message: string) {
    this.ensure(7);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...GRAY);
    this.doc.text(message, MARGIN, this.y + 3);
    this.y += 8;
  }

  /** Label on the left, wrapped value on the right */
  private keyValues(rows: [string, string][], labelWidth = 36) {
    const doc = this.doc;
    const valueX = MARGIN + 2 + labelWidth;
    const valueW = CONTENT_W - labelWidth - 4;
    for (const [key, value] of rows) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(text(value), valueW) as string[];
      const h = lines.length * 4.2 + 1.5;
      this.ensure(h);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GRAY);
      doc.text(key, MARGIN + 2, this.y + 3);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      doc.text(lines, valueX, this.y + 3);
      this.y += h;
    }
    this.y += 2;
  }

  private table(title: string, rows: Row[], columns: Column[], empty: string) {
    this.sectionTitle(title);
    if (!rows.length) {
      this.note(empty);
      return;
    }
    this.rowsTable(rows, columns);
    this.y += 3;
  }

  /** A simple table: header row, wrapped cells, zebra rows; the header repeats on a new page */
  private rowsTable(rows: Row[], columns: Column[]) {
    const doc = this.doc;
    const drawHeader = () => {
      doc.setFillColor(...DARK);
      doc.rect(MARGIN, this.y, CONTENT_W, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      let x = MARGIN;
      for (const c of columns) {
        doc.text(clip(doc, c.title, c.width - 3), x + 1.5, this.y + 4.8);
        x += c.width;
      }
      this.y += 7;
    };

    this.ensure(14);
    drawHeader();
    rows.forEach((row, index) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const cells = columns.map(c => doc.splitTextToSize(c.value(row) || '-', c.width - 3) as string[]);
      const h = Math.max(...cells.map(lines => lines.length)) * 3.9 + 3;
      if (this.y + h > BOTTOM) {
        this.newPage();
        drawHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
      }
      if (index % 2 === 1) {
        doc.setFillColor(...LIGHT);
        doc.rect(MARGIN, this.y, CONTENT_W, h, 'F');
      }
      doc.setTextColor(...DARK);
      let x = MARGIN;
      cells.forEach((lines, i) => {
        doc.text(lines, x + 1.5, this.y + 4.2);
        x += columns[i].width;
      });
      doc.setDrawColor(...LINE);
      doc.line(MARGIN, this.y + h, MARGIN + CONTENT_W, this.y + h);
      this.y += h;
    });
  }

  private ensure(height: number) {
    if (this.y + height > BOTTOM) {
      this.newPage();
    }
  }

  private newPage() {
    this.doc.addPage();
    this.y = MARGIN + 4;
  }

  private footers() {
    const doc = this.doc;
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...LINE);
      doc.line(MARGIN, PAGE_H - 11, PAGE_W - MARGIN, PAGE_H - 11);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text('CareSync · Contains personal health information. Keep it private.', MARGIN, PAGE_H - 6.5);
      doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 6.5, { align: 'right' });
    }
  }
}

// ---- Value formatting

function asList(value: unknown): Row[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  const s = String(value ?? '').trim();
  return s || '-';
}

/** "NO_SHOW_PATIENT" → "No show patient" */
function label(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s) return '-';
  const words = s.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function num(value: unknown): string {
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function bp(r: Row): string {
  const s = r['systolicBP'];
  const d = r['diastolicBP'];
  if (s == null && d == null) return '-';
  return `${s ?? '-'}/${d ?? '-'}`;
}

function money(amount: unknown, currency: unknown): string {
  const n = Number(amount);
  if (!isFinite(n)) return '-';
  const value = n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return !currency || currency === 'INR' ? `Rs. ${value}` : `${currency} ${value}`;
}

function date(value: unknown): string {
  const d = parse(value);
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : text(value);
}

function dateTime(value: unknown): string {
  const d = parse(value);
  return d
    ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : text(value);
}

function parse(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

/** One line that fits the width, with "…" when cut */
function clip(doc: jsPDF, value: string, width: number): string {
  if (doc.getTextWidth(value) <= width) return value;
  let s = value;
  while (s.length > 1 && doc.getTextWidth(s + '...') > width) s = s.slice(0, -1);
  return s + '...';
}
