import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Download, Database, Wifi, ServerCog } from "lucide-react";
import { useSim } from "@/context/SimulationContext";

export const Route = createFileRoute("/logs")({
  component: LogsPage,
  head: () => ({
    meta: [{ title: "Data Collector & Logs · VIGILANTIX AI" }],
  }),
});

function LogsPage() {
  const { logs, metrics } = useSim();
  const [filter, setFilter] = useState<string>("all");

  const sources = ["all", "endpoint", "network", "server", "firewall", "auth"];
  const filtered = filter === "all" ? logs : logs.filter((l) => l.source === filter);

  const collectors = [
    { name: "Endpoint EDR Agents", icon: ServerCog, count: 1284, eps: 412 },
    { name: "Network Taps / NIDS", icon: Wifi, count: 36, eps: 682 },
    { name: "Server Syslog Forwarders", icon: Database, count: 214, eps: 254 },
  ];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Layer 1 · Ingestion</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Data Collectors & Raw Logs</h1>
          <p className="text-sm text-muted-foreground">
            Live streams from distributed endpoint, network and server collectors flowing into the
            ingest pipeline.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {collectors.map((c) => (
            <div
              key={c.name}
              className="rounded-lg border border-border bg-card p-4 transition hover:border-accent/60"
            >
              <div className="flex items-center justify-between">
                <c.icon className="h-5 w-5 text-accent" />
                <span className="text-[10px] uppercase tracking-widest text-success">online</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{c.name}</h3>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Agents</p>
                  <p className="font-mono text-xl font-bold">{c.count.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Events / sec</p>
                  <p className="font-mono text-xl font-bold text-accent">{c.eps}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Source
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {sources.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded px-2 py-1 text-xs uppercase tracking-wider transition ${
                    filter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-accent">{metrics.eventsPerSec.toLocaleString()}</span>
              ev/s ingest
              <button className="ml-3 flex items-center gap-1 rounded border border-border px-2 py-1 hover:border-accent">
                <Download className="h-3 w-3" /> Export JSON
              </button>
            </div>
          </div>

          <div className="max-h-[600px] overflow-auto">
            <table className="w-full font-mono text-[11px]">
              <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left">Timestamp</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Src IP</th>
                  <th className="px-3 py-2 text-left">Dst IP</th>
                  <th className="px-3 py-2 text-left">Message</th>
                  <th className="px-3 py-2 text-right">Anomaly</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 80).map((l) => (
                  <tr
                    key={l.id}
                    className={`border-b border-border/40 hover:bg-muted/30 ${
                      l.anomaly > 80 ? "bg-destructive/5" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {new Date(l.ts).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-1.5 uppercase text-accent">{l.source}</td>
                    <td className="px-3 py-1.5">{l.srcIp}</td>
                    <td className="px-3 py-1.5">{l.dstIp}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{l.message}</td>
                    <td
                      className={`px-3 py-1.5 text-right ${
                        l.anomaly > 80
                          ? "text-destructive"
                          : l.anomaly > 50
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {l.anomaly.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}