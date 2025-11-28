export interface TelemetryData {
  id: number;
  name: string;       // eszköz azonosító
  value: string;
  type: string;       // pl. "number", "bool"
  timeStamp: string;  // vagy Date-re mappeled, ha akarod
}
