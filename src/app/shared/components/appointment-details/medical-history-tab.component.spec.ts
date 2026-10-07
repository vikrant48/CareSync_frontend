import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicalHistoryTabComponent } from './medical-history-tab.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MedicalHistoryTabComponent', () => {
    let component: MedicalHistoryTabComponent;
    let fixture: ComponentFixture<MedicalHistoryTabComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MedicalHistoryTabComponent, HttpClientTestingModule]
        }).compileComponents();

        fixture = TestBed.createComponent(MedicalHistoryTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
