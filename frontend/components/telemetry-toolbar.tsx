"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  Cable,
  Download,
  FileDown,
  FileSpreadsheet,
  FolderOpen,
  RefreshCw,
  Settings,
  Trash2,
  Unplug,
  UploadCloud,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DeviceFile,
  PortInfo,
  SerialStatus,
  UploadResponse,
} from "@/lib/types";

const BAUD_RATE_OPTIONS = [
  9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
];
const modalFieldClassName = "bg-card";
const modalMenuClassName = "bg-background-elevated";

interface TelemetryTopBarProps {
  dataset: UploadResponse | null;
  serialStatus: SerialStatus | null;
  selectedXColumn: string;
  selectedYColumn: string;
  availableColumns: string[];
  availableYColumns: string[];
  plotReady: boolean;
  onChangeXColumn: (value: string) => void | Promise<void>;
  onChangeYColumn: (value: string) => void | Promise<void>;
  onClearWorkspace: () => void;
  onOpenConfiguration: () => void;
}

export function TelemetryTopBar({
  dataset,
  serialStatus,
  selectedXColumn,
  selectedYColumn,
  availableColumns,
  availableYColumns,
  plotReady,
  onChangeXColumn,
  onChangeYColumn,
  onClearWorkspace,
  onOpenConfiguration,
}: TelemetryTopBarProps) {
  const isConnected = serialStatus?.connected ?? false;

  return (
    <header className="theme-header-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
            <span className="brand-heading text-lg text-primary">
              TMFR Telemetry Viewer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dataset ? (
            <StatusBadge
              icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
              variant="primary"
            >
              {dataset.filename}
            </StatusBadge>
          ) : null}

          <StatusBadge icon={<Cable className="h-3.5 w-3.5" />}>
            {isConnected && serialStatus?.port
              ? `${serialStatus.port} @ ${serialStatus.baudrate}`
              : "Serial idle"}
          </StatusBadge>

          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Open settings"
            onClick={onOpenConfiguration}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-2.5">
        <AxisSelect
          label="X"
          value={selectedXColumn}
          options={availableColumns}
          disabled={!dataset}
          onChange={onChangeXColumn}
        />

        <AxisSelect
          label="Y"
          value={selectedYColumn}
          options={availableYColumns}
          disabled={!dataset}
          onChange={onChangeYColumn}
        />

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!dataset}
            onClick={onClearWorkspace}
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!plotReady}
            onClick={() => clickPlotActionButton("export")}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </header>
  );
}

interface TelemetryConfigurationModalProps {
  isOpen: boolean;
  ports: PortInfo[];
  serialStatus: SerialStatus | null;
  scanningPorts: boolean;
  connectingSerial: boolean;
  connectionError: string | null;
  deviceFiles: DeviceFile[];
  fetchingFiles: boolean;
  pullingFile: string | null;
  dataset: UploadResponse | null;
  uploadLoading: boolean;
  plotLoading: boolean;
  onClose: () => void;
  onScanPorts: () => void;
  onConnectToSerial: (port: string, baudrate: number) => void;
  onDisconnectSerial: () => void;
  onFetchDeviceFiles: () => void;
  onPullDeviceFile: (filename: string) => void;
  onUploadCsv: (file: File) => void;
  onClearDataset: () => void;
  onGeneratePlot: () => void | Promise<void>;
}

