import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Doctor } from './doctor.service';

/**
 * The logged-in patient's saved doctors (the heart on doctor cards and profiles).
 * One copy for the whole app, so a heart toggled on one page shows on the others.
 */
@Injectable({ providedIn: 'root' })
export class SavedDoctorsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/api/patients/me/saved-doctors`;

  private readonly doctorsSignal = signal<Doctor[]>([]);
  private readonly loadedSignal = signal(false);
  private loading$: Observable<Doctor[]> | null = null;

  /** Saved doctors, newest first */
  readonly doctors = this.doctorsSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();
  readonly savedIds = computed(() => new Set(this.doctorsSignal().map((d) => d.id)));

  isSaved(doctorId: number | null | undefined): boolean {
    return doctorId != null && this.savedIds().has(doctorId);
  }

  /** Loads the list once; pass force to reload */
  load(force = false): Observable<Doctor[]> {
    if (this.loadedSignal() && !force) return of(this.doctorsSignal());
    if (!this.loading$ || force) {
      this.loading$ = this.http.get<Doctor[]>(this.baseUrl).pipe(
        tap((list) => {
          this.doctorsSignal.set(list || []);
          this.loadedSignal.set(true);
        }),
        finalize(() => (this.loading$ = null)),
        shareReplay(1)
      );
    }
    return this.loading$;
  }

  save(doctor: Doctor): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${doctor.id}`, null).pipe(
      tap(() => {
        if (!this.isSaved(doctor.id)) this.doctorsSignal.update((list) => [doctor, ...list]);
      })
    );
  }

  remove(doctorId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${doctorId}`).pipe(
      tap(() => this.doctorsSignal.update((list) => list.filter((d) => d.id !== doctorId)))
    );
  }

  /** Forget the list (e.g. on logout), so another patient on this browser never sees it */
  clear() {
    this.doctorsSignal.set([]);
    this.loadedSignal.set(false);
  }
}
