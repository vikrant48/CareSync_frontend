import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VitalLog {
    id?: number;
    patientId: number;
    systolicBP?: number;
    diastolicBP?: number;
    sugarLevel?: number;
    weight?: number;
    temperature?: number;
    heartRate?: number;
    respiratoryRate?: number;
    recordedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class VitalsService {
    private apiUrl = `${environment.apiBaseUrl}/api/vitals`;

    constructor(private http: HttpClient) { }

    logVital(vital: VitalLog): Observable<VitalLog> {
        return this.http.post<VitalLog>(this.apiUrl, vital);
    }

    getPatientVitals(patientId: number): Observable<VitalLog[]> {
        return this.http.get<VitalLog[]>(`${this.apiUrl}/patient/${patientId}`);
    }
}
