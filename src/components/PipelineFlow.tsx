import { useSim, type PipelineStage } from "@/context/SimulationContext";
import {
  Database,
  Cog,
  BrainCircuit,
  ShieldAlert,
  Workflow,
  Archive,
} from "lucide-react";

const STEPS: { key: PipelineStage; label: string; sub: string; Icon: typeof Database }[] = [
  { key: "collection", label: "Data Collection", sub: "Endpoint · Network · Server", Icon: Database },
  { key: "processing", label: "Data Processing", sub: "Mongo · PostgreSQL", Icon: Cog },
  { key: "analysis", label: "AI Detection", sub: "Behavioral ML Scoring", Icon: BrainCircuit },
  { key: "alert", label: "Alert Generation", sub: "Threshold > 85%", Icon: ShieldAlert },
  { key: "response", label: "SOAR Response", sub: "Containment Playbook", Icon: Workflow },
  { key: "logging", label: "Logging & Audit", sub: "Historical Forensics", Icon: Archive },
];

const ORDER: PipelineStage[] = [
  "idle",
  "collection",
  "processing",
  "analysis",
  "alert",
  "response",
  "logging",
  "complete",
];

export function PipelineFlow() {
  const { stage } = useSim();
  const idx = ORDER.indexOf(stage);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Core System Flow</h3>
          <p className="text-xs text-muted-foreground">
            Ingestion → Detection → Orchestrated Response
          </p>
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-widest ${
            stage === "idle"
              ? "bg-muted text-muted-foreground"
              : stage === "complete"
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive animate-flicker"
          }`}
        >
          {stage}
        </span>
      </div>

      <div className="relative grid grid-cols-2 gap-3 p-5 md:grid-cols-3 lg:grid-cols-6">
        {STEPS.map((step, i) => {
          const sIdx = ORDER.indexOf(step.key);
          const active = stage === step.key;
          const done = idx > sIdx && idx > 0;
          return (
            <div
              key={step.key}
              className={`relative flex flex-col items-start gap-2 rounded-md border p-3 transition ${
                active
                  ? "border-primary bg-primary/10 glow-primary"
                  : done
                    ? "border-success/50 bg-success/5"
                    : "border-border bg-muted/20"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    active
                      ? "bg-primary/30 text-primary"
                      : done
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <step.Icon className="h-4 w-4" />
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">{step.label}</div>
                <div className="text-[10px] text-muted-foreground">{step.sub}</div>
              </div>
              {i < STEPS.length - 1 && (
                <svg
                  className="absolute -right-3 top-1/2 hidden h-2 w-6 -translate-y-1/2 lg:block"
                  viewBox="0 0 24 8"
                >
                  <line
                    x1="0"
                    y1="4"
                    x2="24"
                    y2="4"
                    stroke={active || done ? "var(--accent)" : "var(--border)"}
                    strokeWidth="2"
                    className={active ? "animate-data-flow" : ""}
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}