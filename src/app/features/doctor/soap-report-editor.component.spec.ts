import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SoapReportEditorComponent } from './soap-report-editor.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SoapReportEditorComponent', () => {
    let component: SoapReportEditorComponent;
    let fixture: ComponentFixture<SoapReportEditorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SoapReportEditorComponent, HttpClientTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(SoapReportEditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should validate SOAP required fields before signing', () => {
        component.soapReport = {
            appointmentId: 101,
            patientId: 1,
            doctorId: 2,
            subjective: '',
            objective: '',
            assessment: '',
            plan: '',
            isDraft: true,
            isSigned: false
        };
        spyOn(component['toast'], 'show');
        component.signAndComplete();
        expect(component['toast'].show).toHaveBeenCalled();
    });
});
