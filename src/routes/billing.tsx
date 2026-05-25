import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useSim, CORPORATE_NET } from "@/context/SimulationContext";
import { useMounted } from "@/hooks/use-mounted";
import {
  CreditCard,
  Cloud,
  Database,
  HardDrive,
  Activity,
  Check,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/billing")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: BillingPage,
  head: () => ({ meta: [{ title: "Billing & Cloud Infrastructure · VIGILANTIX AI" }] }),
});

function BillingPage() {
  const { activeIncident, metrics } = useSim();
  const mounted = useMounted();

  const isSql = activeIncident?.title.toLowerCase().includes("sql");
  const isDns = activeIncident?.title.toLowerCase().includes("dns");
  const isZeroDay = activeIncident?.title.toLowerCase().includes("zero-day");

  const usage = Array.from({ length: 14 }, (_, i) => {
    const isLastDay = i >= 12;
    let computeBoost = 0;
    let egressBoost = 0;
    if (isLastDay) {
      if (isZeroDay) computeBoost = 35;
      if (isSql) computeBoost = 22;
      if (isDns) egressBoost = 48;
    }
    return {
      d: `D${i + 1}`,
      compute: Math.min(100, 60 + ((i * 7 + 13) % 30) + computeBoost),
      storage: 40 + ((i * 3 + 7) % 20),
      egress: Math.min(100, 10 + ((i * 5 + 3) % 15) + egressBoost),
    };
  });

  const clusters = [
    {
      name: `Core Ingress API Gateway (${CORPORATE_NET.apiGateway}) · us-east-1`,
      health: isZeroDay ? 94.2 : 99.99,
      load: isZeroDay ? 91 : 62,
      type: "gateway",
    },
    {
      name: `Primary DB Cluster (${CORPORATE_NET.database}) · ap-south-1`,
      health: isSql ? 88.5 : 100,
      load: isSql ? 96 : 38,
      type: "sql",
    },
    {
      name: `Active Directory DS (${CORPORATE_NET.domainController}) · us-east-1`,
      health: isSql || isZeroDay ? 98.4 : 99.97,
      load: isSql || isZeroDay ? 74 : 22,
      type: "ad",
    },
    {
      name: `Recursive DNS Resolver (${CORPORATE_NET.dnsResolver}) · ap-south-1`,
      health: isDns ? 91.8 : 99.93,
      load: isDns ? 89 : 41,
      type: "dns",
    },
  ];

  const dynamicCompute = 12840 + Math.floor((metrics?.eventsPerSec || 1200) * 0.05) + (isZeroDay ? 850 : isSql ? 450 : 0);
  const dynamicStorage = 4.2 + ((metrics?.eventsPerSec || 1200) * 0.0001);
  const dynamicEgress = 812 + Math.floor((metrics?.eventsPerSec || 1200) * 0.02) + (isDns ? 430 : 0);

  const dynamicComputePct = `${(dynamicCompute / 18000 * 100).toFixed(1)}%`;
  const dynamicStoragePct = `${(dynamicStorage / 10 * 100).toFixed(1)}%`;
  const dynamicEgressPct = `${(dynamicEgress / 2048 * 100).toFixed(1)}%`;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Layer 0 · Platform</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Billing & Cloud Infrastructure</h1>
          <p className="text-sm text-muted-foreground">
            Subscription, multi-cloud resource consumption, and database cluster health.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary font-semibold">
                  Enterprise · ELITE
                </span>
                <span className="text-[10px] uppercase tracking-widest text-success">
                  Renews in 287 days
                </span>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-mono text-5xl font-bold">$4,200</span>
                <span className="mb-1 text-sm text-muted-foreground">/ month · billed annually</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Mini label="Seats" value="84 / 120" />
                <Mini label="Endpoints" value="12,480" />
                <Mini label="Retention" value="365 days" />
                <Mini label="SLA" value="99.99%" />
              </div>
              <button className="mt-5 rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                Manage Subscription
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-accent" aria-hidden="true" /> Payment Method
            </h3>
            <div className="mt-3 rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              <div className="text-muted-foreground">VISA Corporate</div>
              <div className="mt-1 text-lg tracking-widest">•••• •••• •••• 4290</div>
              <div className="mt-1 text-muted-foreground">Exp 09/28 · Rafli A. I. Hartono</div>
            </div>
            <ul className="mt-3 space-y-1 text-xs">
              {["Invoice PDF auto-dispatch", "PCI-DSS Lvl 1 vault", "PO / NET-30 enabled"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-3 w-3 text-success" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { l: "Compute Hours", v: dynamicCompute.toLocaleString(), sub: "of 18,000", pct: dynamicComputePct, i: Activity },
            { l: "Storage", v: `${dynamicStorage.toFixed(2)} TB`, sub: "of 10 TB", pct: dynamicStoragePct, i: HardDrive },
            { l: "Egress", v: `${dynamicEgress.toLocaleString()} GB`, sub: "of 2 TB", pct: dynamicEgressPct, i: Cloud },
          ].map((c) => (
            <div key={c.l} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {c.l}
                </span>
                <c.i className="h-4 w-4 text-accent" aria-hidden="true" />
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-mono text-2xl font-bold">{c.v}</span>
                <span className="text-xs text-muted-foreground">{c.sub}</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-primary"
                  style={{ width: c.pct }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">14-Day Resource Consumption (AWS · GCP)</h3>
            <div className="mt-2 h-64" style={{ background: "var(--card)" }}>
              <ResponsiveContainer>
                <AreaChart data={usage}>
                  <defs>
                    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.3 0.04 260 / 50%)" strokeDasharray="3 3" />
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} />
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
                  <Area type="monotone" dataKey="compute" stroke="var(--chart-1)" fill="url(#c)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="storage" stroke="var(--chart-2)" fill="url(#s)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="egress" stroke="var(--chart-3)" fill="none" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Cost Allocation by Service</h3>
            <div className="mt-2 h-64" style={{ background: "var(--card)" }}>
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { s: "ML Inference", c: 1240 },
                    { s: "Kafka", c: 820 },
                    { s: "Mongo", c: 640 },
                    { s: "PG", c: 410 },
                    { s: "Egress", c: 290 },
                    { s: "Misc", c: 180 },
                  ]}
                >
                  <CartesianGrid stroke="oklch(0.3 0.04 260 / 50%)" strokeDasharray="3 3" />
                  <XAxis dataKey="s" stroke="var(--muted-foreground)" fontSize={10} />
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
                  <Bar dataKey="c" fill="var(--chart-1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4 text-accent" aria-hidden="true" /> Database Cluster Health
            </h3>
          </div>
          <div className="divide-y divide-border">
            {clusters.map((c) => (
              <div key={c.name} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-widest ${c.type === "gateway"
                      ? "bg-primary/15 text-primary font-semibold"
                      : c.type === "sql"
                        ? "bg-accent/15 text-accent font-semibold"
                        : c.type === "ad"
                          ? "bg-success/15 text-success font-semibold"
                          : "bg-warning/15 text-warning font-semibold"
                    }`}
                >
                  {c.type === "gateway"
                    ? "Nginx"
                    : c.type === "sql"
                      ? "PostgreSQL"
                      : c.type === "ad"
                        ? "AD DS"
                        : "CoreDNS"}
                </span>
                <span className="flex-1 font-mono text-xs text-foreground">{c.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">load</span>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${c.load > 90
                          ? "bg-destructive animate-flicker"
                          : c.load > 70
                            ? "bg-warning"
                            : "bg-success"
                        }`}
                      style={{ width: `${c.load}%` }}
                    />
                  </div>
                  <span className="font-mono">{c.load}%</span>
                </div>
                <span
                  className={`font-mono text-xs ${c.health < 90
                      ? "text-destructive font-semibold"
                      : c.health < 95
                        ? "text-warning font-semibold"
                        : "text-success"
                    }`}
                >
                  {c.health}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}