export interface AiChatRequest {
    message: string;
    conversationId?: string;
}

export interface AiChatResponse {
    response?: string;
    success: boolean;
    error?: string;
    conversationId?: string;
    suggestion?: AiBookingSuggestion;
}

export type SuggestionType = 'SPECIALIZATIONS' | 'DOCTORS' | 'DATES' | 'SLOTS' | 'CONFIRM' | 'MY_APPOINTMENTS';

export interface DoctorSuggestion {
    id: number;
    name: string;
    specialization: string;
    consultationFee: number;
    profileImageUrl?: string;
    languages?: string;
    experience?: number;
    isVerified?: boolean;
    isOnLeave?: boolean;
    leaveMessage?: string;
}

export interface AiBookingSuggestion {
    type: SuggestionType;
    specializations?: string[];
    doctors?: DoctorSuggestion[];
    appointments?: any[]; // For upcoming appointments
    slots?: string[];
    doctorId?: number;
    doctorName?: string;
    specialization?: string;
    slot?: string;
    date?: string;
    originalDate?: string;
    originalSlot?: string;
    appointmentId?: number;
    reason?: string;
    consultationFee?: number;
}

export interface ChatMessage {
    text: string;
    isAi: boolean;
    timestamp: Date;
    suggestion?: AiBookingSuggestion;
}

export interface MedicalSummaryResponse {
    summary?: string;
    success: boolean;
    error?: string;
}

export interface ClinicalMatch {
    diagnosis: string;
    treatment: string;
    medicine: string;
    dosage: string;
    reasoning: string;
}

export interface DiagnosisSuggestionDto {
    disclaimer?: string;
    suggestions: ClinicalMatch[];
}

export interface MedicationItem {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
}

export interface LabResultItem {
    testName: string;
    resultValue?: string;
    referenceRange?: string;
    status?: 'NORMAL' | 'HIGH' | 'LOW' | 'ABNORMAL';
}

export interface VisionScanResponse {
    success: boolean;
    error?: string;
    documentType?: 'PRESCRIPTION' | 'LAB_REPORT' | 'MEDICAL_NOTE' | 'UNKNOWN';
    patientName?: string;
    doctorName?: string;
    date?: string;
    medications?: MedicationItem[];
    labResults?: LabResultItem[];
    rawSummary?: string;
    warnings?: string[];
}

export interface SoapNote {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
}

export interface ClinicalDictationResponse {
    success: boolean;
    error?: string;
    patientName?: string;
    chiefComplaint?: string;
    vitals?: string;
    diagnosis?: string;
    prescriptions?: MedicationItem[];
    labOrders?: string[];
    followUp?: string;
    soapNote?: SoapNote;
}

