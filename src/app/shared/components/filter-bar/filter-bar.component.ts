import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
    SelectComponent,
    SelectOption,
    DateRangePickerComponent,
    DateRange
} from '../index';
import { DatePickerComponent } from '../../date-picker.component';
import { SearchableSelectComponent } from '../../searchable-select.component';

export type FilterType =
    | 'text'
    | 'search'
    | 'select'
    | 'searchable-select'
    | 'radio'
    | 'date'
    | 'date-range'
    | 'number-range'
    | 'button'
    | 'custom';

export interface FilterOption {
    label: string;
    value: any;
    icon?: string;
    disabled?: boolean;
}

export interface FilterConfig {
    key: string;
    type: FilterType;
    label?: string;
    placeholder?: string;
    icon?: string;
    defaultValue?: any;
    options?: (FilterOption | string)[];
    disabled?: boolean;
    hidden?: boolean;
    clearable?: boolean; // defaults to true
    width?: string; // e.g. '220px', 'min-w-[200px]', 'w-full'
    colSpan?: string;
    customTemplate?: TemplateRef<any>;

    // Button filter options
    buttonLabel?: string;
    buttonIcon?: string;
    buttonClass?: string;
    onClick?: (event: MouseEvent, currentValues: Record<string, any>) => void;

    // Number range (Min - Max) options
    minPlaceholder?: string;
    maxPlaceholder?: string;
    minKey?: string;
    maxKey?: string;
}

export type ThemeMode = 'doctor' | 'patient';

@Component({
    selector: 'app-filter-bar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SelectComponent,
        SearchableSelectComponent,
        DatePickerComponent,
        DateRangePickerComponent
    ],
    templateUrl: './filter-bar.component.html',
    styleUrls: ['./filter-bar.component.css']
})
export class FilterBarComponent implements OnInit, OnChanges, OnDestroy {
    @Input() filters: FilterConfig[] = [];
    @Input() values: Record<string, any> = {};
    @Input() theme: ThemeMode = 'doctor';
    @Input() debounceTimeMs = 300;
    @Input() containerClass = '';
    @Input() showClearAll = true;

    @Output() filterChange = new EventEmitter<Record<string, any>>();
    @Output() filterReset = new EventEmitter<Record<string, any>>();
    @Output() buttonClick = new EventEmitter<{ key: string; event: MouseEvent }>();

    filterValues: Record<string, any> = {};
    filtersExpanded = false;

    get selectTriggerClass(): string {
        const surface = this.theme === 'doctor'
            ? 'bg-[var(--bg)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30'
            : 'bg-[var(--panel)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30';
        return `w-full text-xs font-medium rounded-xl py-2.5 px-3.5 border border-[var(--border)] text-[var(--text)] shadow-inner ${surface}`;
    }
    private debouncedSubject = new Subject<void>();
    private debounceSubscription?: Subscription;

