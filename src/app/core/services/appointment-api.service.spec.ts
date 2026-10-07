import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentApiService } from './appointment-api.service';
import { environment } from '../../../../environments/environment';

describe('AppointmentApiService', () => {
    let service: AppointmentApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AppointmentApiService]
        });

        service = TestBed.inject(AppointmentApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send POST request for slot holding', () => {
        const mockRequest = { doctorId: 1, appointmentDateTime: '2026-10-04T10:00:00' };
        const mockResponse = { holdId: 'HOLD_123', lockedUntil: '2026-10-04T10:05:00', remainingSeconds: 300 };

        service.holdSlot(mockRequest).subscribe((res) => {
            expect(res.holdId).toBe('HOLD_123');
            expect(res.remainingSeconds).toBe(300);
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/appointments/patient/hold-slot`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockRequest);
        req.flush(mockResponse);
    });

    it('should fetch SOAP draft for appointment', () => {
        const mockDraft = { appointmentId: 101, patientId: 5, doctorId: 1, subjective: 'Fever' };

        service.getSoapDraft(101).subscribe((res) => {
            expect(res.subjective).toBe('Fever');
        });

        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/appointments/101/soap-draft`);
        expect(req.request.method).toBe('GET');
        req.flush(mockDraft);
    });
});
