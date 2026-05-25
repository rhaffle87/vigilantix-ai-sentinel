import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  ShieldAlert,
  Ban,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  Globe2,
  Server,
  Cpu,
  Shield,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { useSim, CORPORATE_NET } from "@/context/SimulationContext";
import { PipelineFlow } from "@/components/PipelineFlow";
import { useMounted } from "@/hooks/use-mounted";
import { NetworkTopology } from "@/components/NetworkTopology";
import { AICisoAssistant } from "@/components/AICisoAssistant";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: IndexPage,
  head: () => ({
    meta: [{ title: "Operational Intelligence Hub · VIGILANTIX AI" }],
  }),
});

const CHART_BG = "var(--card)";
const GRID = "oklch(0.3 0.04 260 / 50%)";

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
};

function IndexPage() {
  const { metrics, series, logs: allLogs, incidents, activeIncident, searchQuery, clusters, complianceScore } = useSim();
  const mounted = useMounted();

  const q = searchQuery.toLowerCase().trim();
  const logs = useMemo(() => {
    return q
      ? allLogs.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.srcIp.toLowerCase().includes(q) ||
          l.dstIp.toLowerCase().includes(q) ||
          (l.hash && l.hash.toLowerCase().includes(q))
      )
      : allLogs;
  }, [allLogs, q]);

  const filteredIncidents = useMemo(() => {
    return q
      ? incidents.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.srcIp.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      )
      : incidents;
  }, [incidents, q]);

  const { threatMix, geoData, assets } = useMemo(() => {
    const totalLogs = logs.length || 1;
    const bruteForceCount = logs.filter((l) => l.source === "auth" || l.message.toLowerCase().includes("brute")).length;
    const malwareCount = logs.filter((l) => l.source === "endpoint").length;
    const networkCount = logs.filter((l) => l.source === "network").length;
    const zeroDayCount = logs.filter((l) => l.anomaly > 80).length;
    const otherCount = Math.max(0, totalLogs - (bruteForceCount + malwareCount + networkCount + zeroDayCount));

    const mix = [
      { name: "Brute Force", value: Math.round((bruteForceCount / totalLogs) * 100), color: "var(--chart-1)" },
      { name: "Malware", value: Math.round((malwareCount / totalLogs) * 100), color: "var(--chart-2)" },
      { name: "Phishing/Ingress", value: Math.round((networkCount / totalLogs) * 100), color: "var(--chart-3)" },
      { name: "Zero-Day", value: Math.round((zeroDayCount / totalLogs) * 100), color: "var(--chart-4)" },
      { name: "Other Telemetry", value: Math.round((otherCount / totalLogs) * 100), color: "var(--chart-5)" },
    ];

    const countries = ["RU", "CN", "BR", "IR", "KP", "US"];
    const geo = countries.map((c, idx) => {
      const matchingLogs = logs.filter((l) => {
        const charSum = l.srcIp.split(".").reduce((acc, part) => acc + (parseInt(part, 10) || 0), 0);
        return charSum % countries.length === idx;
      });
      return { c, v: matchingLogs.length * 8 + 4 };
    });

    const isWiper = activeIncident?.title.toLowerCase().includes("wiper");
    const getAssetHealth = (source: string, base: number) => {
      if (isWiper) {
        return Number((11.45 + Math.random() * 4.5).toFixed(2));
      }
      const sourceLogs = logs.filter((l) => l.source === source);
      if (sourceLogs.length === 0) return base;
      const avgAnomaly = sourceLogs.reduce((acc, l) => acc + l.anomaly, 0) / sourceLogs.length;
      const health = Math.max(80, 100 - avgAnomaly * 0.15);
      return Number(health.toFixed(2));
    };

    const asts = [
      { n: `Edge Web Gateway (${CORPORATE_NET.apiGateway})`, v: getAssetHealth("server", 99.99), s: isWiper ? "fail" : getAssetHealth("server", 99.99) > 95 ? "ok" : "warn" },
      { n: `Primary DB Cluster (${CORPORATE_NET.database})`, v: getAssetHealth("auth", 99.99), s: isWiper ? "fail" : getAssetHealth("auth", 99.99) > 95 ? "ok" : "warn" },
      { n: `Active Directory DS (${CORPORATE_NET.domainController})`, v: getAssetHealth("endpoint", 98.74), s: isWiper ? "fail" : getAssetHealth("endpoint", 98.74) > 95 ? "ok" : "warn" },
      { n: `Recursive DNS Resolver (${CORPORATE_NET.dnsResolver})`, v: getAssetHealth("network", 99.91), s: isWiper ? "fail" : getAssetHealth("network", 99.91) > 95 ? "ok" : "warn" },
      { n: "SOAR Worker Pool (Local)", v: isWiper ? 2.10 : activeIncident ? 92.45 : 99.12, s: isWiper ? "fail" : activeIncident ? "warn" : "ok" },
    ];

    return { threatMix: mix, geoData: geo, assets: asts };
  }, [logs, activeIncident]);

  // Dynamic card deltas calculated relative to operational baselines
  const epsDeltaPercent = ((metrics.eventsPerSec - 1100) / 1100) * 100;
  const epsDeltaStr = `${epsDeltaPercent >= 0 ? "+" : ""}${epsDeltaPercent.toFixed(1)}%`;

  const alertsDeltaCount = metrics.alertsToday - 3;
  const alertsDeltaStr = alertsDeltaCount === 0 ? "0%" : `${alertsDeltaCount > 0 ? "+" : ""}${alertsDeltaCount}`;

  const blockedDeltaCount = metrics.blockedIps - 142;
  const blockedDeltaStr = `${blockedDeltaCount >= 0 ? "+" : ""}${blockedDeltaCount}`;

  const mttrDeltaCount = metrics.meanResponseSec - 45;
  const mttrDeltaStr = `${mttrDeltaCount < 0 ? "" : "+"}${mttrDeltaCount}s`;

  const stats = [
    {
      label: "Events / sec",
      value: mounted ? metrics.eventsPerSec.toLocaleString() : "...",
      icon: Activity,
      delta: epsDeltaStr,
      up: epsDeltaPercent >= 0,
      color: "text-accent",
    },
    {
      label: "Critical Alerts (24h)",
      value: metrics.alertsToday.toString(),
      icon: ShieldAlert,
      delta: alertsDeltaStr,
      up: alertsDeltaCount <= 0,
      color: "text-warning",
    },
    {
      label: "Blocked Threat Actors",
      value: mounted ? metrics.blockedIps.toLocaleString() : "...",
      icon: Ban,
      delta: blockedDeltaStr,
      up: blockedDeltaCount >= 0,
      color: "text-destructive",
    },
    {
      label: "Mean Time to Respond",
      value: `${metrics.meanResponseSec}s`,
      icon: Timer,
      delta: mttrDeltaStr,
      up: mttrDeltaCount <= 0,
      color: "text-success",
    },
  ];

  return (
    <div className="grid-bg min-h-full p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">SOC Command Center</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Operational Intelligence Hub</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Realtime telemetry, AI anomaly scoring, and orchestrated response across the enterprise estate.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/50 px-3 py-2 text-xs w-full sm:w-auto">
            <span className="text-muted-foreground font-medium whitespace-nowrap">Clusters:</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center">
              {mounted && clusters.map((c) => (
                <div key={c.region} className="flex items-center gap-1.5 whitespace-nowrap" title={`${c.name} - Latency: ${c.latency}ms`}>
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${c.status === "online"
                      ? "bg-success animate-pulse"
                      : c.status === "degraded"
                        ? "bg-warning animate-flicker"
                        : "bg-destructive"
                      }`}
                  />
                  <span className="font-mono text-muted-foreground">{c.region}</span>
                  <span className={`font-mono text-[10px] ${c.status === "degraded" ? "text-warning font-semibold" : "text-accent"}`}>
                    {c.latency}ms
                  </span>
                </div>
              ))}
              {!mounted && (
                <span className="font-mono text-muted-foreground whitespace-nowrap">Loading clusters...</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:glow-primary"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-2 font-mono text-3xl font-bold text-foreground">{s.value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-md bg-muted ${s.color}`}>
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                {s.up ? (
                  <ArrowUpRight className="h-3 w-3 text-success" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" aria-hidden="true" />
                )}
                <span className={s.up ? "text-success" : "text-destructive"}>{s.delta}</span>
                <span className="text-muted-foreground">vs prev. cycle</span>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-primary opacity-40" />
            </div>
          ))}
        </div>

        <PipelineFlow />

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left Column: Interactive Topology & Trailing Curve */}
          <div className="lg:col-span-2 space-y-4">
            <NetworkTopology />

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Event Volume & Anomaly Curve</h3>
                  <p className="text-xs text-muted-foreground">Trailing 24h, 5-min bins</p>
                </div>
                <div className="flex gap-3 text-[10px] uppercase tracking-widest">
                  <Legend dotClass="bg-chart-1" label="Events" />
                  <Legend dotClass="bg-chart-2" label="Anomalies" />
                  <Legend dotClass="bg-chart-4" label="Blocked" />
                </div>
              </div>
              <div className="h-64 w-full" style={{ background: CHART_BG }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="ev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="an" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={10} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--foreground)",
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                    />
                    <Area type="monotone" dataKey="events" stroke="var(--chart-1)" fill="url(#ev)" strokeWidth={2} isAnimationActive={false} />
                    <Area type="monotone" dataKey="anomalies" stroke="var(--chart-2)" fill="url(#an)" strokeWidth={2} isAnimationActive={false} />
                    <Area type="monotone" dataKey="blocked" stroke="var(--chart-4)" fill="none" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Compliance Auditor & Threat Distribution */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 text-accent" /> Regulatory Compliance Auditor
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Real-time ISO 27001 & SOC 2 audit readiness</p>

              <div className="flex items-center justify-between bg-muted/30 border border-border/80 rounded-xl p-3 mb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
                    {mounted ? `${complianceScore.toFixed(1)}%` : "..."}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Enterprise Score</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-semibold uppercase ${complianceScore > 85
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : complianceScore > 60
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {complianceScore > 85 ? "Optimal" : complianceScore > 60 ? "Degraded" : "Breached"}
                </div>
              </div>

              {activeIncident && (
                <div className="space-y-2 border-t border-border/40 pt-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 uppercase font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Security Controls Influx
                  </div>
                  <ul className="space-y-1.5 font-mono text-[10px] text-muted-foreground">
                    {complianceScore < 40 && (
                      <li className="flex items-center justify-between border-b border-border/20 pb-1">
                        <span>ISO A.12.6.1 Wiper Takeover</span>
                        <span className="text-red-400 font-bold animate-pulse">CRITICAL FAIL</span>
                      </li>
                    )}
                    {complianceScore < 65 && (
                      <li className="flex items-center justify-between border-b border-border/20 pb-1">
                        <span>SOC 2 CC6.3 Boundary Isolation</span>
                        <span className="text-red-400 font-bold">FAIL</span>
                      </li>
                    )}
                    <li className="flex items-center justify-between border-b border-border/20 pb-1">
                      <span>SOC 2 CC6.1 Perimeter Intrusion</span>
                      <span className="text-red-400 font-bold">BYPASSED</span>
                    </li>
                    <li className="flex items-center justify-between pb-0.5">
                      <span>ISO A.14.1.1 Transit Encryption</span>
                      <span className="text-amber-400 font-bold">AUDITING</span>
                    </li>
                  </ul>
                </div>
              )}
              {!activeIncident && (
                <div className="text-[10px] font-mono text-emerald-400/90 leading-relaxed pt-1.5">
                  ✓ Enterprise operational security compliance maps successfully inside all ISO 27001:2022 & SOC 2 Type II assurance gates.
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Threat Vector Distribution</h3>
              <p className="text-xs text-muted-foreground">Active classifications</p>
              <div className="mt-2 h-48" style={{ background: CHART_BG }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={threatMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      stroke="var(--card)"
                      isAnimationActive={false}
                    >
                      {threatMix.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--foreground)",
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {threatMix.map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                      <span className="text-muted-foreground">{t.name}</span>
                    </div>
                    <span className="font-mono">{t.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Globe2 className="h-4 w-4 text-accent" aria-hidden="true" /> Geographic Threat Origin
            </h3>
            <div className="h-44" style={{ background: CHART_BG }}>
              <ResponsiveContainer>
                <BarChart data={geoData}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="c" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "var(--foreground)",
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="v" fill="var(--chart-4)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-accent" aria-hidden="true" /> Asset Health
            </h3>
            <ul className="space-y-2 text-xs">
              {assets.map((row) => (
                <li key={row.n} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${row.s === "fail"
                      ? "bg-destructive animate-pulse scale-125 shadow-destructive"
                      : row.s === "ok"
                        ? "bg-success"
                        : "bg-warning animate-flicker"
                      }`}
                  />
                  <span className="flex-1 text-muted-foreground">{row.n}</span>
                  <span className="font-mono text-foreground">{row.v}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Cpu className="h-4 w-4 text-accent" aria-hidden="true" /> Recent Incidents
            </h3>
            <ul className="space-y-2">
              {filteredIncidents.slice(0, 2).map((i) => (
                <li key={i.id} className="rounded border border-border bg-muted/30 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-accent">{i.id}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${i.status === "resolved"
                        ? "bg-success/15 text-success"
                        : "bg-warning/15 text-warning"
                        }`}
                    >
                      {i.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-foreground">{i.title}</div>
                  <div className="mt-0.5 text-muted-foreground">
                    src <span className="font-mono">{i.srcIp}</span> · anomaly{" "}
                    <span className="text-destructive">{i.anomaly.toFixed(0)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Live Log Tail</h3>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Streaming · {logs.length} buffered
            </span>
          </div>
          <div className="w-full overflow-x-auto scrollbar-thin">
            <div className="min-w-[750px]">
              <div className="grid grid-cols-12 gap-2 bg-muted/20 border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="col-span-2">Timestamp</span>
                <span className="col-span-1">Source</span>
                <span className="col-span-2">Source IP</span>
                <span className="col-span-1 text-center">→</span>
                <span className="col-span-2">Dest IP</span>
                <span className="col-span-3">Event Message</span>
                <span className="col-span-1 text-right">Anomaly</span>
              </div>
              <div className="max-h-72 overflow-y-auto font-mono text-[11px]">
                {logs.slice(0, 25).map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-12 gap-2 border-b border-border/40 px-4 py-1.5 hover:bg-muted/30"
                  >
                    <span className="col-span-2 text-muted-foreground">
                      {mounted ? formatTime(l.ts) : "--:--:--"}
                    </span>
                    <span className="col-span-1 uppercase text-accent">{l.source}</span>
                    <span className="col-span-2 text-foreground">{l.srcIp}</span>
                    <span className="col-span-1 text-muted-foreground">→</span>
                    <span className="col-span-2 text-foreground">{l.dstIp}</span>
                    <span className="col-span-3 truncate text-muted-foreground">{l.message}</span>
                    <span
                      className={`col-span-1 text-right ${l.anomaly > 80
                        ? "text-destructive"
                        : l.anomaly > 50
                          ? "text-warning"
                          : "text-success"
                        }`}
                    >
                      {l.anomaly.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic scanlines & vignette threat warnings when subnets are active under threat */}
      {activeIncident && (
        <div className="pointer-events-none fixed inset-0 z-30 border-[6px] border-red-500/20 bg-red-950/[0.02] animate-pulse">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] opacity-10" />
        </div>
      )}

      {/* Floating Virtual CISO Assistant Chatbot */}
      <AICisoAssistant />
    </div>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
