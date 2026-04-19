import type {
  ConnectRequest,
  PlotDataRequest,
  PlotDataResponse,
  PortInfo,
  SerialStatus,
  UploadResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getPorts() {
  return requestJson<PortInfo[]>("/api/ports");
}

export function connectSerial(payload: ConnectRequest) {
  return requestJson<SerialStatus>("/api/serial/connect", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/csv/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Upload failed with status ${response.status}`);
  }

  return response.json() as Promise<UploadResponse>;
}

export function fetchPlotData(payload: PlotDataRequest) {
  return requestJson<PlotDataResponse>("/api/csv/plot-data", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
