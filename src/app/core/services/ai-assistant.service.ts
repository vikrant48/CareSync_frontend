import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AiChatRequest, AiChatResponse, MedicalSummaryResponse, DiagnosisSuggestionDto } from '../models/ai.models';

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
    private baseUrl = environment.apiBaseUrl;
    private http = inject(HttpClient);
    private activeConversationId: string | null = null;

    sendMessage(message: string, customConversationId?: string) {
        const conversationId = customConversationId || this.activeConversationId || undefined;
        const payload: AiChatRequest = { message, conversationId };
        return this.http.post<AiChatResponse>(`${this.baseUrl}/api/ai/chat`, payload).pipe(
            tap(res => {
                if (res && res.conversationId) {
                    this.activeConversationId = res.conversationId;
                }
            })
        );
    }

    sendMessageStream(
        message: string,
        onChunk: (chunk: string) => void,
        onComplete?: () => void,
        onError?: (err: any) => void
    ) {
        const conversationId = this.activeConversationId || undefined;
        const token = localStorage.getItem('token') || localStorage.getItem('jwt');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        fetch(`${this.baseUrl}/api/ai/chat/stream`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message, conversationId })
        }).then(async response => {
            if (!response.ok) {
                throw new Error(`HTTP status ${response.status}`);
            }
            const reader = response.body?.getReader();
            if (!reader) return;
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const chunk = line.slice(5);
                        onChunk(chunk);
                    }
                }
            }
            if (buffer.startsWith('data:')) {
                onChunk(buffer.slice(5));
            }
            if (onComplete) onComplete();
        }).catch(err => {
            if (onError) onError(err);
        });
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
}
