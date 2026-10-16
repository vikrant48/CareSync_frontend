import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from './paginator.component';
import { ModalShellComponent } from './modal-shell.component';
import { SelectDropdownComponent } from '../select-dropdown.component';
import { StickyActionBarComponent } from './sticky-action-bar.component';
import { ButtonComponent } from '../components/button/button.component';

describe('PaginatorComponent', () => {
  function create(page: number, total: number, pageSize = 10) {
    const fixture = TestBed.createComponent(PaginatorComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.detectChanges();
    return fixture;
  }

  it('builds an ellipsis window around the current page', () => {
    const { componentInstance: p } = create(5, 200);
    expect(p.totalPages).toBe(20);
    expect(p.pageItems).toEqual([0, null, 4, 5, 6, null, 19]);
    expect(p.firstItem).toBe(51);
    expect(p.lastItem).toBe(60);
  });

  it('emits valid page changes only', () => {
    const { componentInstance: p } = create(0, 25);
    const emitted: number[] = [];
    p.pageChange.subscribe((n) => emitted.push(n));
    p.go(-1);
    p.go(0);
    p.go(1);
    p.go(3);
    expect(emitted).toEqual([1]);
  });
});

@Component({
  standalone: true,
  imports: [FormsModule, SelectDropdownComponent],
  template: `<app-select-dropdown [(ngModel)]="value" [options]="options" [autoCapitalize]="false"></app-select-dropdown>`,
})
class SelectHostComponent {
  value: string | null = 'b';
  options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma', disabled: true },
    { value: 'd', label: 'Delta' },
  ];
}

describe('SelectDropdownComponent', () => {
  it('supports keyboard selection and skips disabled options', async () => {
    const fixture = TestBed.createComponent(SelectHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Beta');

    const key = (k: string) => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      fixture.detectChanges();
    };

    key('ArrowDown'); // open, highlight current (Beta)
    expect(button.getAttribute('aria-expanded')).toBe('true');
    key('ArrowDown'); // skip disabled Gamma -> Delta
    key('Enter');

    expect(fixture.componentInstance.value).toBe('d');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

@Component({
  standalone: true,
  imports: [ModalShellComponent],
  template: `
    <app-modal-shell [open]="outerOpen" title="Outer" (close)="outerOpen = false">outer</app-modal-shell>
    <app-modal-shell [open]="innerOpen" title="Inner" (close)="innerOpen = false">inner</app-modal-shell>
  `,
})
class StackedModalsHostComponent {
  outerOpen = true;
  innerOpen = false;
}

describe('ModalShellComponent', () => {
  it('Escape closes only the top-most modal', () => {
    const fixture = TestBed.createComponent(StackedModalsHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.innerOpen = true;
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.innerOpen).toBeFalse();
    expect(fixture.componentInstance.outerOpen).toBeTrue();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.outerOpen).toBeFalse();
  });

  it('locks page scroll while open and gives each instance a unique title id', () => {
    const fixture = TestBed.createComponent(StackedModalsHostComponent);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentInstance.innerOpen = true;
    fixture.detectChanges();
    const ids = Array.from(fixture.nativeElement.querySelectorAll('h3[id]')).map((h: any) => h.id);
    expect(new Set(ids).size).toBe(2);

    fixture.componentInstance.outerOpen = false;
    fixture.componentInstance.innerOpen = false;
    fixture.detectChanges();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});

@Component({
  standalone: true,
  imports: [StickyActionBarComponent, PaginatorComponent],
  template: `
    <app-sticky-action-bar [pinned]="true" [compact]="true">
      <app-paginator [page]="0" [pageSize]="12" [total]="1001" [showSummaryAlways]="true" [compact]="true"></app-paginator>
    </app-sticky-action-bar>
  `,
})
class PinnedPagerHostComponent {}

describe('StickyActionBarComponent (pinned + compact)', () => {
  it('is fixed to the viewport and slim', () => {
    const fixture = TestBed.createComponent(PinnedPagerHostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const bar: HTMLElement = fixture.nativeElement.querySelector('app-sticky-action-bar');
    expect(getComputedStyle(bar).position).toBe('fixed');
    const height = bar.getBoundingClientRect().height;
    expect(Math.round(height)).toBe(41); // matches the sidebar footer
    const pageButton: HTMLElement = fixture.nativeElement.querySelector('button[aria-current="page"]');
    expect(Math.round(pageButton.getBoundingClientRect().height)).toBe(28);
    fixture.nativeElement.remove();
  });
});

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <button class="btn-primary">Primary</button>
    <button class="btn-secondary">Secondary</button>
    <button class="btn-danger">Danger</button>
    <button class="btn-sm btn-secondary">Small</button>
    <button class="btn-size-sm">sm</button>
    <button class="btn-size-md">md</button>
    <button class="btn-size-lg">lg</button>
    <app-button size="sm">Sm</app-button>
    <app-button size="md">Md</app-button>
    <app-button size="lg">Lg</app-button>
  `,
})
class ButtonsHostComponent {}

describe('Button size scale (sm 26 / md 32 / lg 38)', () => {
  it('maps every button style to its size', () => {
    const fixture = TestBed.createComponent(ButtonsHostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const expected: Record<string, number> = {
      Primary: 38, Secondary: 38, Danger: 38, Small: 26,
      sm: 26, md: 32, lg: 38, Sm: 26, Md: 32, Lg: 38,
    };
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLElement[];
    expect(buttons.length).toBe(10);
    buttons.forEach((b) => {
      const label = b.textContent!.trim();
      expect(Math.round(b.getBoundingClientRect().height)).withContext(label).toBe(expected[label]);
    });
    fixture.nativeElement.remove();
  });
});
