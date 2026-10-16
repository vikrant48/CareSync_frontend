import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentCardComponent } from './appointment-card.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('AppointmentCardComponent', () => {
    let component: AppointmentCardComponent;
    let fixture: ComponentFixture<AppointmentCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentCardComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentCardComponent);
        component = fixture.componentInstance;
        component.appointment = { id: 1, doctorName: 'Dr. Test', patientName: 'Test Patient', status: 'BOOKED' };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('renders every action button at 38px', () => {
        fixture.componentRef.setInput('viewerRole', 'PATIENT');
        component.appointment = { id: 1, appointmentId: 1, doctorName: 'Dr. Test', status: 'BOOKED', doctorActive: true };
        document.body.appendChild(fixture.nativeElement);
        fixture.detectChanges();
        const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLElement[];
        expect(buttons.length).toBeGreaterThan(1);
        buttons.forEach((b) => expect(Math.round(b.getBoundingClientRect().height)).withContext(b.textContent?.trim() || 'icon button').toBe(38));
        fixture.nativeElement.remove();
    });
});