    ngOnInit(): void {
        this.initFilterValues();
        this.debounceSubscription = this.debouncedSubject
            .pipe(debounceTime(this.debounceTimeMs))
            .subscribe(() => {
                this.emitFilterChange();
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['values'] && !changes['values'].firstChange) {
            this.syncIncomingValues();
        }
        if (changes['filters'] && !changes['filters'].firstChange) {
            this.initFilterValues();
        }
    }

    ngOnDestroy(): void {
        this.debounceSubscription?.unsubscribe();
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    /** Initialize filter values object with incoming values or defaults */
    private initFilterValues(): void {
        const initial: Record<string, any> = {};
        for (const config of this.filters) {
            if (config.type === 'number-range') {
                const minK = config.minKey || `${config.key}_min`;
                const maxK = config.maxKey || `${config.key}_max`;
                initial[minK] = this.values[minK] !== undefined ? this.values[minK] : (config.defaultValue?.min ?? null);
                initial[maxK] = this.values[maxK] !== undefined ? this.values[maxK] : (config.defaultValue?.max ?? null);
            } else {
                const val = this.values[config.key] !== undefined
                    ? this.values[config.key]
                    : (config.defaultValue !== undefined ? config.defaultValue : null);
                initial[config.key] = val;
            }
        }
        this.filterValues = { ...initial };
    }

    /** Sync external values update */
    private syncIncomingValues(): void {
        if (!this.values) return;
        let changed = false;
        for (const key of Object.keys(this.values)) {
            if (this.filterValues[key] !== this.values[key]) {
                this.filterValues[key] = this.values[key];
                changed = true;
            }
        }
        if (changed) {
            // Avoid emitting if synchronized from parent
        }
    }

    /** Emit updated filter values object */
    emitFilterChange(): void {
        this.filterChange.emit({ ...this.filterValues });
    }

    /** Triggered on text/search input change (debounced) */
    onTextInputChange(): void {
        this.debouncedSubject.next();
    }

    /** Triggered immediately on select, radio, date pickers */
    onImmediateChange(key: string, value: any): void {
        this.filterValues[key] = value;
        this.emitFilterChange();
    }

    /** Radio option select */
    selectRadioOption(key: string, optionValue: any): void {
        if (this.filterValues[key] === optionValue) return;
        this.filterValues[key] = optionValue;
        this.emitFilterChange();
    }

    /** Number Range Min/Max change */
    onNumberRangeChange(config: FilterConfig): void {
        this.debouncedSubject.next();
    }

    /** Handle button click */
    handleButtonClick(config: FilterConfig, event: MouseEvent): void {
        if (config.onClick) {
            config.onClick(event, { ...this.filterValues });
        }
        this.buttonClick.emit({ key: config.key, event });
    }

    /** Clear all active filters to default/empty values */
    clearAllFilters(): void {
        for (const config of this.filters) {
            if (config.clearable === false) continue;

            if (config.type === 'number-range') {
                const minK = config.minKey || `${config.key}_min`;
                const maxK = config.maxKey || `${config.key}_max`;
                this.filterValues[minK] = config.defaultValue?.min ?? null;
                this.filterValues[maxK] = config.defaultValue?.max ?? null;
            } else {
                const defaultVal = config.defaultValue !== undefined ? config.defaultValue : null;
                this.filterValues[config.key] = defaultVal;
            }
        }

        this.filterReset.emit({ ...this.filterValues });
        this.emitFilterChange();
    }

    /** Calculate count of currently active filters */
    get activeFilterCount(): number {
        let count = 0;
        for (const config of this.filters) {
            if (config.hidden || config.clearable === false) continue;

            if (config.type === 'number-range') {
                const minK = config.minKey || `${config.key}_min`;
                const maxK = config.maxKey || `${config.key}_max`;
                const minVal = this.filterValues[minK];
                const maxVal = this.filterValues[maxK];
                const defaultMin = config.defaultValue?.min ?? null;
                const defaultMax = config.defaultValue?.max ?? null;
                if (minVal !== null && minVal !== undefined && minVal !== '' && minVal !== defaultMin) count++;
                if (maxVal !== null && maxVal !== undefined && maxVal !== '' && maxVal !== defaultMax) count++;
            } else if (config.type === 'date-range') {
                const val = this.filterValues[config.key];
                if (val && (val.startDate || val.endDate)) count++;
            } else {
                const val = this.filterValues[config.key];
                const defaultVal = config.defaultValue !== undefined ? config.defaultValue : null;

                if (val !== null && val !== undefined && val !== '' && val !== 'All' && val !== defaultVal) {
                    count++;
                }
            }
        }
        return count;
    }

    /** Normalize select options to SelectOption[] */
    getSelectOptions(options?: (FilterOption | string)[]): SelectOption[] {
        if (!options) return [];
        return options.map(opt => {
            if (typeof opt === 'string') {
                return { label: opt, value: opt };
            }
            return opt;
        });
    }

    /** Normalize searchable options for the shared searchable select (value + label). */
    getSearchableOptions(options?: (FilterOption | string)[]): { value: any; label: string }[] {
        if (!options) return [];
        return options.map(opt => {
            if (typeof opt === 'string') {
                return { value: opt, label: opt };
            }
            return {
                value: opt.value,
                label: opt.label
            };
        });
    }

    /** Normalize radio options array */
    getRadioOptions(options?: (FilterOption | string)[]): FilterOption[] {
        if (!options) return [];
        return options.map(opt => {
            if (typeof opt === 'string') {
                return { label: opt, value: opt };
            }
            return opt;
        });
    }
}
