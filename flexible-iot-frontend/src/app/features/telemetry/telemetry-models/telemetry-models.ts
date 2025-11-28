export interface TelemetryPointDto {
  id: number;
  timestamp: string; // ISO string a backendről
  value: string;     // stringként jön, számmá kell konvertálni
}

// Ez a konfiguráció egy widget állapotát írja le
export interface TelemetryWidgetConfig {
  uuid: string;       // Egyedi azonosító a frontend listához
  deviceId?: number;
  chartType: 'line' | 'bar' | 'area';
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

export interface TelemetryData {
  id: number;
  name: string;       // eszköz azonosító
  value: string;
  type: string;       // pl. "number", "bool"
  timeStamp: string;  // vagy Date-re mappeled, ha akarod
}

