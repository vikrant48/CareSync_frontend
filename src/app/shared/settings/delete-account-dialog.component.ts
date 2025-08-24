import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <div class="delete-account-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="warning-icon">warning</mat-icon>
        Delete Account
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <div class="warning-message">
          <p><strong>This action cannot be undone!</strong></p>
          <p>Deleting your account will permanently remove:</p>
          <ul>
            <li>Your profile information</li>
            <li>All appointment history</li>
            <li>Medical records and documents</li>
            <li>Account preferences and settings</li>
          </ul>
        </div>
        
        <form [formGroup]="deleteForm" class="delete-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Enter your password to confirm</mat-label>
            <input 
              matInput 
              type="password" 
              formControlName="password"
              placeholder="Password"
              required>
            <mat-icon matSuffix>lock</mat-icon>
            <mat-error *ngIf="deleteForm.get('password')?.hasError('required')">
              Password is required to delete your account
            </mat-error>
            <mat-error *ngIf="deleteForm.get('password')?.hasError('minlength')">
              Password must be at least 6 characters
            </mat-error>
          </mat-form-field>
          
          <div class="confirmation-checkbox">
            <mat-checkbox formControlName="confirmation" class="confirmation-check">
              I understand that this action is permanent and cannot be undone
            </mat-checkbox>
            <mat-error *ngIf="deleteForm.get('confirmation')?.hasError('required') && deleteForm.get('confirmation')?.touched">
              You must confirm to proceed
            </mat-error>
          </div>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button 
          mat-button 
          (click)="onCancel()"
          class="cancel-button">
          Cancel
        </button>
        <button 
          mat-raised-button 
          color="warn"
          (click)="onConfirm()"
          [disabled]="!deleteForm.valid"
          class="delete-button">
          <mat-icon>delete_forever</mat-icon>
          Delete Account
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .delete-account-dialog {
      min-width: 400px;
      max-width: 500px;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #d32f2f;
      margin-bottom: 0;
    }
    
    .warning-icon {
      color: #ff9800;
    }
    
    .dialog-content {
      padding: 20px 0;
    }
    
    .warning-message {
      background-color: #fff3e0;
      border: 1px solid #ffcc02;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    
    .warning-message p {
      margin: 0 0 8px 0;
    }
    
    .warning-message ul {
      margin: 8px 0 0 20px;
      padding: 0;
    }
    
    .warning-message li {
      margin-bottom: 4px;
    }
    
    .delete-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .confirmation-checkbox {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .confirmation-check {
      font-size: 14px;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0 0 0;
    }
    
    .cancel-button {
      color: #666;
    }
    
    .delete-button {
      background-color: #d32f2f;
    }
    
    .delete-button:disabled {
      background-color: #ccc;
      color: #999;
    }
    
    mat-error {
      font-size: 12px;
      margin-top: 4px;
    }
  `]
})
export class DeleteAccountDialogComponent {
  deleteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DeleteAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.deleteForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: [false, Validators.requiredTrue]
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    if (this.deleteForm.valid) {
      const password = this.deleteForm.get('password')?.value;
      this.dialogRef.close({ confirmed: true, password });
    }
  }
}