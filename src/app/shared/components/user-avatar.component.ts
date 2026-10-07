import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-user-avatar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-avatar.component.html',
    styleUrl: './user-avatar.component.css'
})
export class UserAvatarComponent {
    @Input() imageUrl?: string;
    @Input() name: string = '';
    @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

    imageFailed: boolean = false;

    get initials(): string {
        if (!this.name) return 'U';
        const parts = this.name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return this.name.slice(0, 2).toUpperCase();
    }

    get sizeClass(): string {
        switch (this.size) {
            case 'sm': return 'w-8 h-8 text-xs';
            case 'md': return 'w-12 h-12 text-sm';
            case 'lg': return 'w-16 h-16 text-xl';
            case 'xl': return 'w-20 h-20 text-2xl';
            default: return 'w-12 h-12 text-sm';
        }
    }

    onImageError(): void {
        this.imageFailed = true;
    }
}
