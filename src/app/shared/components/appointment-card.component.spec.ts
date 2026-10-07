import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentCardComponent } from './appointment-card.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('AppointmentCardComponent', () => {
    let component: AppointmentCardComponent;
    let fixture: ComponentFixture<AppointmentCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentCardComponent, RouterTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentCardComponent);
        component = fixture.componentInstance;
        component.appointment = { id: 1, doctorName: 'Dr. Test', patientName: 'Test Patient', status: 'BOOKED' };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
