"use client";

import dynamic from "next/dynamic";
import { AlertCircle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlotDataResponse, UploadResponse } from "@/lib/types";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <PlotSkeleton />,
});

const SERIES_COLORS = [
  "#2196f3",
  "#bbdefb",
  "#ffeb3b",
  "#f44336",
  "#d7dde5",
  "#b5bdc8",
];

interface TelemetryChartProps {
  dataset: UploadResponse | null;
  plotData: PlotDataResponse | null;
  plotLoading: boolean;
  plotError: string | null;
  onOpenConfiguration: () => void;
}

export function TelemetryChart({
  dataset,
  plotData,
  plotLoading,
  plotError,
  onOpenConfiguration,
}: TelemetryChartProps) {
  return (
    <section className="theme-inset-border flex min-h-[38rem] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background-elevated">
      <div className="relative flex min-h-0 flex-1">
        {plotLoading ? (
          <PlotSkeleton />
        ) : plotError ? (
          <PlotError message={plotError} />
        ) : plotData ? (
          <div id="telemetry-main-plot" className="absolute inset-0">
            <ReactECharts
              option={buildOption(plotData)}
              notMerge
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          </div>
        ) : (
          <EmptyChartState
            hasDataset={dataset !== null}
            onOpenConfiguration={onOpenConfiguration}
          />
        )}
      </div>
    </section>
  );
}

function buildOption(plotData: PlotDataResponse): object {
  const multi = plotData.y_columns.length > 1;

  return {
    backgroundColor: "#0a0b0d",
    animation: false,
    grid: {
      left: 54,
      right: 24,
      top: multi ? 44 : 20,
      bottom: 46,
      containLabel: false,
    },
    legend: multi
      ? {
          show: true,
          top: 10,
          right: 24,
          icon: "roundRect",
          itemWidth: 16,
          itemHeight: 4,
          textStyle: { color: "#b5bdc8", fontSize: 11 },
          inactiveColor: "#454b55",
        }
      : { show: false },
    xAxis: {
      type: "value",
      name: plotData.x_column,
      nameLocation: "middle",
      nameGap: 28,
      nameTextStyle: { color: "#8f98a3", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(215,221,229,0.10)" } },
      axisTick: { lineStyle: { color: "rgba(215,221,229,0.10)" } },
      axisLabel: { color: "#8f98a3", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(215,221,229,0.04)", type: "solid" } },
      minorSplitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#8f98a3", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(215,221,229,0.04)", type: "solid" } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(14,15,17,0.96)",
      borderColor: "rgba(183,189,200,0.16)",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#d7dde5", fontSize: 11 },
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "rgba(14,15,17,0.9)",
          borderColor: "rgba(183,189,200,0.16)",
          borderWidth: 1,
          color: "#8f98a3",
          fontSize: 10,
          padding: [4, 8],
          precision: 4,
        },
        crossStyle: { color: "rgba(255,235,59,0.45)", width: 1 },
        lineStyle: { color: "rgba(255,235,59,0.45)", width: 1, type: "solid" },
      },
    },
    dataZoom: [
      { type: "inside", filterMode: "none", zoomOnMouseWheel: true, moveOnMouseMove: true },
    ],
    series: plotData.y_columns.map((col, i) => ({
      name: col,
      type: "line",
      data: plotData.x_data.map((x, j) => [x, plotData.series[col]?.[j] ?? null]),
      lineStyle: {
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        width: 1.5,
      },
      itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] },
      emphasis: { disabled: true },
      symbol: "none",
      sampling: "lttb",
      large: true,
      largeThreshold: 5000,
    })),
  };
}

function EmptyChartState({
  hasDataset,
  onOpenConfiguration,
}: {
  hasDataset: boolean;
  onOpenConfiguration: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-8">
      <div className="theme-panel-shadow theme-inset-border flex w-full max-w-lg flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-[color:rgb(10_11_13_/_0.94)] px-8 py-10 text-center backdrop-blur-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary">
          <Settings2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-medium text-foreground">
            {hasDataset ? "Generate your first plot" : "Load telemetry data to begin"}
          </p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {hasDataset
              ? "Open settings to adjust the data source or generate the plot from the current CSV."
              : "Open the configuration panel to connect serial hardware or upload a CSV log file."}
          </p>
        </div>
        <Button type="button" onClick={onOpenConfiguration}>
          <Settings2 className="h-4 w-4" />
          Open Settings
        </Button>
      </div>
    </div>
  );
}

function PlotError({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-8">
      <div className="theme-panel-shadow theme-inset-border flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/30 bg-[color:rgb(10_11_13_/_0.94)] px-8 py-10 text-center backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-sm font-medium text-destructive">Plot generation failed</p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

function PlotSkeleton() {
  return (
    <div className="flex h-full w-full flex-1 flex-col gap-4 p-3 sm:p-4">
      <div className="flex gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-panel" />
        <div className="h-4 w-20 animate-pulse rounded bg-panel" />
      </div>
      <div className="flex-1 animate-pulse rounded-lg bg-card" />
    </div>
  );
}
