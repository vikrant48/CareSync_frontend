import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentDetailsPageComponent } from './appointment-details-page.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('AppointmentDetailsPageComponent', () => {
    let component: AppointmentDetailsPageComponent;
    let fixture: ComponentFixture<AppointmentDetailsPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppointmentDetailsPageComponent, HttpClientTestingModule, RouterTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(AppointmentDetailsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
