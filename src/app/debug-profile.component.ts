import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { PatientService } from './services/patient.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-debug-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: monospace;">
      <h2>Debug Profile Information</h2>
      
      <div style="margin: 20px 0; padding: 10px; border: 1px solid #ccc;">
        <h3>Authentication Status</h3>
        <p><strong>Is Authenticated:</strong> {{ authService.isAuthenticated() }}</p>
        <p><strong>Current User:</strong> {{ currentUserJson }}</p>
        <p><strong>Token:</strong> {{ token ? 'Present' : 'Missing' }}</p>
        <p><strong>User Role:</strong> {{ authService.userRole() }}</p>
      </div>
      
      <div style="margin: 20px 0; padding: 10px; border: 1px solid #ccc;">
        <h3>API Test</h3>
        <button (click)="testDirectApiCall()" style="margin: 5px; padding: 10px;">Test Direct API Call</button>
        <button (click)="testPatientService()" style="margin: 5px; padding: 10px;">Test Patient Service</button>
        <button (click)="clearLogs()" style="margin: 5px; padding: 10px;">Clear Logs</button>
      </div>
      
      <div style="margin: 20px 0; padding: 10px; border: 1px solid #ccc; background: #f5f5f5;">
        <h3>Debug Logs</h3>
        <div *ngFor="let log of debugLogs" style="margin: 5px 0; padding: 5px; background: white; border-left: 3px solid #007acc;">
          <small>{{ log.timestamp }}</small><br>
          <strong>{{ log.type }}:</strong> {{ log.message }}
          <pre *ngIf="log.data" style="margin: 5px 0; font-size: 12px;">{{ log.data }}</pre>
        </div>
      </div>
    </div>
  `
})
export class DebugProfileComponent implements OnInit {
  currentUserJson = '';
  token = '';
  debugLogs: Array<{timestamp: string, type: string, message: string, data?: string}> = [];
  
  constructor(
    public authService: AuthService,
    private patientService: PatientService,
    private http: HttpClient
  ) {}
  
  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserJson = JSON.stringify(currentUser, null, 2);
    this.token = this.authService.getToken() || '';
    
    this.addLog('INFO', 'Component initialized', {
      user: currentUser,
      hasToken: !!this.token,
      isAuthenticated: this.authService.isAuthenticated()
    });
  }
  
  testDirectApiCall() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.username) {
      this.addLog('ERROR', 'No current user or username found');
      return;
    }
    
    const url = `${environment.apiUrl}/api/patients/profile/${currentUser.username}`;
    this.addLog('INFO', `Making direct HTTP call to: ${url}`);
    
    this.http.get(url).subscribe({
      next: (response) => {
        this.addLog('SUCCESS', 'Direct API call successful', response);
      },
      error: (error) => {
        this.addLog('ERROR', 'Direct API call failed', error);
      }
    });
  }
  
  testPatientService() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.username) {
      this.addLog('ERROR', 'No current user or username found');
      return;
    }
    
    this.addLog('INFO', `Testing PatientService.getMyProfile with username: ${currentUser.username}`);
    
    this.patientService.getMyProfile(currentUser.username).subscribe({
      next: (response) => {
        this.addLog('SUCCESS', 'PatientService call successful', response);
      },
      error: (error) => {
        this.addLog('ERROR', 'PatientService call failed', error);
      }
    });
  }
  
  clearLogs() {
    this.debugLogs = [];
  }
  
  private addLog(type: string, message: string, data?: any) {
    this.debugLogs.push({
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    });
  }
}