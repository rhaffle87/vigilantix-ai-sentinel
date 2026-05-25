import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Filter, Download, Database, Wifi, ServerCog } from "lucide-react";
import { useSim, CORPORATE_NET } from "@/context/SimulationContext";
import { useMounted } from "@/hooks/use-mounted";

export const Route = createFileRoute("/logs")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: LogsPage,
  head: () => ({
    meta: [{ title: "Data Collectors & Raw Logs · VIGILANTIX AI" }],
  }),
});

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
};

function LogsPage() {
  const { logs, metrics, searchQuery } = useSim();
  const [filter, setFilter] = useState<string>("all");
  const mounted = useMounted();

  const sources = ["all", "endpoint", "network", "server", "firewall", "auth"];
  const filtered = filter === "all" ? logs : logs.filter((l) => l.source === filter);

  const q = searchQuery.toLowerCase().trim();
  const searched = q
    ? filtered.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.srcIp.toLowerCase().includes(q) ||
          l.dstIp.toLowerCase().includes(q) ||
          (l.hash && l.hash.toLowerCase().includes(q))
      )
    : filtered;

  const totalEps = metrics.eventsPerSec;
  const edrEps = Math.round(totalEps * 0.31);
  const networkEps = Math.round(totalEps * 0.49);
  const syslogEps = Math.max(0, totalEps - edrEps - networkEps);

  const timeSec = typeof window !== "undefined" ? Math.floor(Date.now() / 1000) : 0;
  const edrCount = 1280 + (timeSec % 7 === 0 ? 3 : timeSec % 13 === 0 ? -2 : 1);
  const networkCount = 36 + (timeSec % 23 === 0 ? 1 : 0);
  const syslogCount = 212 + (timeSec % 11 === 0 ? 2 : -1);

  const handleExportJSON = () => {
    if (searched.length === 0) return;
    const dataStr = JSON.stringify(searched, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vigilantix_logs_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const collectors = [
    { name: "Endpoint EDR Agents", desc: "Monitors client workstation subnet 10.0.2.0/24", icon: ServerCog, count: edrCount, eps: edrEps },
    { name: "Network Taps / NIDS", desc: "Listens to edge network ingress range 192.168.1.0/24", icon: Wifi, count: networkCount, eps: networkEps },
    { name: "Server Syslog Forwarders", desc: `Routes to Active Directory (${CORPORATE_NET.domainController}) and Gateway (${CORPORATE_NET.apiGateway})`, icon: Database, count: syslogCount, eps: syslogEps },
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
                <c.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-widest text-success">online</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{c.name}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Agents</p>
                  <p className="font-mono text-xl font-bold">{mounted ? c.count.toLocaleString() : "..."}</p>
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
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-accent">{mounted ? metrics.eventsPerSec.toLocaleString() : "..."}</span>
              ev/s ingest
              <button
                onClick={handleExportJSON}
                className="ml-3 flex items-center gap-1 rounded border border-border px-2 py-1 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 transition-transform"
                aria-label="Export Logs as JSON"
              >
                <Download className="h-3 w-3" aria-hidden="true" /> Export JSON
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
                  <th className="px-3 py-2 text-right">Anomaly (%)</th>
                </tr>
              </thead>
              <tbody>
                {searched.slice(0, 80).map((l) => (
                  <tr
                    key={l.id}
                    className={`border-b border-border/40 hover:bg-muted/30 ${
                      l.anomaly > 80 ? "bg-destructive/5" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {mounted ? formatTime(l.ts) : "--:--:--"}
                    </td>
                    <td className="px-3 py-1.5 uppercase text-accent">{l.source}</td>
                    <td className="px-3 py-1.5">{l.srcIp}</td>
                    <td className="px-3 py-1.5">{l.dstIp}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{l.message}</td>
                    <td
                      className={`px-3 py-1.5 text-right ${
                        l.anomaly > 80
                          ? "text-destructive font-semibold"
                          : l.anomaly > 50
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {l.anomaly.toFixed(1)}%
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