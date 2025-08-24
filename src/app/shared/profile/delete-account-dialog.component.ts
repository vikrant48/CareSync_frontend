import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold text-red-600 mb-4 flex items-center">
        <mat-icon class="mr-2">warning</mat-icon>
        Delete Account
      </h2>
      
      <p class="mb-6 text-gray-700">
        This action <span class="font-bold">cannot be undone</span>. All your data, including appointments, medical records, and personal information will be permanently deleted.
      </p>
      
      <form [formGroup]="confirmForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="w-full mb-4">
          <mat-label>Enter your password to confirm</mat-label>
          <input 
            matInput 
            type="password" 
            formControlName="password"
            placeholder="Your current password"
            autocomplete="current-password"
          >
          <mat-error *ngIf="confirmForm.get('password')?.hasError('required')">
            Password is required to confirm deletion
          </mat-error>
        </mat-form-field>
        
        <div class="flex justify-between mt-6">
          <button 
            mat-stroked-button 
            type="button"
            (click)="onCancel()"
          >
            Cancel
          </button>
          
          <button 
            mat-raised-button 
            color="warn" 
            type="submit"
            [disabled]="confirmForm.invalid || isLoading"
          >
            <mat-spinner 
              *ngIf="isLoading" 
              diameter="20" 
              class="mr-2"
            ></mat-spinner>
            {{ isLoading ? 'Deleting...' : 'Delete My Account' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DeleteAccountDialogComponent {
  confirmForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DeleteAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.confirmForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.confirmForm.invalid) {
      return;
    }

    this.isLoading = true;
    const password = this.confirmForm.value.password;
    this.dialogRef.close({ confirmed: true, password });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}