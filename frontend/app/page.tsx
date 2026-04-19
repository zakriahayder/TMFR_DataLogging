"use client";

import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { fetchPlotData, getPorts, connectSerial, uploadCsv } from "@/lib/api";
import { TelemetryChart } from "@/components/telemetry-chart";
import {
  TelemetryConfigurationModal,
  TelemetryTopBar,
} from "@/components/telemetry-toolbar";
import type {
  PlotDataResponse,
  PortInfo,
  SerialStatus,
  UploadResponse,
} from "@/lib/types";

export default function TelemetryPage() {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [serialStatus, setSerialStatus] = useState<SerialStatus | null>(null);
  const [scanningPorts, setScanningPorts] = useState(false);
  const [connectingSerial, setConnectingSerial] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [dataset, setDataset] = useState<UploadResponse | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  const [plotData, setPlotData] = useState<PlotDataResponse | null>(null);
  const [loadingPlot, setLoadingPlot] = useState(false);
  const [plotError, setPlotError] = useState<string | null>(null);

  const [selectedXColumn, setSelectedXColumn] = useState("");
  const [selectedYColumn, setSelectedYColumn] = useState("");
  const [isConfigurationOpen, setIsConfigurationOpen] = useState(true);

  useEffect(() => {
    if (!dataset) {
      setSelectedXColumn("");
      setSelectedYColumn("");
      return;
    }

    const defaultXColumn = dataset.default_x ?? dataset.numeric_columns[0] ?? "";
    const defaultYColumn =
      dataset.numeric_columns.find((column) => column !== defaultXColumn) ?? "";

    setSelectedXColumn(defaultXColumn);
    setSelectedYColumn(defaultYColumn);
  }, [dataset]);

  const availableYColumns = useMemo(() => {
    return dataset?.numeric_columns.filter((column) => column !== selectedXColumn) ?? [];
  }, [dataset, selectedXColumn]);

  useEffect(() => {
    if (!availableYColumns.includes(selectedYColumn)) {
      setSelectedYColumn(availableYColumns[0] ?? "");
    }
  }, [availableYColumns, selectedYColumn]);

  async function handlePortScan() {
    setScanningPorts(true);
    setConnectionError(null);

    try {
      const availablePorts = await getPorts();
      setPorts(availablePorts);

      if (availablePorts.length === 0) {
        toast.info("No serial ports found");
      } else {
        toast.success(
          `Found ${availablePorts.length} port${availablePorts.length === 1 ? "" : "s"}`
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to scan serial ports";
      setConnectionError(message);
      toast.error(message);
    } finally {
      setScanningPorts(false);
    }
  }

  async function handleSerialConnect(port: string, baudrate: number) {
    setConnectingSerial(true);
    setConnectionError(null);

    try {
      const nextSerialStatus = await connectSerial({ port, baudrate });
      setSerialStatus(nextSerialStatus);
      toast.success(`Connected to ${port}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect to serial device";
      setConnectionError(message);
      toast.error(message);
    } finally {
      setConnectingSerial(false);
    }
  }

  async function handleCsvUpload(file: File) {
    setUploadingCsv(true);
    setPlotData(null);
    setPlotError(null);

    try {
      const uploadedDataset = await uploadCsv(file);
      setDataset(uploadedDataset);
      toast.success(`Loaded ${uploadedDataset.filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV upload failed";
      toast.error(message);
    } finally {
      setUploadingCsv(false);
    }
  }

  function handleDatasetClear() {
    setDataset(null);
    setPlotData(null);
    setPlotError(null);
  }

  async function requestPlot(xColumn: string, yColumn: string) {
    if (!dataset || !xColumn || !yColumn) {
      return;
    }

    setLoadingPlot(true);
    setPlotError(null);

    try {
      const nextPlotData = await fetchPlotData({
        filename: dataset.filename,
        x_column: xColumn,
        y_columns: [yColumn],
      });

      setPlotData(nextPlotData);
      setIsConfigurationOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate plot data";
      setPlotError(message);
      toast.error(message);
    } finally {
      setLoadingPlot(false);
    }
  }

  function handleClearWorkspace() {
    handleDatasetClear();
    setIsConfigurationOpen(true);
  }

  async function handleGeneratePlotFromModal() {
    await requestPlot(selectedXColumn, selectedYColumn);
  }

  async function handleXColumnChange(nextXColumn: string) {
    if (!dataset) {
      return;
    }

    const nextYColumn =
      dataset.numeric_columns.find((column) => column !== nextXColumn) ?? "";

    setSelectedXColumn(nextXColumn);
    setSelectedYColumn(nextYColumn);

    if (nextYColumn) {
      await requestPlot(nextXColumn, nextYColumn);
    }
  }

  async function handleYColumnChange(nextYColumn: string) {
    setSelectedYColumn(nextYColumn);
    await requestPlot(selectedXColumn, nextYColumn);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
            fontSize: "13px",
          },
        }}
      />

      <TelemetryTopBar
        dataset={dataset}
        serialStatus={serialStatus}
        selectedXColumn={selectedXColumn}
        selectedYColumn={selectedYColumn}
        availableColumns={dataset?.columns ?? []}
        availableYColumns={availableYColumns}
        plotReady={plotData !== null}
        onChangeXColumn={handleXColumnChange}
        onChangeYColumn={handleYColumnChange}
        onClearWorkspace={handleClearWorkspace}
        onOpenConfiguration={() => setIsConfigurationOpen(true)}
      />

      <main className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <TelemetryChart
          dataset={dataset}
          plotData={plotData}
          plotLoading={loadingPlot}
          plotError={plotError}
          onOpenConfiguration={() => setIsConfigurationOpen(true)}
        />
      </main>

      <TelemetryConfigurationModal
        isOpen={isConfigurationOpen}
        ports={ports}
        serialStatus={serialStatus}
        scanningPorts={scanningPorts}
        connectingSerial={connectingSerial}
        connectionError={connectionError}
        dataset={dataset}
        uploadLoading={uploadingCsv}
        plotLoading={loadingPlot}
        onClose={() => setIsConfigurationOpen(false)}
        onScanPorts={handlePortScan}
        onConnectToSerial={handleSerialConnect}
        onUploadCsv={handleCsvUpload}
        onClearDataset={handleDatasetClear}
        onGeneratePlot={handleGeneratePlotFromModal}
      />
    </div>
  );
}
