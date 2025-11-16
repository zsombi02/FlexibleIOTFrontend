export interface DashboardStatCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
}

export interface DashboardTelemetryCard {
  title: string;
  selectedMetricLabel: string;
  selectedMetricKey: string;
  metricOptions: string[];
  modeLabel: string;          // pl. "Hisztogram"
  placeholderText: string;    // pl. "Grafikon helye (mock)"
}

export interface DashboardLiveFeedItem {
  id: string;
  deviceName: string;
  metricName: string;
  value: string;
  unit: string;
  time: string;
}

export interface DashboardTopDevice {
  id: string;
  deviceName: string;
  company: string;
  messagesLabel: string;      // "ÜZENETEK"
  messagesCount: number;
}
