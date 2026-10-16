import { TestBed } from '@angular/core/testing';
import { FilterBarComponent, FilterConfig } from './filter-bar.component';

/**
 * Layout guard: every control in a filter row must have the same height, so dropdowns, search
 * boxes, date pickers and segmented controls line up (patient and doctor pages share this bar).
 */
describe('FilterBarComponent control heights', () => {
  const filters: FilterConfig[] = [
    { key: 'q', type: 'search', label: 'Search' },
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'status', type: 'select', label: 'Status', options: [{ label: 'All', value: 'ALL' }, { label: 'Open', value: 'OPEN' }] },
    { key: 'range', type: 'radio', label: 'Range', options: [{ label: 'All', value: '' }, { label: 'Today', value: 'today' }] },
    { key: 'from', type: 'date', label: 'From' },
    { key: 'price', type: 'number-range', label: 'Price' },
    { key: 'go', type: 'button', label: 'Go', buttonLabel: 'Apply' },
  ] as FilterConfig[];

  it('renders search, text, select, radio, date, number and button controls at one height', async () => {
    const fixture = TestBed.createComponent(FilterBarComponent);
    fixture.componentRef.setInput('filters', filters);
    fixture.componentRef.setInput('values', { q: '', name: '', status: 'ALL', range: '' });
    fixture.componentInstance.filtersExpanded = true; // show the row at any viewport width
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 50)); // flatpickr builds its visible input asynchronously

    const root: HTMLElement = fixture.nativeElement;
    const heightOf = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().height) : -1);
    const measured: Record<string, number> = {
      search: heightOf(root.querySelector('input[placeholder="Search..."]')),
      text: heightOf(root.querySelector('input[placeholder="Enter text..."]')),
      select: heightOf(root.querySelector('app-select-dropdown button')),
      radio: heightOf(Array.from(root.querySelectorAll('div.filter-control')).find((d) => d.querySelector('button')) ?? null),
      date: heightOf(root.querySelector('app-date-picker input:not([type="hidden"]):not(.flatpickr-input[readonly][style*="display: none"])')),
      number: heightOf(root.querySelector('input[type="number"]')),
      button: heightOf(Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes('Apply')) ?? null),
    };

    Object.entries(measured).forEach(([type, h]) => {
      expect(h).withContext(`${type} control height`).toBe(38);
    });
    fixture.nativeElement.remove();
  });
});

describe('FilterBarComponent clear button', () => {
  it('"Clear filters" is 24px tall', async () => {
    const fixture = TestBed.createComponent(FilterBarComponent);
    fixture.componentRef.setInput('filters', [{ key: 'q', type: 'search', label: 'Search' }] as FilterConfig[]);
    fixture.componentRef.setInput('values', { q: 'abc' });
    fixture.componentInstance.filtersExpanded = true;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const clear = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLElement>)
      .find((b) => b.textContent?.includes('Clear filters'));
    expect(clear).withContext('clear button rendered').toBeTruthy();
    expect(Math.round(clear!.getBoundingClientRect().height)).toBe(24);
    fixture.nativeElement.remove();
  });
});
