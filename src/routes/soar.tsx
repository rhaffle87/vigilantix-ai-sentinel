import { createFileRoute } from "@tanstack/react-router";
import {
  Workflow,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Circle,
  Mail,
  Shield,
  Server,
  Camera,
  FileText,
} from "lucide-react";
import { useSim } from "@/context/SimulationContext";

export const Route = createFileRoute("/soar")({
  component: SoarPage,
  head: () => ({ meta: [{ title: "SOAR Playbooks · VIGILANTIX AI" }] }),
});

const PLAYBOOKS = [
  {
    id: "PB-Critical-Containment",
    name: "Critical Containment",
    trigger: "anomaly ≥ 90 OR known IOC match",
    steps: 5,
    runs: 142,
    enabled: true,
  },
  {
    id: "PB-Auth-Lockdown",
    name: "Auth Brute Force Lockdown",
    trigger: "failed_auth ≥ 25 / 60s from same IP",
    steps: 4,
    runs: 388,
    enabled: true,
  },
  {
    id: "PB-EDR-Isolate",
    name: "Endpoint Isolation",
    trigger: "EDR malicious process detected",
    steps: 3,
    runs: 91,
    enabled: true,
  },
  {
    id: "PB-DLP-Quarantine",
    name: "DLP Quarantine",
    trigger: "outbound exfil > 50MB to untrusted ASN",
    steps: 6,
    runs: 24,
    enabled: false,
  },
];

const ICON_MAP: Record<string, typeof Shield> = {
  block_ip: Shield,
  isolate: Server,
  notify: Mail,
  snapshot: Camera,
  ticket: FileText,
};

function SoarPage() {
  const { soarTasks, isAttacking, activeIncident, triggerAttack, incidents } = useSim();

  return (
    <div className="p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Layer 5 · Orchestration</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">SOAR Playbooks & Automation</h1>
            <p className="text-sm text-muted-foreground">
              Codified response routines executed automatically — zero analyst toil for repeatable
              containment.
            </p>
          </div>
          <button
            onClick={triggerAttack}
            disabled={isAttacking}
            className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-primary disabled:opacity-60"
          >
            {isAttacking ? "Playbook executing…" : "Dry-run Containment Playbook"}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                Active Containment — PB-Critical-Containment
              </h3>
              <span
                className={`text-[10px] uppercase tracking-widest ${
                  isAttacking ? "text-destructive animate-flicker" : "text-muted-foreground"
                }`}
              >
                {isAttacking ? "RUNNING" : activeIncident ? "ARMED" : "STANDBY"}
              </span>
            </div>

            {activeIncident && (
              <div className="mb-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-xs">
                <span className="font-mono text-destructive">{activeIncident.id}</span> ·{" "}
                <span className="text-foreground">{activeIncident.title}</span> · src{" "}
                <span className="font-mono text-accent">{activeIncident.srcIp}</span>
              </div>
            )}

            <ul className="space-y-2">
              {soarTasks.map((t, i) => {
                const Icon = ICON_MAP[t.key] ?? Circle;
                return (
                  <li
                    key={t.key}
                    className={`flex items-center gap-3 rounded-md border p-3 transition ${
                      t.done
                        ? "border-success/40 bg-success/5"
                        : isAttacking
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-muted/20"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      0{i + 1}
                    </span>
                    <Icon
                      className={`h-4 w-4 ${
                        t.done ? "text-success" : "text-muted-foreground"
                      }`}
                    />
                    <span className="flex-1 text-sm text-foreground">{t.label}</span>
                    {t.done ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> done
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {isAttacking ? "queued…" : "idle"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Resolved Incidents</h3>
            <ul className="mt-3 space-y-2">
              {incidents.slice(0, 6).map((i) => (
                <li key={i.id} className="rounded border border-border bg-muted/20 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-accent">{i.id}</span>
                    <span className="text-[10px] uppercase tracking-widest text-success">
                      {i.status}
                    </span>
                  </div>
                  <div className="text-foreground">{i.title}</div>
                  <div className="mt-1 text-muted-foreground">
                    Playbook: <span className="font-mono">{i.playbook}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Playbook Library</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left">Playbook</th>
                <th className="px-4 py-2 text-left">Trigger</th>
                <th className="px-4 py-2 text-right">Steps</th>
                <th className="px-4 py-2 text-right">Runs (30d)</th>
                <th className="px-4 py-2 text-right">Status</th>
                <th className="px-4 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {PLAYBOOKS.map((p) => (
                <tr key={p.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{p.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{p.id}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {p.trigger}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{p.steps}</td>
                  <td className="px-4 py-3 text-right font-mono text-accent">{p.runs}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                        p.enabled
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.enabled ? (
                        <PlayCircle className="h-3 w-3" />
                      ) : (
                        <PauseCircle className="h-3 w-3" />
                      )}
                      {p.enabled ? "enabled" : "paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded border border-border px-2 py-1 text-xs hover:border-accent hover:text-accent">
                      Edit YAML
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}