import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
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
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: SoarPage,
  head: () => ({ meta: [{ title: "SOAR Playbooks & Automation · VIGILANTIX AI" }] }),
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
    id: "PB-Auth-Gate-Lockout",
    name: "Auth Brute Force Lockdown",
    trigger: "failed_auth ≥ 25 / 60s from same IP",
    steps: 5,
    runs: 388,
    enabled: true,
  },
  {
    id: "PB-Data-Exfil-Prevention",
    name: "Endpoint Isolation",
    trigger: "EDR malicious process detected",
    steps: 5,
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
  {
    id: "PB-Endpoint-Isolation",
    name: "Endpoint Isolation",
    trigger: "persistent silent beacon to high port detected",
    steps: 5,
    runs: 82,
    enabled: true,
  },
  {
    id: "PB-APT-Containment",
    name: "APT Emergency Containment",
    trigger: "volume shadow copy deletions + file encryption patterns",
    steps: 5,
    runs: 16,
    enabled: true,
  },
];

const ICON_MAP: Record<string, typeof Shield> = {
  block_ip: Shield,
  isolate: Server,
  notify: Mail,
  snapshot: Camera,
  ticket: FileText,
  rate_limit: Shield,
  db_lock: Shield,
  dns_sinkhole: Server,
  capture_pcaps: Camera,
  revoke_keys: Shield,
  terminate_session: Shield,
  rebuild: Server,
  revert_snapshot: Camera,
};

const PLAYBOOK_YAML_TEMPLATES: Record<string, string> = {
  "PB-Critical-Containment": `id: PB-Critical-Containment
name: Critical Containment
trigger:
  condition: anomaly >= 90 OR known_ioc_match
  cooldown: 300s
steps:
  - id: step-1
    name: Block Ingress Traffic
    action: waf_block_ip
    target: "attacker_ip"
  - id: step-2
    name: Isolate Database Services
    action: crowdstrike_isolate
    target: "10.0.1.20"
  - id: step-3
    name: Rotate Gateway Keys
    action: kms_rotate_keys
  - id: step-4
    name: Dispatch On-Call Pager
    action: pagerduty_trigger
    severity: CRITICAL
  - id: step-5
    name: Export Incident Logs
    action: s3_log_export`,

  "PB-Auth-Gate-Lockout": `id: PB-Auth-Gate-Lockout
name: Auth Brute Force Lockdown
trigger:
  condition: failed_auth >= 25 / 60s
  scope: domain_controller
steps:
  - id: step-1
    name: Identify Source IP
    action: parsing_engine
  - id: step-2
    name: Challenge MFA
    action: enforce_mfa_challenge
  - id: step-3
    name: Lockdown Domain Controller
    action: active_directory_lock
    target: "10.0.1.30"
  - id: step-4
    name: Slack Alert Dispatch
    action: slack_notify
    channel: "#sec-ops"
  - id: step-5
    name: Open Jira Ticket
    action: jira_create_issue`,

  "PB-Data-Exfil-Prevention": `id: PB-Data-Exfil-Prevention
name: Endpoint Isolation
trigger:
  condition: EDR malicious process detected
  severity: HIGH
steps:
  - id: step-1
    name: Quarantine Process
    action: edr_kill_pid
  - id: step-2
    name: Block Port egress
    action: gateway_block_egress
    target: "10.0.1.10"
  - id: step-3
    name: Isolate Host System
    action: carbon_black_isolate
  - id: step-4
    name: Notify Security Team
    action: email_dispatch
  - id: step-5
    name: Generate Incident Archive
    action: forensic_dump`,

  "PB-DLP-Quarantine": `id: PB-DLP-Quarantine
name: DLP Quarantine
trigger:
  condition: outbound exfil > 50MB
  destination: untrusted_asn
steps:
  - id: step-1
    name: Sniff network streams
    action: packet_capture
  - id: step-2
    name: Isolate local subnet
    action: disable_dhcp
  - id: step-3
    name: Revoke session tokens
    action: auth0_revoke_session
  - id: step-4
    name: Create forensic ticket
    action: servicenow_ticket`,

  "PB-Endpoint-Isolation": `id: PB-Endpoint-Isolation
name: Endpoint Isolation
trigger:
  condition: persistent silent beacon detected
  target_port: 8443
steps:
  - id: step-1
    name: Quarantine Primary AD server
    action: ad_quarantine
  - id: step-2
    name: Revoke SSL keys
    action: revoke_ssl_cert
  - id: step-3
    name: Invalidate AD credentials
    action: invalidate_ad_tokens
  - id: step-4
    name: Alert Incident Response team
    action: pagerduty_escalate
  - id: step-5
    name: Deploy AD replica
    action: restore_active_directory`,

  "PB-APT-Containment": `id: PB-APT-Containment
name: APT Emergency Containment
trigger:
  condition: high disk write frequency + shadow copy deletions
  severity: EMERGENCY
steps:
  - id: step-1
    name: Block outbound C2 IPs
    action: egress_firewall_block
  - id: step-2
    name: Airgap core API Gateway
    action: vpc_airgap_isolation
  - id: step-3
    name: Rollback secure snapshots
    action: snapshot_restore
  - id: step-4
    name: Alert Executive CISO
    action: slack_ciso_alert
  - id: step-5
    name: Audit payload source
    action: forensics_compile`
};

