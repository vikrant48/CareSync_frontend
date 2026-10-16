import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';

/**
 * Regression: a real mouse click is mousedown -> (change detection) -> mouseup -> click.
 * If the option elements are re-created during that change detection, the click is lost.
 */
describe('Register: gender selection with a real click sequence', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('keeps the pressed option in the DOM and selects it', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    const host = Array.from(fixture.nativeElement.querySelectorAll('app-select-dropdown') as NodeListOf<HTMLElement>)
      .find((el) => el.textContent?.includes('Gender'))!;
    const trigger = host.querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const pressed = Array.from(host.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>)
      .find((o) => /female/i.test(o.textContent || ''))!;
    expect(pressed).withContext('option rendered').toBeTruthy();

    pressed.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    fixture.detectChanges(); // what Angular does after the mousedown listener runs
    expect(pressed.isConnected).withContext('option element survives change detection').toBeTrue();

    pressed.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    pressed.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.basicForm.get('gender')?.value).toBe('FEMALE');
    expect(trigger.textContent?.toLowerCase()).toContain('female');
    fixture.nativeElement.remove();
  });
});
