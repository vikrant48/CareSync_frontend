import { Component, Input, Output, EventEmitter, ElementRef, HostListener, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface CalendarDay {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
}

@Component({
    selector: 'app-date-picker',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: true
        }
    ],
    template: `
    <div class="w-full flex flex-col space-y-1.5 relative">
      <!-- Label -->
      <label *ngIf="label" class="text-xs font-semibold text-[#9aa3b8] flex items-center gap-1">
        <span>{{ label }}</span>
        <span *ngIf="required" class="text-rose-400 font-bold">*</span>
      </label>

      <!-- Input Trigger -->
      <div
        tabindex="0"
        (click)="toggleOpen()"
        (keydown.enter)="toggleOpen()"
        [ngClass]="[
          'w-full bg-[#151b2b] text-[#f5f7ff] text-sm rounded-xl py-2.5 px-3.5 border transition-all duration-200 flex items-center justify-between cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#5b6cf0]/20',
          disabled ? 'opacity-50 !cursor-not-allowed bg-[#151b2b]/50' : 'hover:border-[#3b4763]',
          isOpen ? '!border-[#5b6cf0] ring-2 ring-[#5b6cf0]/20' : '',
          errorMessage ? 'border-rose-500/80' : 'border-[#2a3347]'
        ]"
      >
        <div class="flex items-center gap-2.5 truncate">
          <i class="fa-solid fa-calendar-days text-[#5b6cf0] text-sm"></i>
          <span *ngIf="formattedSelectedDate" class="font-medium text-white">
            {{ formattedSelectedDate }}
          </span>
          <span *ngIf="!formattedSelectedDate" class="text-[#9aa3b8]/50">
            {{ placeholder }}
          </span>
        </div>

        <i class="fa-solid fa-chevron-down text-xs text-[#9aa3b8] transition-transform duration-200" [class.rotate-180]="isOpen"></i>
      </div>

      <!-- Calendar Popup Window -->
      <div
        *ngIf="isOpen"
        class="absolute top-full left-0 mt-1 z-50 bg-[#1b2333] border border-[#2a3347] rounded-2xl shadow-2xl p-4 w-72 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
      >
        <!-- Header: Month/Year Nav & Today Button -->
        <div class="flex items-center justify-between pb-2 border-b border-[#2a3347]">
          <button
            type="button"
            (click)="prevMonth($event)"
            class="w-7 h-7 rounded-lg hover:bg-[#151b2b] text-[#9aa3b8] hover:text-white flex items-center justify-center transition-colors"
          >
            <i class="fa-solid fa-chevron-left text-xs"></i>
          </button>

          <span class="text-xs font-bold text-white uppercase tracking-wider">
            {{ monthNames[viewDate.getMonth()] }} {{ viewDate.getFullYear() }}
          </span>

          <button
            type="button"
            (click)="nextMonth($event)"
            class="w-7 h-7 rounded-lg hover:bg-[#151b2b] text-[#9aa3b8] hover:text-white flex items-center justify-center transition-colors"
          >
            <i class="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>

        <!-- Days of Week Header -->
        <div class="grid grid-cols-7 text-center text-[10px] font-bold text-[#9aa3b8]">
          <span *ngFor="let day of weekDays">{{ day }}</span>
        </div>

        <!-- Calendar Days Grid -->
        <div class="grid grid-cols-7 gap-1 text-center">
          <button
            *ngFor="let dayObj of calendarDays"
            type="button"
            [disabled]="dayObj.isDisabled"
            (click)="selectDate(dayObj, $event)"
            [ngClass]="[
              'h-8 w-8 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-all select-none',
              !dayObj.isCurrentMonth ? 'text-[#9aa3b8]/30' : 'text-[#f5f7ff]',
              dayObj.isToday && !dayObj.isSelected ? 'border border-[#5b6cf0] text-[#5b6cf0] font-bold' : '',
              dayObj.isSelected ? '!bg-[#5b6cf0] !text-white font-bold shadow-md shadow-[#5b6cf0]/30' : 'hover:bg-[#151b2b]',
              dayObj.isDisabled ? 'opacity-25 !cursor-not-allowed pointer-events-none' : 'cursor-pointer'
            ]"
          >
            {{ dayObj.dayNumber }}
          </button>
        </div>

        <!-- Footer Actions: Today Button -->
        <div class="pt-2 border-t border-[#2a3347] flex items-center justify-between">
          <button
            type="button"
            (click)="selectToday($event)"
            class="text-[11px] font-bold text-[#5b6cf0] hover:underline flex items-center gap-1"
          >
            <i class="fa-solid fa-crosshairs text-[10px]"></i>
            <span>Today</span>
          </button>
          <button
            type="button"
            (click)="isOpen = false"
            class="text-[11px] text-[#9aa3b8] hover:text-white"
          >
            Close
          </button>
        </div>
      </div>

      <!-- Error message -->
      <p *ngIf="errorMessage" class="text-xs text-rose-400 flex items-center gap-1 font-medium mt-1">
        <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
        <span>{{ errorMessage }}</span>
      </p>
    </div>
  `
})
export class DatePickerComponent implements ControlValueAccessor, OnInit {
    @Input() label?: string;
    @Input() placeholder = 'YYYY-MM-DD';
    @Input() required = false;
    @Input() disabled = false;
    @Input() minDate?: Date | string;
    @Input() maxDate?: Date | string;
    @Input() errorMessage?: string;

