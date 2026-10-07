import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentOverviewTabComponent } from './appointment-overview-tab.component';

describe('AppointmentOverviewTabComponent', () => {
    let component: AppointmentOverviewTabComponent;
    let fixture: ComponentFixture<AppointmentOverviewTabComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentOverviewTabComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentOverviewTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
