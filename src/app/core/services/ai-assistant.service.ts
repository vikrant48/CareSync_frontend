import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from './auth.service';
import { LabReportExplanation, PatientHealthBrief, AiCopilotPatient, AiConversationDetail, AiConversationSummary, AiChatRequest, AiChatResponse, MedicalSummaryResponse, DiagnosisSuggestionDto, VisionScanResponse, ClinicalDictationResponse, AiIntakeDraftResponse } from '../models/ai.models';

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
    private baseUrl = environment.apiBaseUrl;
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private activeConversationId: string | null = null;

    sendMessage(message: string, customConversationId?: string, patientId?: number) {
        const conversationId = customConversationId || this.activeConversationId || undefined;
        const payload: AiChatRequest = { message, conversationId, patientId };
        return this.http.post<AiChatResponse>(`${this.baseUrl}/api/ai/chat`, payload).pipe(
            tap(res => {
                if (res && res.conversationId) {
                    this.activeConversationId = res.conversationId;
                }
            })
        );
    }

    /**
     * Streams one chat message (POST /api/ai/chat/stream, server-sent events). onDelta gets pieces of the answer
     * as they arrive, onStatus a short note while a tool runs. Resolves with the full response (text, card,
     * emergency notice). Rejects when the stream can't be used (e.g. expired login) so the caller can fall back
     * to sendMessage, which goes through the normal login refresh. Abort the signal to stop.
     */
    async streamChat(
        message: string,
        handlers: { onDelta: (text: string) => void; onStatus: (text: string) => void },
        signal: AbortSignal,
        patientId?: number
    ): Promise<AiChatResponse> {
        const token = this.auth.accessToken();
        const response = await fetch(`${this.baseUrl}/api/ai/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ message, conversationId: this.activeConversationId || undefined, patientId }),
            signal
        });
        if (!response.ok || !response.body) {
            throw new Error(`Stream unavailable (HTTP ${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let result: AiChatResponse | null = null;

        const handleEvent = (block: string) => {
            let event = 'message';
            const data: string[] = [];
            for (const line of block.split('\n')) {
                if (line.startsWith('event:')) event = line.slice(6).trim();
                else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
            }
            if (data.length === 0) return;
            const payload = JSON.parse(data.join('\n'));
            if (event === 'delta') handlers.onDelta(payload.text ?? '');
            else if (event === 'status') handlers.onStatus(payload.text ?? '');
            else if (event === 'done') result = payload as AiChatResponse;
            else if (event === 'error') result = { success: false, error: payload.message || 'The AI assistant is unavailable right now.' };
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
            let split: number;
            while ((split = buffer.indexOf('\n\n')) >= 0) {
                handleEvent(buffer.slice(0, split));
                buffer = buffer.slice(split + 2);
            }
        }
        if (buffer.trim()) handleEvent(buffer);

        const final = result as AiChatResponse | null;
        if (!final) throw new Error('Stream ended without an answer');
        if (final.conversationId) this.activeConversationId = final.conversationId;
        return final;
    }

    /** Conversation the server is remembering for this chat (kept with saved chats) */
    currentConversationId(): string | null {
        return this.activeConversationId;
    }

    /** Continue a saved chat's conversation (null starts a new one) */
    useConversation(conversationId: string | null) {
        this.activeConversationId = conversationId;
    }

    /** Patient dashboard "AI health brief" */
    getHealthBrief() {
        return this.http.get<PatientHealthBrief>(`${this.baseUrl}/api/ai/patient/health-brief`);
    }

    /** Saved explanation of a lab report; null when none was made yet (HTTP 204) */
    getLabReportExplanation(documentId: number) {
        return this.http.get<LabReportExplanation | null>(`${this.baseUrl}/api/ai/lab-reports/${documentId}/explanation`);
    }

    /** Explains a lab report in plain language (saved with the report) */
    explainLabReport(documentId: number) {
        return this.http.post<LabReportExplanation>(`${this.baseUrl}/api/ai/lab-reports/${documentId}/explain`, {});
    }

    /** Find & Book "Describe your problem": suggested specialization and doctors */
    symptomSearch(description: string) {
        return this.http.post<AiChatResponse>(`${this.baseUrl}/api/ai/symptom-search`, { description });
    }

    /** Doctor co-pilot: the doctor's own patients for the @patient picker */
    listCopilotPatients() {
        return this.http.get<AiCopilotPatient[]>(`${this.baseUrl}/api/ai/doctor/patients`);
    }

    // ---- Saved chats (server side, encrypted, available on every device)

    listConversations() {
        return this.http.get<AiConversationSummary[]>(`${this.baseUrl}/api/ai/conversations`);
    }

    getConversation(id: string) {
        return this.http.get<AiConversationDetail>(`${this.baseUrl}/api/ai/conversations/${encodeURIComponent(id)}`);
    }

    renameConversation(id: string, title: string) {
        return this.http.patch<AiConversationSummary>(`${this.baseUrl}/api/ai/conversations/${encodeURIComponent(id)}`, { title });
    }

    deleteConversation(id: string) {
        return this.http.delete<void>(`${this.baseUrl}/api/ai/conversations/${encodeURIComponent(id)}`);
    }

    deleteAllConversations() {
        return this.http.delete<{ deleted: number }>(`${this.baseUrl}/api/ai/conversations`);
    }

    resetConversation() {
        this.activeConversationId = null;
    }

    getMedicalSummary(patientId: number) {
        return this.http.get<MedicalSummaryResponse>(`${this.baseUrl}/api/ai/summarize/${patientId}`);
    }

    suggestDiagnosis(symptoms: string) {
        return this.http.post<DiagnosisSuggestionDto>(`${this.baseUrl}/api/ai/suggest-diagnosis`, { symptoms });
    }

    scanMedicalDocument(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<VisionScanResponse>(`${this.baseUrl}/api/ai/scan-document`, formData);
    }

    dictateClinicalNote(transcript: string) {
        return this.http.post<ClinicalDictationResponse>(`${this.baseUrl}/api/ai/dictate-note`, { transcript });
    }

    draftIntake(narrative: string) {
        return this.http.post<AiIntakeDraftResponse>(`${this.baseUrl}/api/ai/draft-intake`, { narrative });
    }
}
