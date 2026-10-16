import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'caresync-frontend' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('caresync-frontend');
  });

  it('should render the app header and router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('header buttons (Git Repos, Login, Register) are all 34px', () => {
    localStorage.removeItem('accessToken');
    const fixture = TestBed.createComponent(AppComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const header: HTMLElement = fixture.nativeElement.querySelector('header');
    const git = header.querySelector('button') as HTMLElement;
    const login = header.querySelector('a[aria-label="Login"]') as HTMLElement;
    const register = header.querySelector('a[aria-label="Register"]') as HTMLElement;
    [git, login, register].forEach((el) => {
      expect(el).toBeTruthy();
      expect(Math.round(el.getBoundingClientRect().height)).toBe(34);
    });
    fixture.nativeElement.remove();
  });
});
