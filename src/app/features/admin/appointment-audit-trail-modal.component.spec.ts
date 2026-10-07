import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentAuditTrailModalComponent } from './appointment-audit-trail-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AppointmentAuditTrailModalComponent', () => {
    let component: AppointmentAuditTrailModalComponent;
    let fixture: ComponentFixture<AppointmentAuditTrailModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentAuditTrailModalComponent, HttpClientTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentAuditTrailModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit close event when closeModal is called', () => {
        spyOn(component.close, 'emit');
        component.closeModal();
        expect(component.close.emit).toHaveBeenCalled();
    });
});