    @Output() dateChange = new EventEmitter<string>();

    selectedDate: Date | null = null;
    viewDate = new Date();
    isOpen = false;
    calendarDays: CalendarDay[] = [];

    monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    onChange: (val: string) => void = () => { };
    onTouched: () => void = () => { };

    constructor(private elementRef: ElementRef) { }

    ngOnInit() {
        this.generateCalendar();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    get formattedSelectedDate(): string {
        if (!this.selectedDate) return '';
        const yyyy = this.selectedDate.getFullYear();
        const mm = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(this.selectedDate.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    toggleOpen() {
        if (this.disabled) return;
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            if (this.selectedDate) {
                this.viewDate = new Date(this.selectedDate);
            } else {
                this.viewDate = new Date();
            }
            this.generateCalendar();
        }
    }

    prevMonth(event: MouseEvent) {
        event.stopPropagation();
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
        this.generateCalendar();
    }

    nextMonth(event: MouseEvent) {
        event.stopPropagation();
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
        this.generateCalendar();
    }

    selectDate(dayObj: CalendarDay, event: MouseEvent) {
        event.stopPropagation();
        if (dayObj.isDisabled) return;

        this.selectedDate = new Date(dayObj.date);
        const dateStr = this.formattedSelectedDate;
        this.onChange(dateStr);
        this.dateChange.emit(dateStr);
        this.isOpen = false;
    }

    selectToday(event: MouseEvent) {
        event.stopPropagation();
        const today = new Date();
        this.selectedDate = today;
        this.viewDate = new Date(today);
        const dateStr = this.formattedSelectedDate;
        this.onChange(dateStr);
        this.dateChange.emit(dateStr);
        this.isOpen = false;
    }

    generateCalendar() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startingDayOfWeek = firstDayOfMonth.getDay();
        const totalDaysInMonth = lastDayOfMonth.getDate();

        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const minD = this.minDate ? new Date(this.minDate) : null;
        if (minD) minD.setHours(0, 0, 0, 0);

        const maxD = this.maxDate ? new Date(this.maxDate) : null;
        if (maxD) maxD.setHours(0, 0, 0, 0);

        // Days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, prevMonthLastDay - i);
            days.push(this.createCalendarDayObj(d, false, today, minD, maxD));
        }

        // Days of current month
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const d = new Date(year, month, i);
            days.push(this.createCalendarDayObj(d, true, today, minD, maxD));
        }

        // Days for next month padding
        const remainingGridSlots = 42 - days.length;
        for (let i = 1; i <= remainingGridSlots; i++) {
            const d = new Date(year, month + 1, i);
            days.push(this.createCalendarDayObj(d, false, today, minD, maxD));
        }

        this.calendarDays = days;
    }

    private createCalendarDayObj(d: Date, isCurrentMonth: boolean, today: Date, minD: Date | null, maxD: Date | null): CalendarDay {
        d.setHours(0, 0, 0, 0);
        const isToday = d.getTime() === today.getTime();
        const isSelected = this.selectedDate ? d.getTime() === new Date(this.selectedDate).setHours(0, 0, 0, 0) : false;

        let isDisabled = false;
        if (minD && d.getTime() < minD.getTime()) isDisabled = true;
        if (maxD && d.getTime() > maxD.getTime()) isDisabled = true;

        return {
            date: d,
            dayNumber: d.getDate(),
            isCurrentMonth,
            isToday,
            isSelected,
            isDisabled
        };
    }

    // ControlValueAccessor Interface
    writeValue(value: any): void {
        if (value) {
            this.selectedDate = new Date(value);
            this.viewDate = new Date(value);
        } else {
            this.selectedDate = null;
        }
        this.generateCalendar();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
