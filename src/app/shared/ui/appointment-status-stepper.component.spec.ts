import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentStatusStepperComponent } from './appointment-status-stepper.component';
import { AppointmentStatus } from '../../core/models/appointment.models';

describe('AppointmentStatusStepperComponent', () => {
    let component: AppointmentStatusStepperComponent;
    let fixture: ComponentFixture<AppointmentStatusStepperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentStatusStepperComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentStatusStepperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should calculate correct step index for BOOKED status', () => {
        component.currentStatus = AppointmentStatus.BOOKED;
        expect(component.currentStepIndex).toBe(1);
        expect(component.isCurrentStep(1)).toBeTrue();
    });

    it('should calculate correct step index for IN_PROGRESS status', () => {
        component.currentStatus = AppointmentStatus.IN_PROGRESS;
        expect(component.currentStepIndex).toBe(3);
        expect(component.isCompletedStep(1)).toBeTrue();
    });
});
