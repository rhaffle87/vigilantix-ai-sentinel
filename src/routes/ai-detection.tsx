import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { BrainCircuit, Sparkles, Activity, Fingerprint } from "lucide-react";
import { useSim } from "@/context/SimulationContext";

export const Route = createFileRoute("/ai-detection")({
  component: AIPage,
  head: () => ({
    meta: [{ title: "AI Detection Engine · VIGILANTIX AI" }],
  }),
});

function AIPage() {
  const { logs } = useSim();

  const scatter = logs.slice(0, 80).map((l, i) => ({
    x: i,
    y: l.anomaly,
    z: l.anomaly > 80 ? 200 : l.anomaly > 50 ? 100 : 40,
    source: l.source,
    ip: l.srcIp,
  }));

  const behaviorAxes = [
    { metric: "Login Pattern", score: 78 },
    { metric: "Network Flow", score: 92 },
    { metric: "Process Tree", score: 64 },
    { metric: "File I/O", score: 71 },
    { metric: "Privilege Δ", score: 88 },
    { metric: "DNS Entropy", score: 56 },
  ];

  const flagged = logs.filter((l) => l.anomaly > 60).slice(0, 8);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Layer 3 · Core System</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">AI Detection Engine</h1>
            <p className="text-sm text-muted-foreground">
              Behavior-based ML classifier scoring every event for signatureless threats and zero-day
              indicators.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-card/50 px-4 py-2">
            <BrainCircuit className="h-5 w-5 text-primary animate-flicker" />
            <div className="text-xs">
              <div className="text-muted-foreground">Model</div>
              <div className="font-mono text-foreground">vgx-anomaly-v4.2 · F1 0.974</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { l: "Inference / sec", v: "8,412", i: Activity, c: "text-accent" },
            { l: "Anomalies Scored", v: "184,902", i: Sparkles, c: "text-primary" },
            { l: "True Positive Rate", v: "97.4%", i: Fingerprint, c: "text-success" },
            { l: "Avg Latency", v: "11 ms", i: BrainCircuit, c: "text-warning" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.l}</p>
                <s.i className={`h-4 w-4 ${s.c}`} />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold">Anomaly Score Distribution (live window)</h3>
            <p className="text-xs text-muted-foreground">Each point = scored event · size = severity</p>
            <div className="mt-2 h-72" style={{ background: "var(--card)" }}>
              <ResponsiveContainer>
                <ScatterChart>
                  <CartesianGrid stroke="oklch(0.3 0.04 260 / 50%)" strokeDasharray="3 3" />
                  <XAxis dataKey="x" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis dataKey="y" stroke="var(--muted-foreground)" fontSize={10} domain={[0, 100]} />
                  <ZAxis dataKey="z" range={[40, 250]} />
                  <Tooltip
                    cursor={{ stroke: "var(--accent)", strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Scatter data={scatter} fill="var(--chart-1)" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Threshold @ 85 triggers alert generation</span>
              <span className="font-mono">window: 80 events</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Behavioral Feature Vector</h3>
            <p className="text-xs text-muted-foreground">Avg score per dimension</p>
            <div className="mt-2 h-72" style={{ background: "var(--card)" }}>
              <ResponsiveContainer>
                <RadarChart data={behaviorAxes}>
                  <PolarGrid stroke="oklch(0.3 0.04 260 / 50%)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  />
                  <PolarRadiusAxis stroke="var(--muted-foreground)" fontSize={9} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="var(--chart-2)"
                    fill="var(--chart-2)"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Flagged Behaviors</h3>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              anomaly &gt; 60
            </span>
          </div>
          <div className="divide-y divide-border">
            {flagged.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No active anomalies in window — system nominal.
              </div>
            )}
            {flagged.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-muted/30"
              >
                <div className="relative h-10 w-10 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--muted)" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={l.anomaly > 80 ? "var(--destructive)" : "var(--warning)"}
                      strokeWidth="3"
                      strokeDasharray={`${(l.anomaly / 100) * 88} 88`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold">
                    {l.anomaly.toFixed(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-muted px-1.5 py-0.5 uppercase text-accent">
                      {l.source}
                    </span>
                    <span className="font-mono text-foreground">{l.srcIp}</span>
                    <span className="text-muted-foreground">→ {l.dstIp}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-foreground">{l.message}</p>
                </div>
                <button className="rounded border border-border px-3 py-1 text-xs hover:border-accent hover:text-accent">
                  Investigate
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}