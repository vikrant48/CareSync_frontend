import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { AppointmentAnalyticsResponse } from '../../core/models/appointment.models';
import { AdminChromeComponent } from './admin-chrome.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';

interface FunnelStep {
    name: string;
    count: number;
    conversionRate: number;
}

interface StatusCountItem {
    status: string;
    count: number;
}

@Component({
    selector: 'app-appointment-analytics-dashboard',
    standalone: true,
    imports: [CommonModule, AdminChromeComponent, FilterBarComponent],
    templateUrl: './appointment-analytics-dashboard.component.html',
    styleUrl: './appointment-analytics-dashboard.component.css'
})
export class AppointmentAnalyticsDashboardComponent implements OnInit {
    private appointmentApi = inject(AppointmentApiService);

    startDate: string = '';
    endDate: string = '';

    readonly analyticsFilterConfigs: FilterConfig[] = [
        {
            type: 'date',
            key: 'startDate',
            label: 'Start Date',
            placeholder: 'Start date',
            defaultValue: '',
            width: 'w-full sm:w-56'
        },
        {
            type: 'date',
            key: 'endDate',
            label: 'End Date',
            placeholder: 'End date',
            defaultValue: '',
            width: 'w-full sm:w-56'
        },
        {
            type: 'button',
            key: 'reset',
            buttonLabel: 'Reset',
            buttonIcon: 'fa-solid fa-rotate-left',
            clearable: false,
            width: 'w-full sm:w-auto',
            onClick: () => this.resetFilters()
        }
    ];

    analyticsFilterValues: Record<string, string> = {
        startDate: '',
        endDate: ''
    };
    loading: boolean = false;
    analytics: AppointmentAnalyticsResponse | null = null;
    funnelSteps: FunnelStep[] = [];
    statusBreakdownList: StatusCountItem[] = [];

    ngOnInit(): void {
        this.loadAnalytics();
    }

    loadAnalytics(): void {
        this.loading = true;
        this.appointmentApi.getAppointmentAnalytics(this.startDate, this.endDate).subscribe({
            next: (data: AppointmentAnalyticsResponse) => {
                this.analytics = data;
                this.processFunnelData(data);
                this.processStatusBreakdown(data);
                this.loading = false;
            },
            error: (err: any) => {
                this.loading = false;
            }
        });
    }

    onAnalyticsFilterChange(values: Record<string, string>): void {
        this.startDate = values['startDate'] || '';
        this.endDate = values['endDate'] || '';
        this.loadAnalytics();
    }

    resetFilters(): void {
        this.startDate = '';
        this.endDate = '';
        this.analyticsFilterValues = {
            startDate: '',
            endDate: ''
        };
        this.loadAnalytics();
    }

    private processFunnelData(data: AppointmentAnalyticsResponse): void {
        const total = data.totalAppointments || 1;
        const funnel = data.funnelConversion || {};

        const holdCount = funnel['HELD'] || total;
        const bookedCount = funnel['BOOKED'] || data.totalAppointments || 0;
        const intakeCount = funnel['INTAKE_COMPLETED'] || Math.round(data.completedAppointments * 1.1);
        const completedCount = data.completedAppointments || 0;

        this.funnelSteps = [
            { name: '1. Slot Hold Created', count: holdCount, conversionRate: 100 },
            { name: '2. Appointment Booked', count: bookedCount, conversionRate: Math.min(100, (bookedCount / total) * 100) },
            { name: '3. Intake Completed', count: intakeCount, conversionRate: Math.min(100, (intakeCount / total) * 100) },
            { name: '4. Visit Completed', count: completedCount, conversionRate: data.completionRate || Math.min(100, (completedCount / total) * 100) }
        ];
    }

    private processStatusBreakdown(data: AppointmentAnalyticsResponse): void {
        const breakdown = data.statusBreakdown || {};
        this.statusBreakdownList = Object.keys(breakdown).map((key) => ({
            status: key,
            count: breakdown[key]
        }));
    }
}
