import { Component, Input, OnDestroy, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full relative flex items-center justify-center overflow-hidden">
      <canvas #canvas class="w-full h-full max-w-full max-h-full block" role="img" [attr.aria-label]="ariaSummary"></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }
  `]
})
export class ChartWidgetComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() title: string = '';
  @Input() type: ChartType = 'bar';
  @Input() indexAxis: 'x' | 'y' = 'x';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() datasetLabel: string = '';
  @Input() colors: string[] | undefined;

  /** Text alternative for screen readers: the chart's label/value pairs (first 12). */
  get ariaSummary(): string {
    const name = this.title || this.datasetLabel || 'Chart';
    if (!this.labels?.length) return `${name}: no data`;
    const points = this.labels.slice(0, 12).map((l, i) => `${l} ${this.data?.[i] ?? 0}`).join(', ');
    const more = this.labels.length > 12 ? `, and ${this.labels.length - 12} more` : '';
    return `${name}: ${points}${more}`;
  }

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  private themeObserver: MutationObserver | null = null;

  ngAfterViewInit() {
    this.render();
    if (typeof MutationObserver !== 'undefined') {
      this.themeObserver = new MutationObserver(() => {
        this.destroy();
        this.render();
      });
      this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chart) {
      this.destroy();
      this.render();
    }
  }

  ngOnDestroy() {
    this.themeObserver?.disconnect();
    this.destroy();
  }

  private token(name: string, fallback: string): string {
    if (typeof document === 'undefined') return fallback;
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }

  private render() {
    if (!this.canvas) return;
    const isPieOrDoughnut = this.type === 'pie' || this.type === 'doughnut';
    const primary = this.token('--primary', '#2563eb');
    const panel = this.token('--panel', '#111827');
    const text = this.token('--text', '#e5e7eb');
    const muted = this.token('--muted', '#9ca3af');
    const border = this.token('--border', '#1f2937');
    const background = this.colors || (isPieOrDoughnut ? this.generateColors(this.data.length) : primary);
    const ds = {
      label: this.datasetLabel || this.title,
      data: this.data,
      backgroundColor: background as any,
      borderColor: isPieOrDoughnut ? panel : primary,
      borderWidth: isPieOrDoughnut ? 3 : 1,
      borderRadius: this.type === 'bar' ? 6 : 0,
      cutout: this.type === 'doughnut' ? '68%' : 0,
      maxBarThickness: 36,
      barPercentage: 0.6,
    } as any;

    const config = {
      type: this.type,
      data: { labels: this.labels, datasets: [ds] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: this.indexAxis,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: panel,
            titleColor: text,
            bodyColor: muted,
            borderColor: border,
            borderWidth: 1,
            padding: 10,
            displayColors: isPieOrDoughnut,
          }
        },
        scales: isPieOrDoughnut ? {} : {
          x: {
            grid: { display: false },
            ticks: { color: muted, font: { size: 11 } },
            border: { color: border }
          },
          y: {
            grid: { color: border },
            ticks: { color: muted, font: { size: 11 }, precision: 0 },
            border: { color: border }
          },
        },
      },
    } as any;
    this.chart = new Chart(this.canvas.nativeElement.getContext('2d')!, config);
  }

  private destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private generateColors(n: number): string[] {
    const palette = ['#3b82f6', '#a78bfa', '#ef4444', '#eab308', '#64748b', '#10b981', '#f43f5e', '#8b5cf6'];
    const colors: string[] = [];
    for (let i = 0; i < n; i++) colors.push(palette[i % palette.length]);
    return colors;
  }
}