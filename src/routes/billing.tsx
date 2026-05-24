import { createFileRoute } from "@tanstack/react-router";
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
  component: BillingPage,
  head: () => ({ meta: [{ title: "Billing & Infrastructure · VIGILANTIX AI" }] }),
});

const usage = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  compute: 60 + Math.round(Math.random() * 30),
  storage: 40 + Math.round(Math.random() * 20),
  egress: 10 + Math.round(Math.random() * 15),
}));

const clusters = [
  { name: "MongoDB Atlas · M40 · us-east-1", health: 99.99, load: 62, type: "doc" },
  { name: "MongoDB Atlas · M30 · eu-west-3", health: 99.93, load: 41, type: "doc" },
  { name: "PostgreSQL · primary · ap-south-1", health: 100, load: 38, type: "sql" },
  { name: "PostgreSQL · replica · us-east-1", health: 99.97, load: 22, type: "sql" },
];

function BillingPage() {
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
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary">
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
              <button className="mt-5 rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-primary">
                Manage Subscription
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-accent" /> Payment Method
            </h3>
            <div className="mt-3 rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              <div className="text-muted-foreground">VISA Corporate</div>
              <div className="mt-1 text-lg tracking-widest">•••• •••• •••• 4290</div>
              <div className="mt-1 text-muted-foreground">Exp 09/28 · Anna L. Vargas</div>
            </div>
            <ul className="mt-3 space-y-1 text-xs">
              {["Invoice PDF auto-dispatch", "PCI-DSS Lvl 1 vault", "PO / NET-30 enabled"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-3 w-3 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { l: "Compute Hours", v: "12,840", sub: "of 18,000", i: Activity },
            { l: "Storage", v: "4.2 TB", sub: "of 10 TB", i: HardDrive },
            { l: "Egress", v: "812 GB", sub: "of 2 TB", i: Cloud },
          ].map((c) => (
            <div key={c.l} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {c.l}
                </span>
                <c.i className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-mono text-2xl font-bold">{c.v}</span>
                <span className="text-xs text-muted-foreground">{c.sub}</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-primary"
                  style={{ width: `${40 + Math.random() * 50}%` }}
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
                    }}
                  />
                  <Area type="monotone" dataKey="compute" stroke="var(--chart-1)" fill="url(#c)" />
                  <Area type="monotone" dataKey="storage" stroke="var(--chart-2)" fill="url(#s)" />
                  <Area type="monotone" dataKey="egress" stroke="var(--chart-3)" fill="none" />
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
                    }}
                  />
                  <Bar dataKey="c" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4 text-accent" /> Database Cluster Health
            </h3>
          </div>
          <div className="divide-y divide-border">
            {clusters.map((c) => (
              <div key={c.name} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    c.type === "doc"
                      ? "bg-primary/15 text-primary"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {c.type === "doc" ? "MongoDB" : "PostgreSQL"}
                </span>
                <span className="flex-1 font-mono text-xs text-foreground">{c.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">load</span>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${
                        c.load > 70 ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${c.load}%` }}
                    />
                  </div>
                  <span className="font-mono">{c.load}%</span>
                </div>
                <span className="font-mono text-xs text-success">{c.health}%</span>
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