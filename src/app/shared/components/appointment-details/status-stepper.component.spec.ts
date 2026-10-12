import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusStepperComponent } from './status-stepper.component';

describe('StatusStepperComponent', () => {
    let component: StatusStepperComponent;
    let fixture: ComponentFixture<StatusStepperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StatusStepperComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(StatusStepperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should map IN_PROGRESS to stage index 4', () => {
        component.currentStatus = 'IN_PROGRESS';
        component.ngOnChanges({ currentStatus: {} as any });
        expect(component.stages[4].state).toBe('CURRENT');
        expect(component.stages[0].state).toBe('COMPLETED');
    });

    it('should map READY_TO_COMPLETE to stage index 6 and complete previous stages', () => {
        component.currentStatus = 'READY_TO_COMPLETE';
        component.ngOnChanges({ currentStatus: {} as any });
        expect(component.stages[6].state).toBe('CURRENT');
        expect(component.stages[5].state).toBe('COMPLETED');
        expect(component.stages[0].state).toBe('COMPLETED');
    });
});
