import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule
  ],
  template: `
    <div class="password-strength-meter">
      <mat-progress-bar
        [value]="strength"
        [color]="color">
      </mat-progress-bar>
      
      <div class="strength-text" [ngClass]="color">
        <span *ngIf="password">
          {{ strengthText }}
        </span>
        <span *ngIf="!password">
          &nbsp;
        </span>
      </div>
      
      <div class="strength-criteria" *ngIf="password">
        <div class="criterion" [class.met]="hasMinLength">
          <span class="criterion-icon">{{ hasMinLength ? '✓' : '✗' }}</span>
          <span>At least 8 characters</span>
        </div>
        <div class="criterion" [class.met]="hasLowerCase">
          <span class="criterion-icon">{{ hasLowerCase ? '✓' : '✗' }}</span>
          <span>At least 1 lowercase letter</span>
        </div>
        <div class="criterion" [class.met]="hasUpperCase">
          <span class="criterion-icon">{{ hasUpperCase ? '✓' : '✗' }}</span>
          <span>At least 1 uppercase letter</span>
        </div>
        <div class="criterion" [class.met]="hasNumber">
          <span class="criterion-icon">{{ hasNumber ? '✓' : '✗' }}</span>
          <span>At least 1 number</span>
        </div>
        <div class="criterion" [class.met]="hasSpecialChar">
          <span class="criterion-icon">{{ hasSpecialChar ? '✓' : '✗' }}</span>
          <span>At least 1 special character</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .password-strength-meter {
      margin-top: 8px;
      margin-bottom: 16px;
    }
    
    .strength-text {
      margin-top: 4px;
      font-size: 12px;
      text-align: right;
    }
    
    .strength-text.primary {
      color: #3f51b5;
    }
    
    .strength-text.accent {
      color: #ff4081;
    }
    
    .strength-text.warn {
      color: #f44336;
    }
    
    .strength-criteria {
      margin-top: 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .criterion {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .criterion-icon {
      margin-right: 8px;
      font-weight: bold;
    }
    
    .criterion.met {
      color: #4caf50;
    }
  `]
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() password: string = '';
  
  strength: number = 0;
  color: 'primary' | 'accent' | 'warn' = 'warn';
  strengthText: string = 'Very Weak';
  
  // Password criteria
  hasMinLength: boolean = false;
  hasLowerCase: boolean = false;
  hasUpperCase: boolean = false;
  hasNumber: boolean = false;
  hasSpecialChar: boolean = false;
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.checkPasswordStrength();
    }
  }
  
  /**
   * Check the strength of the password
   */
  private checkPasswordStrength(): void {
    const password = this.password || '';
    
    // Reset criteria
    this.hasMinLength = password.length >= 8;
    this.hasLowerCase = /[a-z]/.test(password);
    this.hasUpperCase = /[A-Z]/.test(password);
    this.hasNumber = /[0-9]/.test(password);
    this.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Calculate strength score (0-100)
    let score = 0;
    
    if (this.hasMinLength) score += 20;
    if (this.hasLowerCase) score += 20;
    if (this.hasUpperCase) score += 20;
    if (this.hasNumber) score += 20;
    if (this.hasSpecialChar) score += 20;
    
    // Set strength properties
    this.strength = score;
    
    if (score < 40) {
      this.color = 'warn';
      this.strengthText = 'Very Weak';
    } else if (score < 60) {
      this.color = 'warn';
      this.strengthText = 'Weak';
    } else if (score < 80) {
      this.color = 'accent';
      this.strengthText = 'Medium';
    } else {
      this.color = 'primary';
      this.strengthText = 'Strong';
    }
  }
}