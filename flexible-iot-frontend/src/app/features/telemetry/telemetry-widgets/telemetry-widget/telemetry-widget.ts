import {Component, EventEmitter, inject, Input, OnInit, Output, signal} from '@angular/core';
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
@Component({
  selector: 'app-telemetry-widget',
  imports: [
    CommonModule, MatCardModule, MatFormFieldModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatIconModule,
    MatInputModule, FormsModule, NgxEchartsDirective
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

  // --- ÚJ: GYORSVÁLASZTÓ OPCIÓK ---
  timeRanges = [
    { value: 30, label: 'Utolsó 30 perc' },
    { value: 60, label: 'Utolsó 1 óra' },
    { value: 360, label: 'Utolsó 6 óra' },
    { value: 1440, label: 'Utolsó 24 óra' },
    { value: 0, label: 'Egyéni időszak' } // 0 = Custom
  ];

  // Alapértelmezés: 30 perc
  selectedRangeValue = 30;

  chartTypes = [
    { value: 'line', label: 'Vonal (Line)' },
    { value: 'area', label: 'Terület (Area)' },
    { value: 'bar', label: 'Oszlop (Bar)' }
  ];

  ngOnInit() {
    // Ha már van mentett dátum, és az nem friss, akkor 'Egyéni'-re állítjuk
    if (this.config.dateFrom && this.config.dateTo) {
      this.selectedRangeValue = 0;
    }

    if (this.config.deviceId) {
      // Ha nincs dátum (pl. most hoztuk létre), beállítjuk a defaultot
      if (!this.config.dateFrom) {
        this.updateDateRangeByPreset(30);
      }
      this.loadData();
    }
  }

  // Eszköz váltáskor reseteljük 30 percre
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

  // --- RANGE VÁLTÁS LOGIKA ---
  onRangeChange(value: number) {
    if (value > 0) {
      // Preset választásakor kiszámoljuk a dátumokat
      this.updateDateRangeByPreset(value);
      this.loadData();
    }
    // Ha 0 (Egyéni), akkor nem csinálunk semmit, a user írja be
  }

  private updateDateRangeByPreset(minutes: number) {
    const end = new Date();
    const start = new Date(end.getTime() - (minutes * 60 * 1000));

    this.config.dateTo = end;
    this.config.dateFrom = start;
  }

  // --- DATETIME STRING KONVERZIÓK (Inputhoz) ---
  get dateFromStr(): string { return this.toDateTimeLocal(this.config.dateFrom); }
  set dateFromStr(val: string) {
    this.config.dateFrom = val ? new Date(val) : null;
    this.selectedRangeValue = 0; // Kézi állításnál átváltunk Custom-ra
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

  // --- API ---
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

    const type = this.config.chartType === 'area' ? 'line' : this.config.chartType;
    const areaStyle = this.config.chartType === 'area' ? { opacity: 0.3 } : undefined;

    this.chartOption.set({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: this.config.chartType === 'bar'
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      dataZoom: [ { type: 'inside' }, { type: 'slider', height: 20, bottom: 5 } ],
      series: [{
        data: values,
        type: type as any,
        smooth: true,
        areaStyle: areaStyle,
        itemStyle: { color: '#3f51b5' },
        lineStyle: { width: 2 }
      }]
    });
  }
}
