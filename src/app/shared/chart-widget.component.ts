import { Component, Input, OnDestroy, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 border rounded">
      <div class="text-sm text-gray-400 mb-2">{{ title }}</div>
      <div style="height: 220px;">
        <canvas #canvas></canvas>
      </div>
    </div>
  `,
})
export class ChartWidgetComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() title: string = '';
  @Input() type: ChartType = 'bar';
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
      this.update();
    }
  }

  ngOnDestroy() {
    this.destroy();
  }

  private render() {
    if (!this.canvas) return;
    const background = this.colors || (this.type === 'pie' || this.type === 'doughnut' ? this.generateColors(this.data.length) : 'rgba(59,130,246,0.5)');
    const ds = {
      label: this.datasetLabel || this.title,
      data: this.data,
      backgroundColor: background as any,
      borderColor: 'rgba(59,130,246,1)',
    } as any;

    const config = {
      type: this.type,
      data: { labels: this.labels, datasets: [ds] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: this.type !== 'bar' || !!this.datasetLabel },
        },
        scales: this.type === 'pie' || this.type === 'doughnut' ? {} : {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.08)' } },
        },
      },
    } as any;
    this.chart = new Chart(this.canvas.nativeElement.getContext('2d')!, config);
  }

  private update() {
    if (!this.chart) return;
    this.chart.data.labels = this.labels;
    if (this.chart.data.datasets?.[0]) {
      this.chart.data.datasets[0].data = this.data;
      this.chart.data.datasets[0].label = this.datasetLabel || this.title;
      if (this.colors) this.chart.data.datasets[0].backgroundColor = this.colors as any;
    }
    this.chart.update();
  }

  private destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private generateColors(n: number): string[] {
    const palette = ['#60A5FA','#34D399','#F59E0B','#F472B6','#A78BFA','#10B981','#EF4444','#93C5FD','#FCD34D','#C4B5FD'];
    const colors: string[] = [];
    for (let i = 0; i < n; i++) colors.push(palette[i % palette.length]);
    return colors;
  }
}