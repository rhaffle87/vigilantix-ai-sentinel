import { createFileRoute } from "@tanstack/react-router";
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
import { useSim } from "@/context/SimulationContext";
import { PipelineFlow } from "@/components/PipelineFlow";

export const Route = createFileRoute("/")({
  component: Index,
});

const CHART_BG = "var(--card)";
const GRID = "oklch(0.3 0.04 260 / 50%)";

function Index() {
  const { metrics, series, logs, incidents } = useSim();

  const threatMix = [
    { name: "Brute Force", value: 32, color: "var(--chart-1)" },
    { name: "Malware", value: 24, color: "var(--chart-2)" },
    { name: "Phishing", value: 18, color: "var(--chart-3)" },
    { name: "Zero-Day", value: 9, color: "var(--chart-4)" },
    { name: "Other", value: 17, color: "var(--chart-5)" },
  ];

  const stats = [
    {
      label: "Events / sec",
      value: metrics.eventsPerSec.toLocaleString(),
      icon: Activity,
      delta: "+12.4%",
      up: true,
      color: "text-accent",
    },
    {
      label: "Critical Alerts (24h)",
      value: metrics.alertsToday,
      icon: ShieldAlert,
      delta: "-4.2%",
      up: false,
      color: "text-warning",
    },
    {
      label: "Blocked Threat Actors",
      value: metrics.blockedIps.toLocaleString(),
      icon: Ban,
      delta: "+22",
      up: true,
      color: "text-destructive",
    },
    {
      label: "Mean Time to Respond",
      value: `${metrics.meanResponseSec}s`,
      icon: Timer,
      delta: "-9s",
      up: true,
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
          <div className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-3 py-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-success animate-flicker" />
            <span className="text-muted-foreground">Cluster:</span>
            <span className="font-mono text-accent">us-east-1 · eu-west-3 · ap-south-1</span>
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
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                {s.up ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
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
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Event Volume & Anomaly Curve</h3>
                <p className="text-xs text-muted-foreground">Trailing 24h, 5-min bins</p>
              </div>
              <div className="flex gap-3 text-[10px] uppercase tracking-widest">
                <Legend dotClass="bg-primary" label="Events" />
                <Legend dotClass="bg-accent" label="Anomalies" />
                <Legend dotClass="bg-destructive" label="Blocked" />
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
                    }}
                  />
                  <Area type="monotone" dataKey="events" stroke="var(--chart-1)" fill="url(#ev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="anomalies" stroke="var(--chart-2)" fill="url(#an)" strokeWidth={2} />
                  <Area type="monotone" dataKey="blocked" stroke="var(--chart-4)" fill="none" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                    }}
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

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Globe2 className="h-4 w-4 text-accent" /> Geographic Threat Origin
            </h3>
            <div className="h-44" style={{ background: CHART_BG }}>
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { c: "RU", v: 412 },
                    { c: "CN", v: 358 },
                    { c: "BR", v: 211 },
                    { c: "IR", v: 188 },
                    { c: "KP", v: 142 },
                    { c: "US", v: 96 },
                  ]}
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="c" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="v" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-accent" /> Asset Health
            </h3>
            <ul className="space-y-2 text-xs">
              {[
                { n: "Edge Firewall Cluster", v: 99.98, s: "ok" },
                { n: "Kafka Ingest Stream", v: 99.91, s: "ok" },
                { n: "ML Inference Pool", v: 98.74, s: "warn" },
                { n: "MongoDB Atlas (M40)", v: 99.99, s: "ok" },
                { n: "PostgreSQL Primary", v: 100, s: "ok" },
                { n: "SOAR Worker Pool", v: 97.12, s: "warn" },
              ].map((row) => (
                <li key={row.n} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      row.s === "ok" ? "bg-success" : "bg-warning animate-flicker"
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
              <Cpu className="h-4 w-4 text-accent" /> Recent Incidents
            </h3>
            <ul className="space-y-2">
              {incidents.slice(0, 5).map((i) => (
                <li key={i.id} className="rounded border border-border bg-muted/30 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-accent">{i.id}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                        i.status === "resolved"
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
          <div className="max-h-72 overflow-auto font-mono text-[11px]">
            {logs.slice(0, 25).map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-12 gap-2 border-b border-border/40 px-4 py-1.5 hover:bg-muted/30"
              >
                <span className="col-span-2 text-muted-foreground">
                  {new Date(l.ts).toLocaleTimeString()}
                </span>
                <span className="col-span-1 uppercase text-accent">{l.source}</span>
                <span className="col-span-2 text-foreground">{l.srcIp}</span>
                <span className="col-span-1 text-muted-foreground">→</span>
                <span className="col-span-2 text-foreground">{l.dstIp}</span>
                <span className="col-span-3 truncate text-muted-foreground">{l.message}</span>
                <span
                  className={`col-span-1 text-right ${
                    l.anomaly > 80
                      ? "text-destructive"
                      : l.anomaly > 50
                        ? "text-warning"
                        : "text-success"
                  }`}
                >
                  {l.anomaly.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
