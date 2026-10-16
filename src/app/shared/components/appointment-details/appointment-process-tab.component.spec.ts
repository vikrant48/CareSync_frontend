import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentProcessTabComponent } from './appointment-process-tab.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('AppointmentProcessTabComponent', () => {
    let component: AppointmentProcessTabComponent;
    let fixture: ComponentFixture<AppointmentProcessTabComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentProcessTabComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentProcessTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
