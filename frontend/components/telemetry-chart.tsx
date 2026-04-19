"use client";

import dynamic from "next/dynamic";
import { AlertCircle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlotDataResponse, UploadResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <PlotSkeleton />,
});

const SERIES_COLORS = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-3)",
  "var(--color-series-4)",
  "var(--color-series-5)",
  "var(--color-series-6)",
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
  const traces = plotData
    ? plotData.y_columns.map((channelName, index) => ({
        x: plotData.x_data,
        y: plotData.series[channelName] ?? [],
        type: "scatter" as const,
        mode: "lines" as const,
        name: channelName,
        line: {
          color: SERIES_COLORS[index % SERIES_COLORS.length],
          width: 2,
        },
        hovertemplate: `<b>${channelName}</b>: %{y:.4f}<br>${plotData.x_column}: %{x:.4f}<extra></extra>`,
      }))
    : [];

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: "var(--color-background-elevated)",
    plot_bgcolor: "var(--color-plot-surface)",
    font: {
      family: "var(--font-body), sans-serif",
      size: 11,
      color: "var(--color-foreground-muted)",
    },
    margin: { t: 14, r: 18, b: 36, l: 44 },
    showlegend: traces.length > 1,
    legend: {
      bgcolor: "var(--color-panel)",
      bordercolor: "var(--color-plot-hover-border)",
      borderwidth: 1,
      font: { size: 11, color: "var(--color-foreground)" },
      x: 0.02,
      y: 0.98,
    },
    xaxis: {
      title: { text: "" },
      gridcolor: "var(--color-plot-grid)",
      linecolor: "var(--color-plot-axis)",
      tickfont: { size: 10, color: "var(--color-plot-tick)" },
      zerolinecolor: "var(--color-plot-grid)",
      showspikes: true,
      spikecolor: "var(--color-plot-spike)",
      spikethickness: 1,
      spikedash: "solid",
    },
    yaxis: {
      title: { text: "" },
      gridcolor: "var(--color-plot-grid)",
      linecolor: "var(--color-plot-axis)",
      tickfont: { size: 10, color: "var(--color-plot-tick)" },
      zerolinecolor: "var(--color-plot-grid)",
    },
    hoverlabel: {
      bgcolor: "var(--color-plot-hover-bg)",
      bordercolor: "var(--color-plot-hover-border)",
      font: {
        size: 11,
        color: "var(--color-foreground)",
        family: "var(--font-body), sans-serif",
      },
    },
  };

  const config: Partial<Plotly.Config> = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      "lasso2d",
      "select2d",
      "toggleSpikelines",
    ] as Plotly.ModeBarDefaultButtons[],
  };

  return (
    <section className="theme-inset-border flex min-h-[38rem] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background-elevated">
      {plotLoading ? (
        <PlotSkeleton />
      ) : plotError ? (
        <PlotError message={plotError} />
      ) : plotData ? (
        <div className="h-full w-full p-4">
          <Plot
            data={traces}
            layout={layout}
            config={config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
            divId="telemetry-main-plot"
          />
        </div>
      ) : (
        <EmptyChartState
          hasDataset={dataset !== null}
          onOpenConfiguration={onOpenConfiguration}
        />
      )}
    </section>
  );
}

function EmptyChartState({
  hasDataset,
  onOpenConfiguration,
}: {
  hasDataset: boolean;
  onOpenConfiguration: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary">
        <Settings2 className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <p className="text-base font-medium text-foreground">
          {hasDataset ? "Generate your first plot" : "Load telemetry data to begin"}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
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
  );
}

function PlotError({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="text-sm font-medium text-destructive">Plot generation failed</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function PlotSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-panel" />
        <div className="h-4 w-20 animate-pulse rounded bg-panel" />
      </div>
      <div className="flex-1 animate-pulse rounded-lg bg-card" />
    </div>
  );
}
