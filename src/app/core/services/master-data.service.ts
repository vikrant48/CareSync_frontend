import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MasterData {
    genders: string[];
    specializations: string[];
    statuses: string[];
    bloodGroups: string[];
    languages: string[];
    degrees: string[];
    institutions: string[];
    hospitals: string[];
    positions: string[];
}

@Injectable({
    providedIn: 'root'
})
export class MasterDataService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiBaseUrl || 'http://localhost:8080';
    private orgId = 91;

    private masterData$?: Observable<MasterData>;

    getAllMasterData(): Observable<MasterData> {
        if (!this.masterData$) {
            const params = new HttpParams().set('orgId', this.orgId.toString());
            this.masterData$ = this.http.get<MasterData>(`${this.baseUrl}/api/master/all`, { params }).pipe(
                shareReplay(1)
            );
        }
        return this.masterData$;
    }

    getGenders(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/genders`, { params });
    }

    getSpecializations(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/specializations`, { params });
    }

    getStatuses(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/statuses`, { params });
    }

    getBloodGroups(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/blood-groups`, { params });
    }

    getLanguages(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/languages`, { params });
    }

    getDegrees(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/degrees`, { params });
    }

    getInstitutions(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/institutions`, { params });
    }

    getHospitals(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/hospitals`, { params });
    }

    getPositions(): Observable<string[]> {
        const params = new HttpParams().set('orgId', this.orgId.toString());
        return this.http.get<string[]>(`${this.baseUrl}/api/master/positions`, { params });
    }
}
