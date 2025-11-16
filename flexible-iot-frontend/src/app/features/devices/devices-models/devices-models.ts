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
