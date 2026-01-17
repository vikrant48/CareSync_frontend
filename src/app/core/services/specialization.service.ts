import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MasterDataService } from './master-data.service';

export interface Specialization {
  id?: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SpecializationService {
  private http = inject(HttpClient);
  private masterDataService = inject(MasterDataService);
  private baseUrl = environment.apiBaseUrl || 'http://localhost:8080';

  // Cache for specializations
  private specializationsSubject = new BehaviorSubject<string[]>([]);
  public specializations$ = this.specializationsSubject.asObservable();

  // Default specializations list (fallback)
  private defaultSpecializations = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'General Medicine',
    'Gynecology',
    'Neurology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Surgery',
    'Urology'
  ];

  constructor() {
    this.loadSpecializations();
  }

  loadSpecializations(): void {
    this.masterDataService.getSpecializations().subscribe({
      next: (specializations) => {
        const allSpecializations = [...new Set([...this.defaultSpecializations, ...specializations])];
        this.specializationsSubject.next(allSpecializations.sort());
      },
      error: () => {
        this.loadFallbackSpecializations();
      }
    });
  }

  private loadFallbackSpecializations(): void {
    this.getExistingSpecializations().subscribe({
      next: (specializations) => {
        const allSpecializations = [...new Set([...this.defaultSpecializations, ...specializations])];
        this.specializationsSubject.next(allSpecializations.sort());
      },
      error: () => {
        this.specializationsSubject.next(this.defaultSpecializations);
      }
    });
  }

  /**
   * Get existing specializations from doctors in the system
   */
  private getExistingSpecializations(): Observable<string[]> {
    return this.http.get<any>(`${this.baseUrl}/api/reports/specialization/analysis`).pipe(
      map(response => {
        if (response && response.specializationCount) {
          return Object.keys(response.specializationCount).filter(spec => spec && spec.trim());
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Get all specializations (cached)
   */
  getAllSpecializations(): Observable<string[]> {
    return this.specializations$;
  }

  /**
   * Filter specializations based on search query
   */
  filterSpecializations(query: string): Observable<string[]> {
    return this.specializations$.pipe(
      map(specializations => {
        if (!query || query.trim() === '') {
          return specializations;
        }
        const searchTerm = query.toLowerCase().trim();
        return specializations.filter(spec =>
          spec.toLowerCase().includes(searchTerm)
        );
      })
    );
  }

  /**
   * Add a new specialization to the list
   */
  addSpecialization(specialization: string): void {
    if (!specialization || !specialization.trim()) {
      return;
    }

    const trimmedSpec = specialization.trim();
    const currentSpecializations = this.specializationsSubject.value;

    // Check if specialization already exists (case-insensitive)
    const exists = currentSpecializations.some(spec =>
      spec.toLowerCase() === trimmedSpec.toLowerCase()
    );

    if (!exists) {
      const updatedSpecializations = [...currentSpecializations, trimmedSpec].sort();
      this.specializationsSubject.next(updatedSpecializations);
    }
  }

  /**
   * Check if a specialization exists
   */
  specializationExists(specialization: string): Observable<boolean> {
    return this.specializations$.pipe(
      map(specializations => {
        if (!specialization || !specialization.trim()) {
          return false;
        }
        return specializations.some(spec =>
          spec.toLowerCase() === specialization.toLowerCase().trim()
        );
      })
    );
  }

  /**
   * Get suggestions for a partial specialization input
   */
  getSuggestions(query: string, limit: number = 10): Observable<string[]> {
    return this.filterSpecializations(query).pipe(
      map(filtered => filtered.slice(0, limit))
    );
  }
}