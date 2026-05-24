import { useState, useMemo } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
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
import {
  BrainCircuit,
  Sparkles,
  Activity,
  Fingerprint,
  X,
  ShieldAlert,
  Globe,
  FileCode,
  Terminal,
  ArrowRight,
  Lock,
  Shield,
  CheckCircle,
} from "lucide-react";
import { useSim } from "@/context/SimulationContext";

export const Route = createFileRoute("/ai-detection")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: AIDetectionPage,
  head: () => ({
    meta: [{ title: "AI Detection Engine · VIGILANTIX AI" }],
  }),
});

function AIDetectionPage() {
  const { logs, searchQuery, setSearchQuery, metrics, activeIncident, triggerAttack } = useSim();
  const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);
  const [containmentApplied, setContainmentApplied] = useState(false);
  const [activeTab, setActiveTab] = useState<"forensics" | "vt" | "soar">("forensics");

  const q = searchQuery.toLowerCase().trim();
  const filteredLogs = q
    ? logs.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.srcIp.toLowerCase().includes(q) ||
          l.dstIp.toLowerCase().includes(q) ||
          (l.hash && l.hash.toLowerCase().includes(q))
      )
    : logs;

  const scatter = filteredLogs.slice(0, 80).map((l, i) => ({
    x: i,
    y: l.anomaly,
    z: l.anomaly > 80 ? 200 : l.anomaly > 50 ? 100 : 40,
    source: l.source,
    ip: l.srcIp,
  }));

  const isZeroDay = activeIncident?.title.toLowerCase().includes("zero-day") || activeIncident?.title.toLowerCase().includes("zero_day");
  const isSql = activeIncident?.title.toLowerCase().includes("sql");
  const isDns = activeIncident?.title.toLowerCase().includes("dns");
  const isOauth = activeIncident?.title.toLowerCase().includes("oauth");
  const isAiJailbreak = activeIncident?.title.toLowerCase().includes("indirect");
  const isWiper = activeIncident?.title.toLowerCase().includes("wiper");

  const behaviorAxes = [
    { metric: "Login Pattern", score: isWiper ? 99 : isOauth ? 98 : isSql ? 96 : isZeroDay ? 45 : isDns ? 35 : 78 + (metrics.eventsPerSec % 3) },
    { metric: "Network Flow", score: isWiper ? 99 : isDns ? 94 : isAiJailbreak ? 85 : isZeroDay ? 60 : isSql ? 75 : 88 + (metrics.eventsPerSec % 4) },
    { metric: "Process Tree", score: isWiper ? 99 : isZeroDay ? 95 : isOauth ? 70 : isSql ? 50 : isDns ? 45 : 64 + (metrics.eventsPerSec % 5) },
    { metric: "File I/O", score: isWiper ? 99 : isAiJailbreak ? 92 : isZeroDay ? 90 : isSql ? 65 : isDns ? 50 : 71 + (metrics.eventsPerSec % 3) },
    { metric: "Privilege Δ", score: isWiper ? 99 : isOauth ? 95 : isZeroDay ? 92 : isSql ? 89 : isDns ? 55 : 82 + (metrics.eventsPerSec % 4) },
    { metric: "DNS Entropy", score: isWiper ? 99 : isDns ? 98 : isZeroDay ? 40 : isSql ? 35 : 56 + (metrics.eventsPerSec % 5) },
  ];

  const flagged = filteredLogs.filter((l) => l.anomaly > 60).slice(0, 8);

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
            <BrainCircuit className="h-5 w-5 text-primary animate-flicker" aria-hidden="true" />
            <div className="text-xs">
              <div className="text-muted-foreground">Model</div>
              <div className="font-mono text-foreground">vgx-anomaly-v4.2 · F1 0.974</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { l: "Inference / sec", v: Math.round(metrics.eventsPerSec * 6.74).toLocaleString(), i: Activity, c: "text-accent" },
            { l: "Anomalies Scored", v: (184902 + logs.length * 4).toLocaleString(), i: Sparkles, c: "text-primary" },
            { l: "True Positive Rate", v: activeIncident ? "98.2%" : "97.4%", i: Fingerprint, c: "text-success" },
            { l: "Avg Latency", v: activeIncident ? "14 ms" : "11 ms", i: BrainCircuit, c: "text-warning" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.l}</p>
                <s.i className={`h-4 w-4 ${s.c}`} aria-hidden="true" />
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
                      color: "var(--foreground)",
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
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
                  <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90" aria-hidden="true">
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
                    <span className="rounded bg-muted px-1.5 py-0.5 uppercase text-accent font-semibold">
                      {l.source}
                    </span>
                    <span className="font-mono text-foreground">{l.srcIp}</span>
                    <span className="text-muted-foreground">→ {l.dstIp}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-foreground">{l.message}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAnomaly(l);
                    setContainmentApplied(false);
                    setActiveTab("forensics");
                  }}
                  className="rounded border border-border px-3 py-1 text-xs hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Investigate anomaly from IP ${l.srcIp}`}
                >
                  Investigate
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedAnomaly && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-2xl p-6 relative animate-zoom-in overflow-hidden">
              {/* Glass Header */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90" aria-hidden="true">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="var(--muted)" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={selectedAnomaly.anomaly > 80 ? "var(--destructive)" : "var(--warning)"}
                        strokeWidth="3"
                        strokeDasharray={`${(selectedAnomaly.anomaly / 100) * 88} 88`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold">
                      {selectedAnomaly.anomaly.toFixed(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                      Threat Investigation
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                        {selectedAnomaly.anomaly > 80 ? "CRITICAL RISK" : "SUSPICIOUS"}
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">
                      Target IP: {selectedAnomaly.srcIp} · Source: {selectedAnomaly.source}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-border mt-4">
                {[
                  { id: "forensics", label: "Forensic Metrics", icon: Terminal },
                  { id: "vt", label: "VirusTotal Intel", icon: Globe },
                  { id: "soar", label: "SOAR Remediation", icon: Shield },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 -mb-px transition ${
                      activeTab === t.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="mt-4 min-h-[220px]">
                {activeTab === "forensics" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded bg-muted/30 border border-border p-3">
                        <div className="text-[10px] uppercase text-muted-foreground">Log Severity</div>
                        <div className="font-mono text-sm font-semibold capitalize flex items-center gap-1.5 mt-0.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            selectedAnomaly.severity === "critical" ? "bg-destructive animate-ping" : "bg-warning"
                          }`} />
                          {selectedAnomaly.severity}
                        </div>
                      </div>
                      <div className="rounded bg-muted/30 border border-border p-3">
                        <div className="text-[10px] uppercase text-muted-foreground">Payload Signature</div>
                        <div className="font-mono text-xs font-semibold truncate mt-0.5 font-bold text-accent">
                          {selectedAnomaly.hash ? `sha256:${selectedAnomaly.hash}` : "N/A (Signatureless Anomaly)"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded border border-border bg-card/50 p-3">
                      <div className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                        <FileCode className="h-3 w-3 text-accent" />
                        Decoded Telemetry Payload
                      </div>
                      <pre className="mt-2 font-mono text-[10px] bg-background/85 p-2.5 rounded border border-border overflow-x-auto text-muted-foreground max-h-48 overflow-y-auto">
{`{
  "event_id": "${selectedAnomaly.id}",
  "timestamp": "${new Date(selectedAnomaly.ts).toISOString()}",
  "anomaly_factor": ${selectedAnomaly.anomaly},
  "traffic_vector": {
    "src_ip": "${selectedAnomaly.srcIp}",
    "dst_ip": "${selectedAnomaly.dstIp}",
    "channel": "${selectedAnomaly.source}"
  },
  "payload_message": "${selectedAnomaly.message}"
}`}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === "vt" && (
                  <div className="space-y-4">
                    <div className="rounded border border-border bg-card p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          VirusTotal Reputational Registry
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Dynamic classification check based on multi-engine reputation indices.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-mono font-bold text-destructive">
                          {selectedAnomaly.anomaly > 85 ? "68 / 72" : selectedAnomaly.anomaly > 60 ? "14 / 72" : "0 / 72"}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                          detection ratio
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded border border-border bg-muted/10 p-3 space-y-1">
                        <div className="text-[10px] uppercase text-muted-foreground">Geographic Origin</div>
                        <div className="font-semibold flex items-center gap-1.5 mt-1">
                          <span className="text-foreground font-bold">
                            {selectedAnomaly.srcIp.startsWith("185.220") ? "Russian Federation (RU)" : 
                             selectedAnomaly.srcIp.startsWith("45.83") ? "China (CN)" : "External Workstation (WAN)"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded border border-border bg-muted/10 p-3 space-y-1">
                        <div className="text-[10px] uppercase text-muted-foreground">Threat Tagging</div>
                        <div className="font-semibold text-destructive mt-1">
                          {selectedAnomaly.anomaly > 85 ? "Command-and-Control (C2) / Botnet" : "Scanning / Inbound Probe"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "soar" && (
                  <div className="space-y-4">
                    <div className="rounded border border-border bg-muted/20 p-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-accent" />
                        SOAR Containment Dispatch
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Instantly deploy custom security orchestrations to block ingress points at the Edge Web Gateway.
                      </p>
                    </div>

                    {containmentApplied ? (
                      <div className="rounded border border-success/30 bg-success/5 p-4 flex items-center gap-3 text-success">
                        <CheckCircle className="h-6 w-6 shrink-0 text-success" />
                        <div className="text-xs">
                          <div className="font-bold">Remediation Dispatched Successfully!</div>
                          <div className="mt-0.5 text-success/80 font-mono">
                            Edge WAF rule updated: Banned host {selectedAnomaly.srcIp} indefinitely.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={async () => {
                            const idx = selectedAnomaly.source === "network" ? 0 : 
                                        selectedAnomaly.source === "auth" ? 1 : 
                                        selectedAnomaly.source === "firewall" ? 2 : 3;
                            triggerAttack(idx);
                            setContainmentApplied(true);
                          }}
                          className="w-full flex items-center justify-between rounded border border-accent/30 bg-accent/10 hover:bg-accent/25 px-4 py-3 text-left text-xs text-accent font-semibold transition"
                        >
                          <span className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Trigger Full Containment Playbook
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSearchQuery(selectedAnomaly.srcIp);
                            setSelectedAnomaly(null);
                          }}
                          className="w-full flex items-center justify-between rounded border border-border hover:bg-muted px-4 py-3 text-left text-xs text-foreground transition"
                        >
                          <span className="flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-muted-foreground" />
                            Filter SOC Logs for this Host
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="rounded border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}