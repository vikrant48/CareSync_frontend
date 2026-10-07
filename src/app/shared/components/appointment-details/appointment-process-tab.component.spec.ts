import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentProcessTabComponent } from './appointment-process-tab.component';

describe('AppointmentProcessTabComponent', () => {
    let component: AppointmentProcessTabComponent;
    let fixture: ComponentFixture<AppointmentProcessTabComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentProcessTabComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentProcessTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
