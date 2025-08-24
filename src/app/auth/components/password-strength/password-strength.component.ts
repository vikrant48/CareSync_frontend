import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatIconModule],
  template: `
    <div class="password-strength-meter mt-2 mb-4">
      <mat-progress-bar
        [value]="strength"
        [ngClass]="{
          'bg-red-200': strength <= 25,
          'bg-orange-200': strength > 25 && strength <= 50,
          'bg-yellow-200': strength > 50 && strength <= 75,
          'bg-green-200': strength > 75
        }"
      ></mat-progress-bar>
      
      <div class="flex justify-between items-center mt-2">
        <span class="text-sm" 
          [ngClass]="{
            'text-red-500': strength <= 25,
            'text-orange-500': strength > 25 && strength <= 50,
            'text-yellow-600': strength > 50 && strength <= 75,
            'text-green-600': strength > 75
          }">
          {{ strengthText }}
        </span>
        
        <div class="flex gap-1">
          <div *ngFor="let criteria of criteriaList" 
               class="flex items-center text-xs">
            <mat-icon 
              [ngClass]="{
                'text-green-500': criteria.valid,
                'text-gray-400': !criteria.valid
              }"
              class="text-sm h-4 w-4"
            >
              {{ criteria.valid ? 'check_circle' : 'radio_button_unchecked' }}
            </mat-icon>
            <span class="ml-1" 
                  [ngClass]="{
                    'text-gray-600': criteria.valid,
                    'text-gray-400': !criteria.valid
                  }">
              {{ criteria.text }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .password-strength-meter {
      width: 100%;
    }
    
    mat-progress-bar {
      height: 8px;
      border-radius: 4px;
    }
  `]
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() password: string = '';
  
  strength: number = 0;
  strengthText: string = 'No Password';
  criteriaList: { text: string; valid: boolean }[] = [
    { text: '8+ chars', valid: false },
    { text: 'Lowercase', valid: false },
    { text: 'Uppercase', valid: false },
    { text: 'Number', valid: false },
    { text: 'Special', valid: false }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.calculateStrength();
    }
  }

  private calculateStrength(): void {
    if (!this.password) {
      this.strength = 0;
      this.strengthText = 'No Password';
      this.resetCriteria();
      return;
    }

    // Check criteria
    const hasMinLength = this.password.length >= 8;
    const hasLowerCase = /[a-z]/.test(this.password);
    const hasUpperCase = /[A-Z]/.test(this.password);
    const hasNumber = /[0-9]/.test(this.password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(this.password);

    // Update criteria list
    this.criteriaList[0].valid = hasMinLength;
    this.criteriaList[1].valid = hasLowerCase;
    this.criteriaList[2].valid = hasUpperCase;
    this.criteriaList[3].valid = hasNumber;
    this.criteriaList[4].valid = hasSpecialChar;

    // Calculate strength percentage
    let strengthValue = 0;
    if (hasMinLength) strengthValue += 20;
    if (hasLowerCase) strengthValue += 20;
    if (hasUpperCase) strengthValue += 20;
    if (hasNumber) strengthValue += 20;
    if (hasSpecialChar) strengthValue += 20;

    this.strength = strengthValue;

    // Set strength text
    if (strengthValue <= 20) {
      this.strengthText = 'Very Weak';
    } else if (strengthValue <= 40) {
      this.strengthText = 'Weak';
    } else if (strengthValue <= 60) {
      this.strengthText = 'Medium';
    } else if (strengthValue <= 80) {
      this.strengthText = 'Strong';
    } else {
      this.strengthText = 'Very Strong';
    }
  }

  private resetCriteria(): void {
    this.criteriaList.forEach(criteria => criteria.valid = false);
  }
}