import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MedicalHistoryService } from '../../../services/medical-history.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-medical-history-details',
  template: `
    <div class="medical-history-details-container p-4">
      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Loading medical history details...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div class="flex">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error Loading Medical History</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && !error">
      <div class="flex items-center mb-6">
        <button routerLink="/shared/medical-history" class="mr-4 text-gray-600 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 class="text-2xl font-bold">Medical Record Details</h2>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Main Record Information -->
        <div class="md:col-span-2">
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-semibold">{{ record.description }}</h3>
                <div class="mt-1 flex items-center">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-2" 
                        [ngClass]="{
                          'bg-blue-100 text-blue-800': record.category === 'Condition',
                          'bg-green-100 text-green-800': record.category === 'Medication',
                          'bg-red-100 text-red-800': record.category === 'Allergy',
                          'bg-purple-100 text-purple-800': record.category === 'Procedure',
                          'bg-yellow-100 text-yellow-800': record.category === 'Immunization'
                        }">
                    {{ record.category }}
                  </span>
                  <span class="text-gray-600">{{ record.date }}</span>
                </div>
              </div>
              <div class="flex space-x-2">
                <button class="p-2 text-blue-600 hover:text-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="p-2 text-red-600 hover:text-red-800">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="border-t border-gray-200 pt-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Provider</h4>
                  <p class="mt-1">{{ record.provider }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Facility</h4>
                  <p class="mt-1">{{ record.facility }}</p>
                </div>
              </div>
              
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-500">Details</h4>
                <p class="mt-1">{{ record.details }}</p>
              </div>
              
              <!-- Condition-specific fields -->
              <div *ngIf="record.category === 'Condition'" class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Diagnosis Date</h4>
                  <p class="mt-1">{{ record.diagnosisDate }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Status</h4>
                  <p class="mt-1">{{ record.status }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Treatment Plan</h4>
                  <p class="mt-1">{{ record.treatmentPlan }}</p>
                </div>
              </div>
              
              <!-- Medication-specific fields -->
              <div *ngIf="record.category === 'Medication'" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Dosage</h4>
                    <p class="mt-1">{{ record.dosage }}</p>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Frequency</h4>
                    <p class="mt-1">{{ record.frequency }}</p>
                  </div>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Start Date</h4>
                  <p class="mt-1">{{ record.startDate }}</p>
                </div>
                <!-- <div>
                  <h4 class="text-sm font-medium text-gray-500">End Date</h4>
                  <p class="mt-1">{{ record.endDate || 'Ongoing' }}</p>
                </div> -->
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Instructions</h4>
                  <p class="mt-1">{{ record.instructions }}</p>
                </div>
              </div>
              
              <!-- Allergy-specific fields -->
              <div *ngIf="record.category === 'Allergy'" class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Reaction</h4>
                  <p class="mt-1">{{ record.reaction }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Severity</h4>
                  <p class="mt-1">{{ record.severity }}</p>
                </div>
              </div>
              
              <!-- Procedure-specific fields -->
              <div *ngIf="record.category === 'Procedure'" class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Procedure Date</h4>
                  <p class="mt-1">{{ record.procedureDate }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Reason</h4>
                  <p class="mt-1">{{ record.reason }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Outcome</h4>
                  <p class="mt-1">{{ record.outcome }}</p>
                </div>
              </div>
              
              <!-- Immunization-specific fields -->
              <div *ngIf="record.category === 'Immunization'" class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Vaccine</h4>
                  <p class="mt-1">{{ record.vaccine }}</p>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-500">Dose Number</h4>
                  <p class="mt-1">{{ record.doseNumber }}</p>
                </div>
                <!-- <div>
                  <h4 class="text-sm font-medium text-gray-500">Next Dose Due</h4>
                  <p class="mt-1">{{ record.nextDoseDue || 'Not required' }}</p>
                </div> -->
              </div>
            </div>
          </div>
          
          <!-- Notes Section -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Notes</h3>
            <div *ngIf="record.notes && record.notes.length > 0">
              <div *ngFor="let note of record.notes" class="mb-4 pb-4 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
                <div class="flex justify-between items-start mb-2">
                  <div class="font-medium">{{ note.author }}</div>
                  <div class="text-sm text-gray-500">{{ note.date }}</div>
                </div>
                <p class="text-gray-700">{{ note.content }}</p>
              </div>
            </div>
            <p *ngIf="!record.notes || record.notes.length === 0" class="text-gray-500 italic">No notes available for this record.</p>
            
            <!-- Add Note Form -->
            <div class="mt-6">
              <h4 class="text-md font-medium mb-2">Add Note</h4>
              <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Add a note about this record..."></textarea>
              <div class="mt-2 flex justify-end">
                <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Note</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sidebar -->
        <div class="md:col-span-1">
          <!-- Related Records -->
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h3 class="text-lg font-semibold mb-4">Related Records</h3>
            <div *ngIf="relatedRecords.length > 0" class="space-y-4">
              <div *ngFor="let related of relatedRecords" class="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{{ related.description }}</div>
                    <div class="text-sm text-gray-600">{{ related.date }}</div>
                  </div>
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                        [ngClass]="{
                          'bg-blue-100 text-blue-800': related.category === 'Condition',
                          'bg-green-100 text-green-800': related.category === 'Medication',
                          'bg-red-100 text-red-800': related.category === 'Allergy',
                          'bg-purple-100 text-purple-800': related.category === 'Procedure',
                          'bg-yellow-100 text-yellow-800': related.category === 'Immunization'
                        }">
                    {{ related.category }}
                  </span>
                </div>
                <a [routerLink]="['/shared/medical-history', related.id]" class="text-blue-600 hover:text-blue-900 text-sm mt-1 inline-block">View details</a>
              </div>
            </div>
            <p *ngIf="relatedRecords.length === 0" class="text-gray-500 italic">No related records found.</p>
          </div>
          
          <!-- Documents -->
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h3 class="text-lg font-semibold mb-4">Documents</h3>
            <div *ngIf="documents.length > 0" class="space-y-3">
              <div *ngFor="let doc of documents" class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md" 
                       [ngClass]="{
                         'bg-red-100 text-red-600': doc.type === 'pdf',
                         'bg-blue-100 text-blue-600': doc.type === 'doc',
                         'bg-green-100 text-green-600': doc.type === 'image'
                       }">
                    <svg *ngIf="doc.type === 'pdf'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <svg *ngIf="doc.type === 'doc'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <svg *ngIf="doc.type === 'image'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">{{ doc.name }}</div>
                    <div class="text-xs text-gray-500">{{ doc.date }}</div>
                  </div>
                </div>
                <a href="#" class="text-blue-600 hover:text-blue-900">View</a>
              </div>
            </div>
            <p *ngIf="documents.length === 0" class="text-gray-500 italic">No documents attached to this record.</p>
            <div class="mt-4">
              <button class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Attach Document
              </button>
            </div>
          </div>
          
          <!-- Timeline -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Timeline</h3>
            <div class="relative">
              <div class="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
              <div *ngFor="let event of timeline" class="mb-6 last:mb-0 relative pl-10">
                <div class="absolute left-0 top-1 h-8 w-8 rounded-full flex items-center justify-center" 
                     [ngClass]="{
                       'bg-blue-100 text-blue-600': event.type === 'created',
                       'bg-green-100 text-green-600': event.type === 'updated',
                       'bg-yellow-100 text-yellow-600': event.type === 'note',
                       'bg-purple-100 text-purple-600': event.type === 'document'
                     }">
                  <svg *ngIf="event.type === 'created'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <svg *ngIf="event.type === 'updated'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <svg *ngIf="event.type === 'note'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <svg *ngIf="event.type === 'document'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div class="flex justify-between">
                    <div class="font-medium">{{ event.title }}</div>
                    <div class="text-sm text-gray-500">{{ event.date }}</div>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ event.description }}</p>
                  <div *ngIf="event.user" class="text-xs text-gray-500 mt-1">By {{ event.user }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: []
})
export class MedicalHistoryDetailsComponent implements OnInit {
  recordId: number = 0;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private medicalHistoryService: MedicalHistoryService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.recordId = +params['id'];
      this.loadMedicalHistoryDetails();
    });
  }

  private loadMedicalHistoryDetails() {
    this.loading = true;
    this.error = null;

    // Load main record
    this.medicalHistoryService.getMedicalHistoryById(this.recordId).subscribe({
      next: (record: any) => {
        this.record = this.transformRecord(record);
        this.loadRelatedData();
      },
      error: (error: any) => {
        console.error('Error loading medical history record:', error);
        this.error = 'Failed to load medical history record';
        this.loading = false;
        // Keep mock data as fallback
      }
    });
  }

  private loadRelatedData() {
    // Load attachments/documents
    this.medicalHistoryService.getMedicalHistoryAttachments(this.recordId).subscribe({
      next: (attachments: any) => {
        this.documents = attachments.map((att: any) => ({
          name: att.fileName,
          type: this.getFileType(att.fileName),
          date: new Date(att.uploadDate).toLocaleDateString()
        }));
      },
      error: (error: any) => {
        console.error('Error loading attachments:', error);
        // Keep mock documents as fallback
      }
    });

    // Load notes
    this.medicalHistoryService.getMedicalHistoryNotes(this.recordId).subscribe({
      next: (notes: any) => {
        if (notes && notes.length > 0) {
          this.record.notes = notes.map((note: any) => ({
            author: note.authorName || 'Unknown',
            date: new Date(note.createdAt).toLocaleDateString(),
            content: note.content
          }));
        }
      },
      error: (error: any) => {
        console.error('Error loading notes:', error);
        // Keep mock notes as fallback
      }
    });

    // Load timeline
    this.medicalHistoryService.getMedicalHistoryTimeline(this.recordId).subscribe({
      next: (timelineData: any) => {
        this.timeline = timelineData.map((event: any) => ({
          type: this.mapEventType(event.eventType),
          title: event.title,
          description: event.description,
          date: new Date(event.eventDate).toLocaleDateString(),
          user: event.userName || 'System'
        }));
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading timeline:', error);
        this.loading = false;
        // Keep mock timeline as fallback
      }
    });

    // Load related records (using patient medical history)
    if (this.record && this.record.patientId) {
      this.medicalHistoryService.getPatientMedicalHistory(this.record.patientId).subscribe({
        next: (records: any) => {
          this.relatedRecords = records
            .filter((r: any) => r.id !== this.recordId)
            .slice(0, 3)
            .map((r: any) => ({
              id: r.id,
              category: r.category || 'General',
              description: r.diagnosis || r.description || 'Medical Record',
              date: new Date(r.visitDate || r.date).toLocaleDateString()
            }));
        },
        error: (error: any) => {
          console.error('Error loading related records:', error);
          // Keep mock related records as fallback
        }
      });
    }
  }

  private transformRecord(apiRecord: any): any {
    return {
      id: apiRecord.id,
      category: apiRecord.category || 'General',
      description: apiRecord.description,
      details: apiRecord.details || apiRecord.notes,
      date: new Date(apiRecord.date).toLocaleDateString(),
      provider: apiRecord.providerName || apiRecord.doctorName || 'Unknown Provider',
      facility: apiRecord.facility || 'CareSync Medical Center',
      diagnosisDate: apiRecord.diagnosisDate ? new Date(apiRecord.diagnosisDate).toLocaleDateString() : null,
      status: apiRecord.status || 'Active',
      treatmentPlan: apiRecord.treatmentPlan,
      vaccine: apiRecord.vaccine,
      doseNumber: apiRecord.doseNumber,
      dosage: apiRecord.dosage,
      frequency: apiRecord.frequency,
      startDate: apiRecord.startDate ? new Date(apiRecord.startDate).toLocaleDateString() : null,
      instructions: apiRecord.instructions,
      reaction: apiRecord.reaction,
      severity: apiRecord.severity,
      procedureDate: apiRecord.procedureDate ? new Date(apiRecord.procedureDate).toLocaleDateString() : null,
      reason: apiRecord.reason,
      outcome: apiRecord.outcome,
      patientId: apiRecord.patientId,
      notes: apiRecord.notes || []
    };
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc': case 'docx': return 'doc';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'image';
      default: return 'doc';
    }
  }

  private mapEventType(eventType: string): string {
    switch (eventType?.toLowerCase()) {
      case 'create': case 'created': return 'created';
      case 'update': case 'updated': case 'modify': case 'modified': return 'updated';
      case 'note': case 'note_added': return 'note';
      case 'document': case 'attachment': case 'file_upload': return 'document';
      default: return 'updated';
    }
  }
  
  // Mock record data
  record = {
    id: 1,
    patientId: 1,
    category: 'Condition',
    description: 'Hypertension',
    details: 'Stage 1 hypertension, prescribed medication',
    date: 'May 15, 2023',
    provider: 'Dr. Sarah Johnson',
    facility: 'CareSync Medical Center',
    diagnosisDate: 'May 10, 2023',
    status: 'Active',
    treatmentPlan: 'Medication (Lisinopril 10mg daily), lifestyle modifications including reduced sodium intake, regular exercise, and weight management. Follow-up appointment scheduled in 3 months.',
    vaccine: 'Influenza',
    doseNumber: '1 of 1',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: 'May 15, 2023',
    instructions: 'Take with food',
    reaction: 'Mild dizziness',
    severity: 'Mild',
    procedureDate: 'May 10, 2023',
    reason: 'Diagnostic',
    outcome: 'Normal results',
    notes: [
      {
        author: 'Dr. Sarah Johnson',
        date: 'May 15, 2023',
        content: 'Patient presented with consistently elevated blood pressure readings over the past 3 months. Readings today: 142/92 mmHg. Discussed lifestyle modifications and started on Lisinopril 10mg daily.'
      },
      {
        author: 'Dr. Sarah Johnson',
        date: 'May 30, 2023',
        content: 'Patient called to report mild dizziness after starting medication. Advised to take medication at night and monitor symptoms. Will reassess at next visit.'
      }
    ]
  };
  
  // Mock related records
  relatedRecords = [
    {
      id: 2,
      category: 'Medication',
      description: 'Lisinopril 10mg',
      date: 'Apr 22, 2023'
    },
    {
      id: 3,
      category: 'Procedure',
      description: 'Echocardiogram',
      date: 'Mar 10, 2023'
    }
  ];
  
  // Mock documents
  documents = [
    {
      name: 'Blood Pressure Log.pdf',
      type: 'pdf',
      date: 'May 15, 2023'
    },
    {
      name: 'Cardiology Referral.doc',
      type: 'doc',
      date: 'May 15, 2023'
    }
  ];
  
  // Mock timeline
  timeline = [
    {
      type: 'created',
      title: 'Record Created',
      description: 'Hypertension diagnosis added to medical record',
      date: 'May 15, 2023',
      user: 'Dr. Sarah Johnson'
    },
    {
      type: 'document',
      title: 'Document Added',
      description: 'Blood Pressure Log.pdf attached to record',
      date: 'May 15, 2023',
      user: 'Dr. Sarah Johnson'
    },
    {
      type: 'document',
      title: 'Document Added',
      description: 'Cardiology Referral.doc attached to record',
      date: 'May 15, 2023',
      user: 'Dr. Sarah Johnson'
    },
    {
      type: 'note',
      title: 'Note Added',
      description: 'Initial consultation note added',
      date: 'May 15, 2023',
      user: 'Dr. Sarah Johnson'
    },
    {
      type: 'note',
      title: 'Note Added',
      description: 'Follow-up note regarding medication side effects',
      date: 'May 30, 2023',
      user: 'Dr. Sarah Johnson'
    }
  ];
}