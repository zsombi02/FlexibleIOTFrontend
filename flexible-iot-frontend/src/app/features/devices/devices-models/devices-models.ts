export interface DeviceItem {
  id: number;
  name: string;
  topic: string;
  type: string;
  company: string;
  ownerUserName?: string;
  timeInterval: number;
}

export interface DeviceDetails extends DeviceItem {
  description?: string;
  registeredAt: string;
}

export interface CreateDeviceRequest {
  name: string;
  topic: string;
  type: string;
  companyName?: string;
  ownerUserName?: string;
  timeInterval: number;
  description?: string;
}

export interface DeviceLiveMetric {
  key: string;
  label: string;
  value: string;
  unit: string;
  updatedAt: string;
}

export interface TelemetryData {
  id?: number;
  deviceId?: number;
  name?: string;
  type?: string;
  value: any;
  timeStamp: string | Date;
}
