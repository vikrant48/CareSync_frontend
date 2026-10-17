export interface AiChatRequest {
    message: string;
    conversationId?: string;
    /** Doctors only: the patient picked with @patient (checked on the server) */
    patientId?: number;
}

/** Patient dashboard "AI health brief" (facts from the records; tips from the AI or a standard checklist) */
export interface PatientHealthBrief {
    nextAppointment: {
        appointmentId: number;
        doctorName: string;
        specialization?: string | null;
        dateTime: string;
        status?: string | null;
        preVisitFormDone: boolean;
    } | null;
    preparationTips: string[];
    tipsFromAi: boolean;
    pendingFollowUps: {
        type: 'PRE_VISIT_FORM' | 'LAB_RESULTS_PENDING';
        text: string;
        appointmentId?: number | null;
        bookingId?: number | null;
        date?: string | null;
    }[];
    unreadLabReports: { documentId: number; filename: string; uploadedAt: string; explained: boolean }[];
    note: string;
}

/** A saved plain-language lab report explanation, always shown with its note */
export interface LabReportExplanation {
    documentId: number;
    explanation: string;
    note: string;
    explainedAt: string;
}

/** A patient the doctor can pick in the co-pilot chat (their own patients only) */
export interface AiCopilotPatient {
    id: number;
    name: string;
    lastAppointment: string | null;
}

export interface AiChatResponse {
    response?: string;
    success: boolean;
    error?: string;
    conversationId?: string;
    suggestion?: AiBookingSuggestion;
    /** Emergency or urgent-care notice to show above the answer */
    emergency?: AiEmergencyInfo;
}

/** One row of the saved AI chats list */
export interface AiConversationSummary {
    id: string;
    title: string;
    updatedAt: string;
    messageCount: number;
}

/** A saved AI chat with its messages (role 'user' or 'assistant') */
export interface AiConversationDetail {
    id: string;
    title: string;
    updatedAt: string;
    messages: {
        role: 'user' | 'assistant';
        text: string;
        suggestion?: AiBookingSuggestion | null;
        emergency?: AiEmergencyInfo | null;
        createdAt: string;
    }[];
}

export interface AiEmergencyInfo {
    /** EMERGENCY: act now. URGENT: see a doctor today. */
    level: 'EMERGENCY' | 'URGENT';
    category: 'MEDICAL' | 'MENTAL_HEALTH';
    title: string;
    message: string;
    reasons?: string[];
    contacts: { label: string; number: string }[];
    emergencyBooking: boolean;
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
    recommendedDate?: string;
    recommendedSlot?: string;
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
    emergency?: AiEmergencyInfo;
    /** True while the answer is still streaming in */
    streaming?: boolean;
    /** What the assistant is doing right now ("Finding doctors...") while streaming */
    status?: string;
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
    transcript?: string;
    patientName?: string;
    chiefComplaint?: string;
    vitals?: string;
    diagnosis?: string;
    prescriptions?: MedicationItem[];
    labOrders?: string[];
    followUp?: string;
    soapNote?: SoapNote;
}

export interface AiIntakeDraftResponse {
    chiefComplaint?: string;
    symptoms?: string[];
    duration?: string;
    severity?: string;
    currentMedications?: string;
    allergies?: string;
    redFlags?: string[];
    hasEmergencyFlags: boolean;
    emergencyMessage?: string;
}

