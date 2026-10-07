import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentAnalyticsDashboardComponent } from './appointment-analytics-dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AppointmentAnalyticsDashboardComponent', () => {
    let component: AppointmentAnalyticsDashboardComponent;
    let fixture: ComponentFixture<AppointmentAnalyticsDashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentAnalyticsDashboardComponent, HttpClientTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentAnalyticsDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
