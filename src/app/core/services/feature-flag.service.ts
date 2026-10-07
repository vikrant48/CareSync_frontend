import { Injectable, signal } from '@angular/core';

export interface FeatureFlags {
    aiScribeEnabled: boolean;
    aiTriageEnabled: boolean;
    redisSlotLockEnabled: boolean;
    autoReminderEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
    readonly flags = signal<FeatureFlags>({
        aiScribeEnabled: true,
        aiTriageEnabled: true,
        redisSlotLockEnabled: true,
        autoReminderEnabled: true
    });

    isAiScribeEnabled(): boolean {
        return this.flags().aiScribeEnabled;
    }

    isAiTriageEnabled(): boolean {
        return this.flags().aiTriageEnabled;
    }

    isRedisSlotLockEnabled(): boolean {
        return this.flags().redisSlotLockEnabled;
    }

    isAutoReminderEnabled(): boolean {
        return this.flags().autoReminderEnabled;
    }

    toggleFlag(flagKey: keyof FeatureFlags): void {
        const current = this.flags();
        this.flags.set({
            ...current,
            [flagKey]: !current[flagKey]
        });
    }
}
