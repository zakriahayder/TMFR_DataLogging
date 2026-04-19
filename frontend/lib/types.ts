export interface PortInfo {
  device: string;
  description?: string | null;
}

export interface SerialStatus {
  connected: boolean;
  port: string | null;
  baudrate: number | null;
}

export interface ConnectRequest {
  port: string;
  baudrate: number;
}

export interface UploadResponse {
  filename: string;
  columns: string[];
  numeric_columns: string[];
  row_count: number;
  default_x: string | null;
}

export interface PlotDataRequest {
  filename: string;
  x_column: string;
  y_columns: string[];
}

export interface PlotDataResponse {
  x_column: string;
  y_columns: string[];
  series: Record<string, number[]>;
  x_data: number[];
  row_count: number;
}