export function TelemetryConfigurationModal({
  isOpen,
  ports,
  serialStatus,
  scanningPorts,
  connectingSerial,
  connectionError,
  deviceFiles,
  fetchingFiles,
  pullingFile,
  dataset,
  uploadLoading,
  plotLoading,
  onClose,
  onScanPorts,
  onConnectToSerial,
  onDisconnectSerial,
  onFetchDeviceFiles,
  onPullDeviceFile,
  onUploadCsv,
  onClearDataset,
  onGeneratePlot,
}: TelemetryConfigurationModalProps) {
  const [selectedPort, setSelectedPort] = useState("");
  const [selectedBaudRate, setSelectedBaudRate] = useState(115200);
  const [customBaudRate, setCustomBaudRate] = useState("");

  const isConnected = serialStatus?.connected ?? false;

  useEffect(() => {
    if (!selectedPort && ports.length > 0) {
      setSelectedPort(ports[0].device);
    }
  }, [ports, selectedPort]);

  useEffect(() => {
    if (serialStatus?.connected && serialStatus.port) {
      setSelectedPort(serialStatus.port);
      if (serialStatus.baudrate) {
        setSelectedBaudRate(serialStatus.baudrate);
        if (!BAUD_RATE_OPTIONS.includes(serialStatus.baudrate)) {
          setCustomBaudRate(String(serialStatus.baudrate));
        }
      }
    }
  }, [serialStatus]);

  const activeBaudRate = useMemo(() => {
    const parsedBaudRate = Number.parseInt(customBaudRate, 10);
    return Number.isFinite(parsedBaudRate) ? parsedBaudRate : selectedBaudRate;
  }, [customBaudRate, selectedBaudRate]);

  const canGeneratePlot = dataset !== null && !uploadLoading && !plotLoading;
  const isBusy = connectingSerial || fetchingFiles || pullingFile !== null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton
        className="flex max-h-[90vh] max-w-2xl flex-col p-0"
      >
        <DialogHeader>
          <DialogTitle>Telemetry Configuration</DialogTitle>
          <DialogDescription>
            Connect to a device over Serial (the device must be running the TMFR
            telemetry sketch), or upload a CSV log file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <ConfigSection
            title="Serial Connection"
            description="Choose a COM port and baud rate to connect."
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <ConfigField label="COM Port">
                <Select
                  value={selectedPort || undefined}
                  onValueChange={setSelectedPort}
                  disabled={isBusy || ports.length === 0}
                >
                  <SelectTrigger className={modalFieldClassName}>
                    <SelectValue placeholder="No ports found" />
                  </SelectTrigger>
                  <SelectContent className={modalMenuClassName}>
                    {ports.map((port) => (
                      <SelectItem key={port.device} value={port.device}>
                        {port.description
                          ? `${port.device} (${port.description})`
                          : port.device}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ConfigField>

              <Button
                type="button"
                variant="outline"
                onClick={onScanPorts}
                disabled={isBusy}
                className="sm:self-end"
              >
                <RefreshCw
                  className={`h-4 w-4 ${scanningPorts ? "animate-spin" : ""}`}
                />
                Scan
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ConfigField label="Baud Rate Preset">
                <Select
                  value={String(selectedBaudRate)}
                  onValueChange={(value) => {
                    setSelectedBaudRate(Number(value));
                    setCustomBaudRate("");
                  }}
                  disabled={isBusy}
                >
                  <SelectTrigger className={modalFieldClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={modalMenuClassName}>
                    {BAUD_RATE_OPTIONS.map((baudRate) => (
                      <SelectItem key={baudRate} value={String(baudRate)}>
                        {baudRate.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ConfigField>

              <ConfigField label="Custom Baud Rate">
                <Input
                  value={customBaudRate}
                  onChange={(event) => setCustomBaudRate(event.target.value)}
                  placeholder="e.g. 500000"
                  disabled={isBusy}
                  inputMode="numeric"
                  className={modalFieldClassName}
                />
              </ConfigField>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="default" className="bg-card py-1.5">
                {isConnected
                  ? `Connected to ${serialStatus?.port}`
                  : "Disconnected"}
              </Badge>

              <div className="flex gap-2">
                {isConnected ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onDisconnectSerial}
                    disabled={isBusy}
                  >
                    <Unplug className="h-4 w-4" />
                    Disconnect
                  </Button>
                ) : null}

                <Button
                  type="button"
                  onClick={() =>
                    onConnectToSerial(selectedPort, activeBaudRate)
                  }
                  disabled={!selectedPort || isBusy}
                >
                  <Cable className="h-4 w-4" />
                  {connectingSerial
                    ? "Connecting..."
                    : isConnected
                      ? "Reconnect"
                      : "Connect"}
                </Button>
              </div>
            </div>

            {connectionError ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive-soft px-3 py-2 text-xs text-destructive">
                {connectionError}
              </p>
            ) : null}
          </ConfigSection>

          {isConnected ? (
            <ConfigSection
              title="Device Files"
              description="List and pull CSV files stored on the SD Card."
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {deviceFiles.length > 0
                    ? `${deviceFiles.length} file${deviceFiles.length === 1 ? "" : "s"} on device`
                    : "Fetch files to see what's on the SD card."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onFetchDeviceFiles}
                  disabled={isBusy}
                >
                  <FolderOpen
                    className={`h-4 w-4 ${fetchingFiles ? "animate-pulse" : ""}`}
                  />
                  {fetchingFiles ? "Fetching..." : "Fetch Files"}
                </Button>
              </div>

              {deviceFiles.length > 0 ? (
                <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border bg-card">
                  {deviceFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onPullDeviceFile(file.name)}
                        disabled={isBusy}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        {pullingFile === file.name ? "Pulling..." : "Pull"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </ConfigSection>
          ) : null}

          <ConfigSection
            title="Data Source"
            description="Upload a CSV log file from your computer."
          >
            <CsvDropzone loading={uploadLoading} onUploadCsv={onUploadCsv} />

            {dataset ? (
              <Card className="theme-inset-border border-border bg-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-primary">
                      {dataset.filename}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {dataset.row_count.toLocaleString()} rows &middot;{" "}
                      {dataset.numeric_columns.length} numeric columns
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Clear dataset"
                    onClick={onClearDataset}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </ConfigSection>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={onGeneratePlot}
            disabled={!canGeneratePlot}
          >
            <Activity className="h-4 w-4" />
            {plotLoading ? "Generating..." : "Generate Plot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CsvDropzone({
  loading,
  onUploadCsv,
}: {
  loading: boolean;
  onUploadCsv: (file: File) => void;
}) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  function uploadSelectedFile(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".csv")) {
      return;
    }

    onUploadCsv(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    uploadSelectedFile(event.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("csv-modal-input")?.click()}
      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center transition ${
        isDraggingFile
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card">
        <UploadCloud className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {loading ? "Uploading CSV..." : "Drag and drop CSV here"}
        </p>
        <p className="text-xs text-muted-foreground">
          or click to browse local files
        </p>
      </div>
      <Input
        id="csv-modal-input"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(event) => uploadSelectedFile(event.target.files)}
      />
    </div>
  );
}

function ConfigSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="theme-inset-border border-border bg-background-elevated shadow-[var(--shadow-panel)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ConfigField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="brand-label text-[11px] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function AxisSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void | Promise<void>;
}) {
  const hasOptions = options.length > 0;

  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="brand-label text-[11px] text-muted-foreground">
        {label}
      </span>
      <Select
        value={hasOptions && value ? value : undefined}
        onValueChange={onChange}
        disabled={disabled || !hasOptions}
      >
        <SelectTrigger className="h-8 min-w-32 bg-card px-2.5 py-1 text-sm">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function StatusBadge({
  icon,
  children,
  variant = "default",
}: {
  icon: ReactNode;
  children: ReactNode;
  variant?: "default" | "primary";
}) {
  return (
    <Badge variant={variant}>
      {icon}
      {children}
    </Badge>
  );
}

async function clickPlotActionButton(action: "export") {
  if (action !== "export") return;
  const { getInstanceByDom } = await import("echarts");
  const wrapper = document.getElementById("telemetry-main-plot");
  const chartEl = wrapper?.firstElementChild as HTMLElement | null;
  if (!chartEl) return;
  const instance = getInstanceByDom(chartEl);
  if (!instance) return;
  const url = instance.getDataURL({
    type: "png",
    pixelRatio: 2,
    backgroundColor: "#0d0d0f",
  });
  const a = document.createElement("a");
  a.href = url;
  a.download = "plot.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
