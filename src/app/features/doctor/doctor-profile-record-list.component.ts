import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-doctor-profile-record-list',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './doctor-profile-record-list.component.html',
})
export class DoctorProfileRecordListComponent {
  @Input() kind: 'education' | 'experience' | 'certificates' = 'education';
  @Input() items: any[] = [];
  @Output() edit = new EventEmitter<any>();
  @Output() remove = new EventEmitter<any>();

  trackItem(index: number, item: any): string | number {
    return item?.id ?? item?.degree ?? item?.position ?? item?.url ?? item?.name ?? index;
  }
}
