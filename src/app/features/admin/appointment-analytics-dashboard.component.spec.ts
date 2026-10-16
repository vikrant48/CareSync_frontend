import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentAnalyticsDashboardComponent } from './appointment-analytics-dashboard.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('AppointmentAnalyticsDashboardComponent', () => {
    let component: AppointmentAnalyticsDashboardComponent;
    let fixture: ComponentFixture<AppointmentAnalyticsDashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentAnalyticsDashboardComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentAnalyticsDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
