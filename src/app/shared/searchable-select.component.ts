import {
    Component,
    Input,
    Output,
    EventEmitter,
    HostListener,
    ElementRef,
    ViewChild,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface SearchableOption {
    value: any;
    label: string;
    subText?: string;
    raw?: any;
}

@Component({
    selector: 'app-searchable-select',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './searchable-select.component.html',
    styleUrl: './searchable-select.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchableSelectComponent implements OnInit, OnDestroy {
    private elementRef = inject(ElementRef);
    private cdr = inject(ChangeDetectorRef);

    @Input() label: string = '';
    @Input() placeholder: string = 'Search and select an option';
    @Input() searchPlaceholder: string = 'Type to search...';
    @Input() options: any[] = [];
    @Input() value: any = null;
    @Input() valueKey: string = 'id';
    @Input() labelKey: string | string[] = 'name';
    @Input() subTextKey: string | string[] = 'email';
    @Input() loading: boolean = false;
    @Input() disabled: boolean = false;
    @Input() emptyText: string = 'No options available';
    @Input() noResultsText: string = 'No results found';
    @Input() hint: string = '';

    @Output() selectionChange = new EventEmitter<any>();
    @Output() clearSelection = new EventEmitter<void>();

    @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

    isOpen = false;
    searchQuery: string = '';
    filteredOptions: SearchableOption[] = [];
    focusedIndex: number = -1;

    private searchSubject = new Subject<string>();
    private searchSubscription?: Subscription;

    ngOnInit() {
        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(300)
        ).subscribe(query => {
            this.filterOptions(query);
        });
        this.updateFilteredOptions();
    }

    ngOnChanges() {
        this.updateFilteredOptions();
    }

    ngOnDestroy() {
        this.searchSubscription?.unsubscribe();
    }

    get normalizedOptions(): SearchableOption[] {
        if (!this.options || !Array.isArray(this.options)) return [];

        return this.options.map(item => {
            if (typeof item === 'object' && item !== null) {
                const value = this.getValueFromKey(item, this.valueKey);
                const label = this.getLabelFromItem(item);
                const subText = this.getSubTextFromItem(item);
                return { value, label, subText, raw: item };
            }
            return { value: item, label: String(item), raw: item };
        });
    }

    get selectedOption(): SearchableOption | undefined {
        return this.normalizedOptions.find(opt => opt.value === this.value);
    }

    onSearchChange(query: string) {
        this.searchQuery = query;
        this.searchSubject.next(query);
    }

    private filterOptions(query: string) {
        const q = query.trim().toLowerCase();
        if (!q) {
            this.filteredOptions = [...this.normalizedOptions];
        } else {
            this.filteredOptions = this.normalizedOptions.filter(opt => {
                const matchLabel = opt.label.toLowerCase().includes(q);
                const matchSubText = opt.subText ? opt.subText.toLowerCase().includes(q) : false;
                return matchLabel || matchSubText;
            });
        }
        this.focusedIndex = this.filteredOptions.length > 0 ? 0 : -1;
        this.cdr.markForCheck();
    }

    private updateFilteredOptions() {
        this.filterOptions(this.searchQuery);
    }

    toggleDropdown(event?: Event) {
        if (this.disabled) return;
        if (event) {
            event.stopPropagation();
        }
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.searchQuery = '';
            this.updateFilteredOptions();
            setTimeout(() => {
                this.searchInputRef?.nativeElement.focus();
            }, 50);
        }
        this.cdr.markForCheck();
    }

    closeDropdown() {
        if (this.isOpen) {
            this.isOpen = false;
            this.searchQuery = '';
            this.focusedIndex = -1;
            this.cdr.markForCheck();
        }
    }

    selectOption(option: SearchableOption, event?: Event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.value = option.value;
        this.selectionChange.emit(option.value);
        this.closeDropdown();
    }

    onClear(event: Event) {
        event.stopPropagation();
        event.preventDefault();
        this.value = null;
        this.selectionChange.emit(null);
        this.clearSelection.emit();
        this.cdr.markForCheck();
    }

    onKeyDown(event: KeyboardEvent) {
        if (this.disabled) return;

        switch (event.key) {
            case 'ArrowDown':
                if (!this.isOpen) {
                    this.toggleDropdown();
                } else {
                    event.preventDefault();
                    this.navigateOption(1);
                }
                break;
            case 'ArrowUp':
                if (this.isOpen) {
                    event.preventDefault();
                    this.navigateOption(-1);
                }
                break;
            case 'Enter':
                if (this.isOpen) {
                    event.preventDefault();
                    if (this.focusedIndex >= 0 && this.focusedIndex < this.filteredOptions.length) {
                        this.selectOption(this.filteredOptions[this.focusedIndex]);
                    }
                }
                break;
            case 'Escape':
                if (this.isOpen) {
                    event.preventDefault();
                    this.closeDropdown();
                }
                break;
            case 'Tab':
                this.closeDropdown();
                break;
        }
    }

    private navigateOption(step: number) {
        if (this.filteredOptions.length === 0) return;
        this.focusedIndex = (this.focusedIndex + step + this.filteredOptions.length) % this.filteredOptions.length;
        this.cdr.markForCheck();

        // Scroll focused element into view
        setTimeout(() => {
            const activeEl = this.elementRef.nativeElement.querySelector(`[data-index="${this.focusedIndex}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, 0);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!this.elementRef.nativeElement.contains(target)) {
            this.closeDropdown();
        }
    }

    trackByValue(index: number, item: SearchableOption): any {
        return item.value;
    }

    private getValueFromKey(item: any, key: string): any {
        return item ? item[key] : null;
    }

    private getLabelFromItem(item: any): string {
        if (Array.isArray(this.labelKey)) {
            return this.labelKey.map(k => item[k] || '').filter(Boolean).join(' ');
        }
        if (typeof this.labelKey === 'string') {
            if (this.labelKey.includes(',')) {
                return this.labelKey.split(',').map(k => item[k.trim()] || '').filter(Boolean).join(' ');
            }
            return item[this.labelKey] || '';
        }
        return String(item);
    }

    private getSubTextFromItem(item: any): string {
        if (!this.subTextKey) return '';
        if (Array.isArray(this.subTextKey)) {
            return this.subTextKey.map(k => item[k] || '').filter(Boolean).join(' • ');
        }
        if (typeof this.subTextKey === 'string') {
            if (this.subTextKey.includes(',')) {
                return this.subTextKey.split(',').map(k => item[k.trim()] || '').filter(Boolean).join(' • ');
            }
            return item[this.subTextKey] || '';
        }
        return '';
    }
}
