import {Component, EventEmitter, HostBinding, inject, Input, OnInit, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core'; // Vagy MomentDateModule
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input'; // Input a datepickerhez
import {FormsModule} from '@angular/forms';
import {NgxEchartsDirective} from 'ngx-echarts';
import {EChartsOption} from 'echarts';
import {TelemetryWidgetConfig} from '../../telemetry-models/telemetry-models';
import {DeviceItem} from '../../../devices/devices-models/devices-models';
import {TelemetryService} from '../../telemetry-api/telemetry-service';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ChartStrategyFactory} from '../telemetry-strategies/chart-strategy';

@Component({
  selector: 'app-telemetry-widget',
  imports: [
    CommonModule, MatCardModule, MatFormFieldModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatIconModule,
    MatInputModule, FormsModule, NgxEchartsDirective, MatTooltipModule
  ],
  templateUrl: './telemetry-widget.html',
  styleUrl: './telemetry-widget.scss',
})
export class TelemetryWidget implements OnInit {
  private api = inject(TelemetryService);

  @Input({required: true}) config!: TelemetryWidgetConfig;
  @Input({required: true}) devices: DeviceItem[] = [];
  @Output() remove = new EventEmitter<string>();

  chartOption = signal<EChartsOption | null>(null);
  isLoading = signal<boolean>(false);
  dataCount = signal<number>(0);

  isExpanded = signal<boolean>(false);

  @HostBinding('class.expanded-widget')
  get expandedClass() {
    return this.isExpanded();
  }

  timeRanges = [
    { value: 30, label: 'Last 30 minutes' },
    { value: 60, label: 'Last 1 hour' },
    { value: 360, label: 'Last 6 hours' },
    { value: 1440, label: 'Last 24 hours' },
    { value: 0, label: 'Custom Interval' }
  ];

  selectedRangeValue = 30;

  chartTypes = [
    { value: 'line', label: 'Line' },
    { value: 'area', label: 'Area' },
    { value: 'bar', label: 'Bar' }
  ];

  ngOnInit() {
    if (this.config.dateFrom && this.config.dateTo) {
      this.selectedRangeValue = 0;
    }

    if (this.config.deviceId) {
      if (!this.config.dateFrom) {
        this.updateDateRangeByPreset(30);
      }
      this.loadData();
    }
  }

  toggleExpand() {
    this.isExpanded.update(v => !v);
  }

  onDeviceChange() {
    this.selectedRangeValue = 30;
    this.updateDateRangeByPreset(30);
    this.loadData();
  }

  onConfigChange() {
    if (this.config.deviceId) {
      this.loadData();
    }
  }

  onRemove() {
    this.remove.emit(this.config.uuid);
  }

  onRangeChange(value: number) {
    if (value > 0) {
      this.updateDateRangeByPreset(value);
      this.loadData();
    }
  }

  private updateDateRangeByPreset(minutes: number) {
    const end = new Date();
    const start = new Date(end.getTime() - (minutes * 60 * 1000));
    this.config.dateTo = end;
    this.config.dateFrom = start;
  }

  get dateFromStr(): string { return this.toDateTimeLocal(this.config.dateFrom); }
  set dateFromStr(val: string) {
    this.config.dateFrom = val ? new Date(val) : null;
    this.selectedRangeValue = 0;
    this.loadData();
  }

  get dateToStr(): string { return this.toDateTimeLocal(this.config.dateTo); }
  set dateToStr(val: string) {
    this.config.dateTo = val ? new Date(val) : null;
    this.selectedRangeValue = 0;
    this.loadData();
  }

  private toDateTimeLocal(date: Date | null | undefined): string {
    if (!date) return '';
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + 'T' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds());
  }

  loadData() {
    if (!this.config.deviceId) return;
    this.isLoading.set(true);

    this.api.getTelemetryHistory(
      this.config.deviceId,
      this.config.dateFrom,
      this.config.dateTo
    ).subscribe({
      next: (data) => {
        this.dataCount.set(data.length);
        this.updateChart(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  private updateChart(data: any[]) {
    if (data.length === 0) {
      this.chartOption.set(null);
      return;
    }

    const timestamps = data.map(d => new Date(d.timestamp).toLocaleString());
    const values = data.map(d => parseFloat(d.value));


    const strategy = ChartStrategyFactory.getStrategy(this.config.chartType);

    const option = strategy.getOption(timestamps, values, '#3f51b5');

    this.chartOption.set(option);
  }
}
