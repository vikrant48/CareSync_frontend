import { Component, Input, OnDestroy, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full relative flex items-center justify-center overflow-hidden">
      <canvas #canvas class="w-full h-full max-w-full max-h-full block"></canvas>
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

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chart) {
      this.destroy();
      this.render();
    }
  }

  ngOnDestroy() {
    this.destroy();
  }

  private render() {
    if (!this.canvas) return;
    const isPieOrDoughnut = this.type === 'pie' || this.type === 'doughnut';
    const background = this.colors || (isPieOrDoughnut ? this.generateColors(this.data.length) : 'rgba(91, 108, 240, 0.85)');
    const ds = {
      label: this.datasetLabel || this.title,
      data: this.data,
      backgroundColor: background as any,
      borderColor: isPieOrDoughnut ? '#151b2b' : '#5b6cf0',
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
            backgroundColor: '#1b2333',
            titleColor: '#ffffff',
            bodyColor: '#9aa3b8',
            borderColor: '#2a3347',
            borderWidth: 1,
            padding: 10,
            displayColors: isPieOrDoughnut,
          }
        },
        scales: isPieOrDoughnut ? {} : {
          x: {
            grid: { display: false },
            ticks: { color: '#9aa3b8', font: { size: 11 } },
            border: { color: '#2a3347' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9aa3b8', font: { size: 11 }, precision: 0 },
            border: { color: '#2a3347' }
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