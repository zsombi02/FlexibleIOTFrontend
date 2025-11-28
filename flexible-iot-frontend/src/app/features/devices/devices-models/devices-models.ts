export interface DeviceListItem {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  lastSeen: string;
  company: string;
  location: string;
}

export interface DeviceDetailsOverview {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  company: string;
  location: string;
  firmwareVersion: string;
  registeredAt: string;
}

export interface DeviceLiveMetric {
  id: string;
  key: string;
  label: string;
  value: string;
  unit: string;
  updatedAt: string;
}

export interface DeviceHistorySummary {
  metricKey: string;
  metricLabel: string;
  timeWindowLabel: string;
  placeholderText: string;
}

///////////////////////////////
export interface DeviceItem {
  id: number;
  name: string;
  topic: string;
  type: string;
  company: string;
  ownerUserName?: string;
  timeInterval: number;
}

// Backend: CreateDeviceDto
export interface CreateDeviceRequest {
  name: string;
  topic: string;
  type: string;
  companyName?: string;
  ownerUserName?: string;
  timeInterval: number;
  description?: string;
}

export interface TelemetryData {
  id?: number;
  name?: string;
  type?: string;
  value: any;
  timeStamp: string | Date;
}
