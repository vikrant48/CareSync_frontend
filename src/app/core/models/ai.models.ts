export interface AiChatRequest {
    message: string;
}

export interface AiChatResponse {
    response?: string;
    success: boolean;
    error?: string;
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
    suggestions: ClinicalMatch[];
}
