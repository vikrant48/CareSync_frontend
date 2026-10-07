import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreVisitIntakeComponent } from './pre-visit-intake.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('PreVisitIntakeComponent', () => {
    let component: PreVisitIntakeComponent;
    let fixture: ComponentFixture<PreVisitIntakeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PreVisitIntakeComponent, HttpClientTestingModule, RouterTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(PreVisitIntakeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should validate step 1 chief complaint requirement', () => {
        component.activeStep = 1;
        component.intakeData.chiefComplaint = '';
        expect(component.isStepValid()).toBeFalse();

        component.intakeData.chiefComplaint = 'Severe headache for 2 days';
        expect(component.isStepValid()).toBeTrue();
    });
});
