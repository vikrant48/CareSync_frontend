import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AiChatRequest, AiChatResponse, MedicalSummaryResponse } from '../models/ai.models';

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
    private baseUrl = environment.apiBaseUrl;
    private http = inject(HttpClient);

    sendMessage(message: string) {
        const payload: AiChatRequest = { message };
        return this.http.post<AiChatResponse>(`${this.baseUrl}/api/ai/chat`, payload);
    }

    getMedicalSummary(patientId: number) {
        return this.http.get<MedicalSummaryResponse>(`${this.baseUrl}/api/ai/summarize/${patientId}`);
    }
}