function SoarPage() {
  const { 
    soarTasks, 
    isAttacking, 
    activeIncident, 
    triggerAttack, 
    incidents, 
    searchQuery,
    playbookRegistry,
    savePlaybookYaml
  } = useSim();
  const [editingPlaybook, setEditingPlaybook] = useState<any>(null);
  const [yamlContent, setYamlContent] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const q = searchQuery.toLowerCase().trim();
  const filteredIncidents = q
    ? incidents.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.srcIp.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      )
    : incidents;

  const filteredPlaybooks = q
    ? PLAYBOOKS.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.trigger.toLowerCase().includes(q)
      )
    : PLAYBOOKS;

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
            onClick={() => triggerAttack(0)}
            disabled={isAttacking}
            className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-primary disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {isAttacking ? "Playbook executing…" : "Dry-run Containment Playbook"}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" aria-hidden="true" />
                Active Containment — {activeIncident?.playbook || "PB-Critical-Containment"}
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
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-sm text-foreground">{t.label}</span>
                    {t.done ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> done
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
              {filteredIncidents.filter((i) => i.status === "resolved").slice(0, 4).map((i) => (
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
              {filteredPlaybooks.map((p) => (
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
                          ? "bg-success/15 text-success font-semibold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.enabled ? (
                        <PlayCircle className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <PauseCircle className="h-3 w-3" aria-hidden="true" />
                      )}
                      {p.enabled ? "enabled" : "paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.enabled && (
                        <button
                          onClick={() => {
                            let idx = 0;
                            if (p.id === "PB-Critical-Containment") idx = 0;
                            else if (p.id === "PB-Auth-Gate-Lockout") idx = 1;
                            else if (p.id === "PB-Data-Exfil-Prevention") idx = 2;
                            else if (p.id === "PB-Endpoint-Isolation") idx = 3;
                            else if (p.id === "PB-APT-Containment") idx = 4;
                            triggerAttack(idx);
                          }}
                          disabled={isAttacking}
                          className="rounded bg-accent/15 hover:bg-accent/30 text-accent font-semibold px-2 py-1 text-xs transition disabled:opacity-50 active:scale-95"
                          aria-label={`Dry-run playbook ${p.name}`}
                        >
                          Dry-run
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingPlaybook(p);
                          setYamlContent(playbookRegistry[p.id] || PLAYBOOK_YAML_TEMPLATES[p.id] || "");
                          setSaveSuccess(false);
                        }}
                        className="rounded border border-border px-2 py-1 text-xs hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 transition"
                        aria-label={`Edit YAML for playbook ${p.name}`}
                      >
                        Edit YAML
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingPlaybook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute inset-0 bg-gradient-primary opacity-5 pointer-events-none" />
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">YAML Configuration Editor</span>
                <h3 className="text-lg font-bold text-foreground">{editingPlaybook.name}</h3>
              </div>
              <button 
                onClick={() => setEditingPlaybook(null)}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-4 font-mono text-xs">
              {(() => {
                const isValid = (() => {
                  const val = yamlContent.trim();
                  if (!val) return false;
                  try {
                    const lines = val.split("\n");
                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
                      if (trimmed.includes(":")) {
                        const colonIdx = trimmed.indexOf(":");
                        const key = trimmed.slice(0, colonIdx);
                        if (!key.trim() || key.endsWith(" ")) return false;
                      }
                    }
                    return true;
                  } catch {
                    return false;
                  }
                })();

                return (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/20 px-3 py-1.5 rounded border border-border/40">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full animate-pulse ${isValid ? "bg-success" : "bg-destructive"}`} />
                        YAML Spec Validation: {isValid ? "PASSED" : "FAILED (Syntax error in keys/colons)"}
                      </span>
                      <span>Unicode UTF-8</span>
                    </div>
                    
                    <textarea
                      value={yamlContent}
                      onChange={(e) => setYamlContent(e.target.value)}
                      className={`w-full h-80 bg-background/80 font-mono text-xs text-foreground p-4 rounded border focus:ring-1 outline-none resize-none leading-relaxed transition ${
                        isValid ? "border-border focus:border-accent focus:ring-accent" : "border-destructive/60 focus:border-destructive focus:ring-destructive"
                      }`}
                      spellCheck="false"
                    />
                  </>
                );
              })()}
            </div>
            
            <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
              {saveSuccess ? (
                <span className="text-xs text-success flex items-center gap-1">
                  ✓ Configuration saved successfully!
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Modifying this YAML updates the live SOAR engine.
                </span>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPlaybook(null)}
                  className="rounded border border-border px-4 py-2 text-xs font-semibold hover:bg-muted/30 transition active:scale-95"
                >
                  Cancel
                </button>
                {(() => {
                  const isValid = (() => {
                    const val = yamlContent.trim();
                    if (!val) return false;
                    try {
                      const lines = val.split("\n");
                      for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
                        if (trimmed.includes(":")) {
                          const colonIdx = trimmed.indexOf(":");
                          const key = trimmed.slice(0, colonIdx);
                          if (!key.trim() || key.endsWith(" ")) return false;
                        }
                      }
                      return true;
                    } catch {
                      return false;
                    }
                  })();

                  return (
                    <button
                      onClick={() => {
                        if (!isValid) return;
                        savePlaybookYaml(editingPlaybook.id, yamlContent);
                        setSaveSuccess(true);
                        setTimeout(() => {
                          setSaveSuccess(false);
                          setEditingPlaybook(null);
                        }, 1200);
                      }}
                      disabled={!isValid}
                      className="rounded bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground glow-primary transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Save Changes
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}