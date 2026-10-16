import { TestBed } from '@angular/core/testing';
import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService', () => {
    let service: FeatureFlagService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [FeatureFlagService]
        });
        service = TestBed.inject(FeatureFlagService);
    });

    it('should be created with default flags enabled', () => {
        expect(service).toBeTruthy();
        expect(service.isAiScribeEnabled()).toBeTrue();
        expect(service.isAiTriageEnabled()).toBeTrue();
        expect(service.isRedisSlotLockEnabled()).toBeTrue();
    });

    it('should toggle flag state', () => {
        service.toggleFlag('aiScribeEnabled');
        expect(service.isAiScribeEnabled()).toBeFalse();
        service.toggleFlag('aiScribeEnabled');
        expect(service.isAiScribeEnabled()).toBeTrue();
    });
});
