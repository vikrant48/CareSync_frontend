import { AuthService } from './auth.service';

/** After login or sign-up the app only returns to its own pages: a crafted link can't send users elsewhere. */
describe('AuthService.isSafeReturnUrl', () => {
  it('accepts pages inside the app, such as a shared doctor link', () => {
    expect(AuthService.isSafeReturnUrl('/patient/doctor/dr.asha')).toBeTrue();
    expect(AuthService.isSafeReturnUrl('/patient/doctor/dr.asha?book=1')).toBeTrue();
    expect(AuthService.isSafeReturnUrl('/settings')).toBeTrue();
  });

  it('rejects other sites and odd forms of them', () => {
    expect(AuthService.isSafeReturnUrl('https://evil.example')).toBeFalse();
    expect(AuthService.isSafeReturnUrl('//evil.example')).toBeFalse();
    expect(AuthService.isSafeReturnUrl('/\\evil.example')).toBeFalse();
    expect(AuthService.isSafeReturnUrl('javascript:alert(1)')).toBeFalse();
  });

  it('rejects login pages (they would loop) and empty values', () => {
    expect(AuthService.isSafeReturnUrl('/login')).toBeFalse();
    expect(AuthService.isSafeReturnUrl('/register?x=1')).toBeFalse();
    expect(AuthService.isSafeReturnUrl('/auth/session-expired')).toBeFalse();
    expect(AuthService.isSafeReturnUrl('')).toBeFalse();
    expect(AuthService.isSafeReturnUrl(null)).toBeFalse();
  });
});
