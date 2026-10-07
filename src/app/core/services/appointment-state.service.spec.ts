import { TestBed } from '@angular/core/testing';
import { AppointmentStateService } from './appointment-state.service';
import { AuthService } from './auth.service';
import { AppointmentStatus } from '../models/appointment.models';

describe('AppointmentStateService', () => {
    let service: AppointmentStateService;
    let mockAuthService: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        mockAuthService = jasmine.createSpyObj('AuthService', ['role']);

        TestBed.configureTestingModule({
            providers: [
                AppointmentStateService,
                { provide: AuthService, useValue: mockAuthService }
            ]
        });

        service = TestBed.inject(AppointmentStateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set active appointment and derive status signal', () => {
        service.setActiveAppointment({ appointmentId: 101, status: AppointmentStatus.BOOKED });
        expect(service.activeAppointment()).toEqual({ appointmentId: 101, status: AppointmentStatus.BOOKED });
        expect(service.activeStatus()).toBe(AppointmentStatus.BOOKED);
    });

    it('should update status locally', () => {
        service.setActiveAppointment({ appointmentId: 101, status: AppointmentStatus.BOOKED });
        service.updateStatusLocally(AppointmentStatus.CONFIRMED, 'DOCTOR');
        expect(service.activeStatus()).toBe(AppointmentStatus.CONFIRMED);
        expect(service.activeAppointment().statusChangedBy).toBe('DOCTOR');
    });

    it('should check allowed status transitions correctly', () => {
        service.setActiveAppointment({ appointmentId: 101, status: AppointmentStatus.BOOKED });
        expect(service.canTransitionTo(AppointmentStatus.CONFIRMED)).toBeTrue();
        expect(service.canTransitionTo(AppointmentStatus.COMPLETED)).toBeFalse();
    });

    describe('canDo action guards', () => {
        it('should allow patient to submit intake for BOOKED appointment', () => {
            mockAuthService.role.and.returnValue('PATIENT');
            service.setActiveAppointment({ appointmentId: 101, status: AppointmentStatus.BOOKED });
            expect(service.canDo('SUBMIT_INTAKE')).toBeTrue();
        });

        it('should allow doctor to confirm BOOKED appointment', () => {
            mockAuthService.role.and.returnValue('DOCTOR');
            service.setActiveAppointment({ appointmentId: 101, status: AppointmentStatus.BOOKED });
            expect(service.canDo('CONFIRM')).toBeTrue();
        });

        it('should allow doctor to sign report for REPORT_DRAFTED status', () => {
            mockAuthService.role.and.returnValue('DOCTOR');
            service.setActiveAppointment({ appointmentId: 101, status: AppointmentStatus.REPORT_DRAFTED });
            expect(service.canDo('SIGN_REPORT')).toBeTrue();
        });

        it('should deny patient from signing report', () => {
            mockAuthService.role.and.returnValue('PATIENT');
            service.setActiveAppointment({ appointmentId: 101, status: AppointmentStatus.REPORT_DRAFTED });
            expect(service.canDo('SIGN_REPORT')).toBeFalse();
        });
    });
});
