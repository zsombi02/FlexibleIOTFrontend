export interface TelemetryPointDto {
  id: number;
  timestamp: string; // ISO string a backendről
  value: string;     // stringként jön, számmá kell konvertálni
}

export interface TelemetryWidgetConfig {
  uuid: string;
  deviceId?: number;
  chartType: 'line' | 'bar' | 'area';
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export interface TelemetryData {
  id: number;
  name: string;
  value: string;
  type: string;
  timeStamp: string;
}

