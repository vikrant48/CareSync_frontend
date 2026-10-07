import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntakeSummaryModalComponent } from './intake-summary-modal.component';

describe('IntakeSummaryModalComponent', () => {
    let component: IntakeSummaryModalComponent;
    let fixture: ComponentFixture<IntakeSummaryModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IntakeSummaryModalComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(IntakeSummaryModalComponent);
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
