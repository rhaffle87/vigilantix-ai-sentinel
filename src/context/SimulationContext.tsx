import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export type PipelineStage =
  | "idle"
  | "collection"
  | "processing"
  | "analysis"
  | "alert"
  | "response"
  | "logging"
  | "complete";

export type LogSeverity = "info" | "warn" | "critical";

export interface LogEntry {
  id: string;
  ts: number;
  source: "endpoint" | "network" | "server" | "firewall" | "auth";
  srcIp: string;
  dstIp: string;
  message: string;
  severity: LogSeverity;
  anomaly: number;
  hash?: string;
}

export interface Incident {
  id: string;
  ts: number;
  title: string;
  srcIp: string;
  anomaly: number;
  status: "investigating" | "contained" | "resolved";
  playbook: string;
  vtVerdict: "malicious" | "suspicious" | "clean";
  payloadHash?: string;
}

export interface SoarTask {
  key: string;
  label: string;
  done: boolean;
}

export interface AttackVariant {
  id: string;
  name: string;
  description: string;
  title: string;
  source: "endpoint" | "network" | "server" | "firewall" | "auth";
  message: string;
  severity: LogSeverity;
  anomaly: number;
  playbook: string;
  vtVerdict: "malicious" | "suspicious" | "clean";
  tasks: SoarTask[];
  payloadHash: string;
}

export const CORPORATE_NET = {
  apiGateway: "10.0.1.10",       // Primary Web Server / Ingress Gateway
  database: "10.0.1.20",         // SQL Database Cluster
  domainController: "10.0.1.30", // Active Directory Domain Services (AD DS)
  dnsResolver: "10.0.1.40",      // Recursive DNS resolver
};

export const ATTACK_VARIANTS: AttackVariant[] = [
  {
    id: "zero_day",
    name: "Zero-day Exploit",
    description: "Inbound exploit payload attempt on edge gateway",
    title: "Zero-day exploit attempt on edge gateway",
    source: "network",
    message: "Inbound exploit payload — suspected CVE-2024-31337",
    severity: "critical",
    anomaly: 96,
    playbook: "PB-Critical-Containment",
    vtVerdict: "malicious",
    payloadHash: "4a7f3b9d2e8c1f0a6b5d4e3c2a1f0b9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a",
    tasks: [
      { key: "block_ip", label: "Block malicious IP at edge firewall", done: false },
      { key: "isolate", label: "Isolate infected endpoint device", done: false },
      { key: "notify", label: "Dispatch admin notification (email + pager)", done: false },
      { key: "snapshot", label: "Snapshot endpoint memory for forensics", done: false },
      { key: "ticket", label: "Create incident ticket in audit log", done: false },
    ],
  },
  {
    id: "sql_injection",
    name: "SQL Injection",
    description: "Brute-force SQL injection on authentication portal",
    title: "SQL injection brute-force on auth portal",
    source: "auth",
    message: "Repeated authentication failure followed by database syntax injection pattern",
    severity: "warn",
    anomaly: 82,
    playbook: "PB-Auth-Gate-Lockout",
    vtVerdict: "suspicious",
    payloadHash: "b3e9f2a1d4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
    tasks: [
      { key: "block_ip", label: "Block attacking IP at Web Application Firewall (WAF)", done: false },
      { key: "rate_limit", label: "Enable strict rate-limiting on authentication endpoints", done: false },
      { key: "notify", label: "Notify application security engineering team", done: false },
      { key: "db_lock", label: "Enforce read-only state for affected database segment", done: false },
      { key: "ticket", label: "Create database security incident record", done: false },
    ],
  },
  {
    id: "dns_tunneling",
    name: "DNS Tunneling",
    description: "Exfiltration of sensitive customer data via DNS tunneling",
    title: "DNS tunneling data exfiltration attempt",
    source: "firewall",
    message: "Suspiciously high frequency of outbound DNS queries containing high-entropy subdomains",
    severity: "critical",
    anomaly: 91,
    playbook: "PB-Data-Exfil-Prevention",
    vtVerdict: "malicious",
    payloadHash: "c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8",
    tasks: [
      { key: "block_ip", label: "Block malicious DNS resolver IP at firewall", done: false },
      { key: "dns_sinkhole", label: "Sinkhole malicious target domains on DNS server", done: false },
      { key: "notify", label: "Notify network operations center (NOC) team", done: false },
      { key: "capture_pcaps", label: "Initiate full packet capture on network interface", done: false },
      { key: "ticket", label: "Create network exfiltration incident ticket", done: false },
    ],
  },
  {
    id: "stealth_backdoor",
    name: "Stealth Backdoor Trojan",
    description: "Persistent quiet backdoor beaconing from local domain controller",
    title: "Stealth backdoor beaconing from Active Directory Domain Services",
    source: "server",
    message: "Outbound SSL/TLS beacon observed connecting to known command-and-control subnet on high port 8443",
    severity: "critical",
    anomaly: 94,
    playbook: "PB-Endpoint-Isolation",
    vtVerdict: "malicious",
    payloadHash: "9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f",
    tasks: [
      { key: "isolate", label: "Quarantine Active Directory primary sync server", done: false },
      { key: "revoke_keys", label: "Revoke and regenerate SSL/TLS web certificates", done: false },
      { key: "terminate_session", label: "Invalidate active AD administrative and service accounts", done: false },
      { key: "notify", label: "Alert CISO and Incident Response team", done: false },
      { key: "rebuild", label: "Initialize clean Active Directory domain state", done: false },
    ],
  },
  {
    id: "supply_chain_apt",
    name: "APT Supply Chain Malware",
    description: "Obfuscated malware binary delivered through dynamic library update dependency",
    title: "APT Ransomware / wiper payload payload executed in production subnet",
    source: "endpoint",
    message: "High disk write frequency combined with system volume shadow copy deletion commands",
    severity: "critical",
    anomaly: 98,
    playbook: "PB-Critical-Containment",
    vtVerdict: "malicious",
    payloadHash: "f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2",
    tasks: [
      { key: "block_ip", label: "Block suspicious C2 network egress IPs", done: false },
      { key: "isolate", label: "Enforce airgap isolation on Core API Gateway subnet", done: false },
      { key: "revert_snapshot", label: "Trigger dynamic revert to secure system storage snapshots", done: false },
      { key: "notify", label: "Initiate Emergency Response SOAR protocol alerts", done: false },
      { key: "ticket", label: "Publish external SOC forensic report", done: false },
    ],
  },
  {
    id: "oauth_hijack",
    name: "OAuth Consent Hijack",
    description: "Phishing attack abusing rogue OAuth app registrations to bypass MFA and hijack user tokens",
    title: "MFA-bypass OAuth app consent grant detected",
    source: "auth",
    message: "Illegitimate tenant administrative consent grant issued to unregistered third-party multitenant application",
    severity: "critical",
    anomaly: 89,
    playbook: "PB-OAuth-App-Remediation",
    vtVerdict: "suspicious",
    payloadHash: "a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
    tasks: [
      { key: "revoke_consent", label: "Revoke rogue third-party OAuth app authorization grant", done: false },
      { key: "isolate_sessions", label: "Terminate active user authentication sessions and refresh tokens", done: false },
      { key: "notify", label: "Alert identity operations and directory audit teams", done: false },
      { key: "mfa_reset", label: "Enforce password reset and force re-registration of FIDO2 MFA credentials", done: false },
      { key: "ticket", label: "Log security telemetry inside administrative access directory", done: false },
    ],
  },
  {
    id: "ai_jailbreak",
    name: "AI LLM Indirect Injection",
    description: "Malicious prompt payload hiding inside user files triggering remote API exfiltration",
    title: "AI Agent indirect prompt injection attempt",
    source: "network",
    message: "Indirect injection prompt payload detected inside pipeline content stream trying to hijack system instructions",
    severity: "warn",
    anomaly: 76,
    playbook: "PB-AI-Guardrail-Reinforcement",
    vtVerdict: "suspicious",
    payloadHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    tasks: [
      { key: "sandbox_agent", label: "Place active LLM orchestration agent in isolated sandbox", done: false },
      { key: "filter_input", label: "Inject reinforced system prompt and activate input guardrails", done: false },
      { key: "notify", label: "Inform AI security engineering and safety alignment team", done: false },
      { key: "quarantine_file", label: "Quarantine source file from document storage vectors", done: false },
      { key: "ticket", label: "Record prompt anomaly inside safety classification index", done: false },
    ],
  },
  {
    id: "catastrophic_wipe",
    name: "APT Wiper Takeover [UNRESOLVED]",
    description: "Catastrophic hostile takeover attempting firmware wiping. Halts SOAR execution indefinitely.",
    title: "Catastrophic Core Directory Takeover & Hostile Wiper Payload",
    source: "server",
    message: "Critical firmware sectors overwritten. Active Directory replication stalled. Automatic mitigation sequence failure.",
    severity: "critical",
    anomaly: 99,
    playbook: "PB-Emergency-System-Override",
    vtVerdict: "malicious",
    payloadHash: "e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7",
    tasks: [
      { key: "isolate", label: "Attempt boundary domain isolation", done: false },
      { key: "mitigate", label: "Deploy automated boundary patches [FAILED]", done: false },
      { key: "override", label: "CRITICAL: SOAR automation hijacked. Manual bypass required.", done: false },
    ],
  },
];

export interface ClusterInfo {
  region: string;
  name: string;
  status: "online" | "degraded" | "offline";
  latency: number;
}

export interface AppNotification {
  id: string;
  type: "attack" | "variable" | "playbook" | "general" | "remediation";
  message: string;
  timestamp: number;
  read: boolean;
}

interface SimState {
  logs: LogEntry[];
  incidents: Incident[];
  stage: PipelineStage;
  activeIncident: Incident | null;
  soarTasks: SoarTask[];
  metrics: {
    eventsPerSec: number;
    alertsToday: number;
    blockedIps: number;
    meanResponseSec: number;
  };
  series: { t: string; events: number; anomalies: number; blocked: number }[];
  triggerAttack: (variantIndex?: number) => void;
  manualOverrideRecovery?: () => void;
  isAttacking: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  clusters: ClusterInfo[];
  complianceScore: number;
  playbookRegistry: Record<string, string>;
  savePlaybookYaml: (id: string, yaml: string) => void;
  triggerAudioAlert: (severity: string) => void;
}

const Ctx = createContext<SimState | null>(null);

let sharedAudioCtx: AudioContext | null = null;

const INITIAL_TASKS: SoarTask[] = ATTACK_VARIANTS[0].tasks;

function mapLogFromDb(dbLog: any): LogEntry {
  return {
    id: dbLog.id,
    ts: new Date(dbLog.ts).getTime(),
    source: dbLog.source,
    srcIp: dbLog.src_ip,
    dstIp: dbLog.dst_ip,
    message: dbLog.message,
    severity: dbLog.severity,
    anomaly: Number(dbLog.anomaly),
    hash: dbLog.hash || undefined,
  };
}

function mapIncidentFromDb(dbIncident: any): Incident {
  return {
    id: dbIncident.id,
    ts: new Date(dbIncident.created_at).getTime(),
    title: dbIncident.title,
    srcIp: dbIncident.src_ip,
    anomaly: Number(dbIncident.anomaly),
    status: dbIncident.status,
    playbook: dbIncident.playbook,
    vtVerdict: dbIncident.vt_verdict,
  };
}

export const PLAYBOOK_YAML_TEMPLATES: Record<string, string> = {
  "PB-Critical-Containment": `id: PB-Critical-Containment
name: Critical Containment
trigger:
  condition: anomaly >= 90 OR known_ioc_match
  cooldown: 300s
steps:
  - id: block_ip
    name: Block Ingress Traffic
    action: waf_block_ip
    target: "attacker_ip"
  - id: isolate
    name: Isolate Database Services
    action: crowdstrike_isolate
    target: "10.0.1.20"
  - id: notify
    name: Dispatch On-Call Pager
    action: pagerduty_trigger
    severity: CRITICAL
  - id: snapshot
    name: Snapshot endpoint memory for forensics
    action: s3_log_export
  - id: ticket
    name: Export Incident Logs
    action: ticket_create`,

  "PB-Auth-Gate-Lockout": `id: PB-Auth-Gate-Lockout
name: Auth Brute Force Lockdown
trigger:
  condition: failed_auth >= 25 / 60s
  scope: domain_controller
steps:
  - id: block_ip
    name: Block attacking IP at WAF
    action: waf_block_ip
  - id: rate_limit
    name: Enable strict rate-limiting
    action: enforce_rate_limits
  - id: notify
    name: Notify application security engineering team
    action: slack_notify
  - id: db_lock
    name: Enforce read-only database state
    action: active_directory_lock
  - id: ticket
    name: Create database security incident record
    action: jira_create_issue`,

  "PB-Data-Exfil-Prevention": `id: PB-Data-Exfil-Prevention
name: Endpoint Isolation
trigger:
  condition: EDR malicious process detected
  severity: HIGH
steps:
  - id: block_ip
    name: Block malicious DNS resolver IP
    action: gateway_block_egress
  - id: dns_sinkhole
    name: Sinkhole malicious target domains
    action: dns_sinkhole
  - id: notify
    name: Notify network operations center
    action: email_dispatch
  - id: capture_pcaps
    name: Initiate full packet capture
    action: pcaps_dump
  - id: ticket
    name: Create network exfiltration incident ticket
    action: forensic_dump`,

  "PB-Endpoint-Isolation": `id: PB-Endpoint-Isolation
name: Endpoint Isolation
trigger:
  condition: persistent silent beacon detected
  target_port: 8443
steps:
  - id: isolate
    name: Quarantine Active Directory primary sync server
    action: ad_quarantine
  - id: revoke_keys
    name: Revoke and regenerate SSL/TLS certs
    action: revoke_ssl_cert
  - id: terminate_session
    name: Invalidate AD credentials
    action: invalidate_ad_tokens
  - id: notify
    name: Alert Incident Response team
    action: pagerduty_escalate
  - id: rebuild
    name: Rebuild AD domain controller replica
    action: restore_active_directory`,

  "PB-OAuth-App-Remediation": `id: PB-OAuth-App-Remediation
name: OAuth Consent Hijack Mitigation
trigger:
  condition: unauthorized_consent_grant
steps:
  - id: revoke_consent
    name: Revoke rogue OAuth consent grant
    action: revoke_consent
  - id: isolate_sessions
    name: Terminate active user sessions
    action: terminate_user_sessions
  - id: notify
    name: Alert identity audit team
    action: notify_identity_ops
  - id: mfa_reset
    name: Force password reset and MFA re-enrollment
    action: trigger_mfa_reset
  - id: ticket
    name: Log security audit telemetry
    action: log_telemetry_audit`,

  "PB-AI-Guardrail-Reinforcement": `id: PB-AI-Guardrail-Reinforcement
name: AI Guardrail Reinforcement
trigger:
  condition: indirect_prompt_injection
steps:
  - id: sandbox_agent
    name: Place AI agent in sandbox
    action: isolate_ai_runtime
  - id: filter_input
    name: Inject reinforced system prompt
    action: load_enhanced_prompt
  - id: notify
    name: Inform AI safety alignment team
    action: notify_safety_ops
  - id: quarantine_file
    name: Quarantine source document vectors
    action: quarantine_document
  - id: ticket
    name: Record prompt anomaly safety index
    action: record_prompt_anomaly`,

  "PB-Emergency-System-Override": `id: PB-Emergency-System-Override
name: Emergency Manual Recovery
trigger:
  condition: wiper_payload_takeover
steps:
  - id: isolate
    name: Attempt boundary domain isolation
    action: network_airgap
  - id: mitigate
    name: Deploy automated boundary patches [FAILED]
    action: apply_patch_stalled
  - id: override
    name: CRITICAL: Manual bypass required
    action: manual_override`
};

function mapTaskFromDb(dbTask: any): SoarTask {
  return {
    key: dbTask.key,
    label: dbTask.label,
    done: dbTask.done,
  };
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [playbookRegistry, setPlaybookRegistry] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vigilantix_playbooks");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return PLAYBOOK_YAML_TEMPLATES;
  });

  const savePlaybookYaml = (id: string, yaml: string) => {
    setPlaybookRegistry((prev) => {
      const next = { ...prev, [id]: yaml };
      if (typeof window !== "undefined") {
        localStorage.setItem("vigilantix_playbooks", JSON.stringify(next));
      }
      return next;
    });
  };

  const triggerAudioAlert = (severity: string) => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!sharedAudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
      const ctx = sharedAudioCtx;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (severity === "critical") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(760, ctx.currentTime + 0.25);
        osc.frequency.linearRampToValueAtTime(380, ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(760, ctx.currentTime + 0.75);
        
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.0);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.35);
        
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("AudioContext failed or blocked:", e);
    }
  };

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [activeIncident, setActive] = useState<Incident | null>(null);

  const complianceScore = useMemo(() => {
    if (!activeIncident) return 99.2;
    const title = activeIncident.title.toLowerCase();
    if (title.includes("wiper")) return 34.8;
    if (title.includes("supply")) return 59.3;
    if (title.includes("stealth") || title.includes("backdoor")) return 62.5;
    if (title.includes("oauth")) return 66.9;
    if (title.includes("zero-day") || title.includes("zero_day")) return 78.4;
    if (title.includes("dns")) return 81.6;
    if (title.includes("sql")) return 84.1;
    if (title.includes("jailbreak") || title.includes("indirect")) return 88.2;
    return 75.0;
  }, [activeIncident]);
  const [soarTasks, setSoarTasks] = useState<SoarTask[]>(INITIAL_TASKS);
  const [isAttacking, setAttacking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "notif-init",
      type: "general",
      message: "Vigilantix Threat Detection platform initialized.",
      timestamp: Date.now() - 3600000 * 2,
      read: true,
    },
    {
      id: "notif-db",
      type: "general",
      message: "Established connection to Supabase Realtime channel.",
      timestamp: Date.now() - 3600000,
      read: true,
    },
  ]);

  const addNotification = (type: AppNotification["type"], message: string) => {
    setNotifications((prev) => [
      {
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: Date.now(),
        read: false,
      },
      ...prev,
    ].slice(0, 50));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const [metrics, setMetrics] = useState({
    eventsPerSec: 1248,
    alertsToday: 2,
    blockedIps: 412,
    meanResponseSec: 38,
  });

  const [series, setSeries] = useState<{ t: string; events: number; anomalies: number; blocked: number }[]>([]);
  const [latencies, setLatencies] = useState<Record<string, number>>({
    "us-east-1": 45,
    "eu-west-3": 88,
    "ap-south-1": 135,
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Fetch initial telemetry from Supabase or load fallback in-memory mock data
  useEffect(() => {
    const mockInitialLogs: LogEntry[] = [
      { id: "log-1", ts: Date.now() - 60000, source: "network", srcIp: "192.168.1.105", dstIp: "10.0.0.15", message: "TCP SYN ack", severity: "info", anomaly: 12 },
      { id: "log-2", ts: Date.now() - 120000, source: "endpoint", srcIp: "10.0.4.12", dstIp: "10.0.0.1", message: "EDR heartbeat", severity: "info", anomaly: 5 },
      { id: "log-3", ts: Date.now() - 180000, source: "server", srcIp: "10.0.2.55", dstIp: "10.0.2.1", message: "Nginx 200 /api/health", severity: "info", anomaly: 8 },
      { id: "log-4", ts: Date.now() - 240000, source: "firewall", srcIp: "88.23.45.112", dstIp: "10.0.0.12", message: "Rule match: allow 443", severity: "info", anomaly: 15 },
      { id: "log-5", ts: Date.now() - 300000, source: "auth", srcIp: "10.0.5.99", dstIp: "10.0.0.2", message: "Session start", severity: "info", anomaly: 22 },
      { id: "log-6", ts: Date.now() - 360000, source: "network", srcIp: "10.0.4.88", dstIp: "192.168.1.200", message: "DNS query resolved", severity: "info", anomaly: 10 },
      { id: "log-7", ts: Date.now() - 420000, source: "endpoint", srcIp: "10.0.4.12", dstIp: "10.0.0.1", message: "Process exec: chrome.exe", severity: "info", anomaly: 18 },
      { id: "log-8", ts: Date.now() - 480000, source: "server", srcIp: "10.0.2.56", dstIp: "10.0.2.1", message: "DB query 12ms", severity: "info", anomaly: 11 },
      { id: "log-9", ts: Date.now() - 540000, source: "firewall", srcIp: "142.250.74.46", dstIp: "10.0.0.12", message: "Rate limit ok", severity: "info", anomaly: 7 },
      { id: "log-10", ts: Date.now() - 600000, source: "auth", srcIp: "10.0.5.99", dstIp: "10.0.0.2", message: "MFA verify ok", severity: "info", anomaly: 14 },
    ];

    const initialIncidents: Incident[] = [
      {
        id: "INC-9281",
        ts: Date.now() - 4 * 3600000,
        title: "Brute force on auth gateway",
        srcIp: "185.220.101.45",
        anomaly: 92,
        status: "resolved",
        playbook: "PB-Auth-Lockdown",
        vtVerdict: "malicious",
      },
      {
        id: "INC-9275",
        ts: Date.now() - 26 * 3600000,
        title: "Suspicious PowerShell on WIN-EP-22",
        srcIp: "10.0.4.21",
        anomaly: 88,
        status: "resolved",
        playbook: "PB-EDR-Isolate",
        vtVerdict: "suspicious",
      },
    ];

    const today = new Date().toDateString();
    const todayAlerts = initialIncidents.filter(
      (i) => new Date(i.ts).toDateString() === today
    ).length;

    const totalPoints = 24;
    const nowTs = Date.now();
    const initialSeries = Array.from({ length: totalPoints }, (_, idx) => {
      const hoursAgo = totalPoints - 1 - idx;
      const shiftedTime = new Date(nowTs - hoursAgo * 3600000);
      return {
        t: shiftedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        events: 1000 + Math.floor(Math.random() * 400),
        anomalies: 5 + Math.floor(Math.random() * 25),
        blocked: Math.floor(Math.random() * 8),
      };
    });

    if (!user) {
      setLogs(mockInitialLogs);
      setIncidents(initialIncidents);
      setMetrics((m) => ({ ...m, alertsToday: todayAlerts }));
      setSeries(initialSeries);
      return;
    }

    async function loadData() {
      try {
        // Logs
        const { data: dbLogs } = await supabase
          .from("logs")
          .select("*")
          .order("ts", { ascending: false })
          .limit(100);

        if (dbLogs && dbLogs.length > 0) {
          setLogs(dbLogs.map(mapLogFromDb));
        } else {
          setLogs(mockInitialLogs);
        }

        // Incidents
        const { data: dbIncidents } = await supabase
          .from("incidents")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbIncidents && dbIncidents.length > 0) {
          const now = Date.now();
          const activeThreshold = 2 * 60 * 1000; // 2 minutes

          // Filter out and resolve stale incidents in database
          const stales = dbIncidents.filter(
            (i) => i.status === "investigating" && now - new Date(i.created_at).getTime() > activeThreshold
          );

          for (const stale of stales) {
            await supabase
              .from("incidents")
              .update({ status: "resolved" })
              .eq("id", stale.id);
          }

          // Fetch fresh list if stales were resolved
          let finalIncidents = dbIncidents;
          if (stales.length > 0) {
            const { data: fresh } = await supabase
              .from("incidents")
              .select("*")
              .order("created_at", { ascending: false });
            if (fresh) finalIncidents = fresh;
          }

          const mappedIncidents = finalIncidents.map(mapIncidentFromDb);
          setIncidents(mappedIncidents);

          // Update alertsToday count
          const todayAlertsDb = mappedIncidents.filter(
            (i) => new Date(i.ts).toDateString() === today
          ).length;
          setMetrics((m) => ({ ...m, alertsToday: todayAlertsDb }));

          // Soar tasks for active incidents
          const active = finalIncidents.find(
            (i) => i.status === "investigating" && now - new Date(i.created_at).getTime() <= activeThreshold
          );
          if (active) {
            const { data: dbTasks } = await supabase
              .from("soar_tasks")
              .select("*")
              .eq("incident_id", active.id);
            if (dbTasks && dbTasks.length > 0) {
              setSoarTasks(dbTasks.map(mapTaskFromDb));
              setActive(mapIncidentFromDb(active));
              setStage("response");
              setAttacking(true);
            }
          }
        } else {
          setIncidents(initialIncidents);
          setMetrics((m) => ({ ...m, alertsToday: todayAlerts }));
        }

        // Metric series
        const { data: dbSeries } = await supabase
          .from("metric_series")
          .select("*")
          .order("t", { ascending: true })
          .limit(24);

        if (dbSeries && dbSeries.length > 0) {
          const totalPointsDb = dbSeries.length;
          const nowTsDb = Date.now();
          const mapped = dbSeries.map((s, idx) => {
            const hoursAgo = totalPointsDb - 1 - idx;
            const shiftedTime = new Date(nowTsDb - hoursAgo * 3600000);
            return {
              t: shiftedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              events: s.events,
              anomalies: s.anomalies,
              blocked: s.blocked,
            };
          });
          setSeries(mapped);
        } else {
          setSeries(initialSeries);
        }
      } catch (err) {
        console.error("Failed to load telemetry from Supabase database:", err);
        setLogs(mockInitialLogs);
        setIncidents(initialIncidents);
        setMetrics((m) => ({ ...m, alertsToday: todayAlerts }));
        setSeries(initialSeries);
      }
    }

    loadData();

    // Subscribe to realtime logs
    const logsChannel = supabase
      .channel("logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "logs" },
        (payload) => {
          const newLog = mapLogFromDb(payload.new);
          setLogs((prev) => {
            if (prev.some((log) => log.id === newLog.id)) {
              return prev;
            }
            return [newLog, ...prev].slice(0, 200);
          });

          // Increment event count on the latest chart point dynamically
          setSeries((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIdx = next.length - 1;
            next[lastIdx] = {
              ...next[lastIdx],
              events: next[lastIdx].events + 1,
            };
            return next;
          });

          if (newLog.anomaly > 75) {
            addNotification("attack", `WAF Alert: High-risk anomaly (${newLog.anomaly}%) detected from ${newLog.srcIp}`);
          }
        }
      )
      .subscribe();

    // Subscribe to realtime incidents
    const incidentsChannel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        async (payload) => {
          const { data: dbIncidents } = await supabase
            .from("incidents")
            .select("*")
            .order("created_at", { ascending: false });
          if (dbIncidents) {
            const mapped = dbIncidents.map(mapIncidentFromDb);
            setIncidents(mapped);

            const now = Date.now();
            const activeThreshold = 2 * 60 * 1000; // 2 minutes
            const active = dbIncidents.find(
              (i) => i.status === "investigating" && now - new Date(i.created_at).getTime() <= activeThreshold
            );
            if (active) {
              setActive(mapIncidentFromDb(active));
            } else {
              setActive(null);
              setAttacking(false);
              setStage("idle");
            }
          }

          if (payload.eventType === "INSERT") {
            const inc = payload.new as any;
            addNotification("attack", `CRITICAL Incident ${inc.id} Registered: ${inc.title}`);
          }
        }
      )
      .subscribe();

    // Subscribe to realtime tasks
    const tasksChannel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "soar_tasks" },
        async (payload) => {
          const incidentId = payload.new ? (payload.new as any).incident_id : null;
          if (incidentId) {
            const { data: dbTasks } = await supabase
              .from("soar_tasks")
              .select("*")
              .eq("incident_id", incidentId);
            if (dbTasks) {
              setSoarTasks(dbTasks.map(mapTaskFromDb));
            }
          }

          if (payload.eventType === "UPDATE") {
            const task = payload.new as any;
            if (task.done) {
              addNotification("playbook", `SOAR Action Completed: ${task.label}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(incidentsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [user]);

  // Events/sec ticker loop
  useEffect(() => {
    const id = setInterval(() => {
      setMetrics((m) => {
        const isWiper = activeIncident?.title.toLowerCase().includes("wiper");
        return {
          ...m,
          eventsPerSec: isWiper
            ? 4850 + Math.floor(Math.random() * 650)
            : 1100 + Math.floor(Math.random() * 400),
        };
      });
    }, 1200);
    return () => clearInterval(id);
  }, [activeIncident]);

  // Background benign logs generator to keep live log tail active
  useEffect(() => {
    const messages = [
      { source: "network", message: "TCP SYN ack received", severity: "info", minAnomaly: 4, maxAnomaly: 12 },
      { source: "endpoint", message: "EDR heartbeat health signal", severity: "info", minAnomaly: 1, maxAnomaly: 6 },
      { source: "server", message: "Nginx 200 GET /api/v1/telemetry", severity: "info", minAnomaly: 2, maxAnomaly: 8 },
      { source: "firewall", message: "Rule match: allow SSL traffic on 443", severity: "info", minAnomaly: 3, maxAnomaly: 15 },
      { source: "auth", message: "User session authenticated and tokens refreshed", severity: "info", minAnomaly: 8, maxAnomaly: 22 },
      { source: "network", message: "DNS lookup completed successfully", severity: "info", minAnomaly: 2, maxAnomaly: 10 },
      { source: "server", message: "DB Connection Pool size checks OK", severity: "info", minAnomaly: 1, maxAnomaly: 5 },
    ];

    const intervalId = setInterval(async () => {
      if (isAttacking) return; // Freeze noise during active threat response

      const template = messages[Math.floor(Math.random() * messages.length)];
      
      let srcIp = `10.0.2.${50 + Math.floor(Math.random() * 150)}`; // Client workstation zone by default
      let dstIp = CORPORATE_NET.apiGateway;

      if (template.source === "endpoint") {
        dstIp = CORPORATE_NET.domainController;
      } else if (template.source === "auth") {
        dstIp = CORPORATE_NET.domainController;
      } else if (template.message.includes("DNS")) {
        dstIp = CORPORATE_NET.dnsResolver;
      } else if (template.message.includes("DB Connection")) {
        srcIp = CORPORATE_NET.apiGateway;
        dstIp = CORPORATE_NET.database;
      } else {
        srcIp = `192.168.1.${10 + Math.floor(Math.random() * 240)}`; // External subnet
        dstIp = CORPORATE_NET.apiGateway;
      }

      const anomaly = Math.round((template.minAnomaly + Math.random() * (template.maxAnomaly - template.minAnomaly)) * 10) / 10;

      if (!user) {
        // Unauthenticated local-only simulation fallback
        const localLog: LogEntry = {
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          ts: Date.now(),
          source: template.source as any,
          srcIp,
          dstIp,
          message: template.message,
          severity: template.severity as any,
          anomaly,
        };
        setLogs((prev) => {
          if (prev.some((log) => log.id === localLog.id)) {
            return prev;
          }
          return [localLog, ...prev].slice(0, 200);
        });

        // Increment event count on the latest chart point dynamically
        setSeries((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const lastIdx = next.length - 1;
          next[lastIdx] = {
            ...next[lastIdx],
            events: next[lastIdx].events + 1,
          };
          return next;
        });

        if (anomaly > 75) {
          addNotification("attack", `WAF Alert: High-risk anomaly (${anomaly}%) detected from ${srcIp}`);
        }
        return;
      }

      // Authenticated database insert
      try {
        await supabase.from("logs").insert({
          source: template.source,
          src_ip: srcIp,
          dst_ip: dstIp,
          message: template.message,
          severity: template.severity,
          anomaly,
        });
      } catch (err) {
        console.error("Failed to insert background log entry:", err);
      }
    }, 4500);

    return () => clearInterval(intervalId);
  }, [isAttacking, user]);

  // Latencies ticker loop & degradation trigger
  useEffect(() => {
    const id = setInterval(() => {
      setLatencies((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((region) => {
          const base = region === "us-east-1" ? 45 : region === "eu-west-3" ? 88 : 135;
          let baseLatency = base;
          if (activeIncident) {
            const title = activeIncident.title.toLowerCase();
            const isZeroDay = title.includes("zero-day") || title.includes("zero_day");
            const isSql = title.includes("sql");
            const isDns = title.includes("dns");
            const isBackdoor = title.includes("stealth") || title.includes("backdoor");
            const isSupplyChain = title.includes("supply chain") || title.includes("supply_chain");
            const isOauth = title.includes("oauth");
            const isAiJailbreak = title.includes("indirect") || title.includes("jailbreak");
            const isWiper = title.includes("wiper");
            
            if (isWiper) {
              baseLatency = region === "us-east-1" ? 850 : region === "eu-west-3" ? 999 : 1450;
            } else if (isZeroDay) {
              if (region === "us-east-1") baseLatency = 240;
              else baseLatency = base + 35;
            } else if (isSql) {
              if (region === "eu-west-3") baseLatency = 195;
              else baseLatency = base + 20;
            } else if (isDns) {
              if (region === "ap-south-1") baseLatency = 310;
              else baseLatency = base + 40;
            } else if (isBackdoor) {
              if (region === "us-east-1") baseLatency = 160;
              if (region === "eu-west-3") baseLatency = 210;
            } else if (isSupplyChain) {
              if (region === "eu-west-3") baseLatency = 280;
              if (region === "ap-south-1") baseLatency = 320;
            } else if (isOauth) {
              if (region === "us-east-1") baseLatency = 295;
            } else if (isAiJailbreak) {
              if (region === "ap-south-1") baseLatency = 230;
            }
          }
          const fluctuation = Math.floor(Math.random() * 9) - 4; // -4 to +4
          next[region] = Math.max(10, baseLatency + fluctuation);
        });
        return next;
      });
    }, 1500);
    return () => clearInterval(id);
  }, [activeIncident]);

  const getClusterStatus = (region: string): "online" | "degraded" | "offline" => {
    if (!activeIncident) return "online";
    const title = activeIncident.title.toLowerCase();
    const isWiper = title.includes("wiper");
    if (isWiper) return "offline";

    const isZeroDay = title.includes("zero-day") || title.includes("zero_day");
    const isSql = title.includes("sql");
    const isDns = title.includes("dns");
    const isBackdoor = title.includes("stealth") || title.includes("backdoor");
    const isSupplyChain = title.includes("supply chain") || title.includes("supply_chain");
    const isOauth = title.includes("oauth");
    const isAiJailbreak = title.includes("indirect") || title.includes("jailbreak");

    if (region === "us-east-1") {
      if (isZeroDay || isOauth) return "degraded";
      if (isBackdoor) return "degraded";
    }
    if (region === "eu-west-3") {
      if (isSql || isSupplyChain) return "degraded";
      if (isBackdoor) return "degraded";
    }
    if (region === "ap-south-1") {
      if (isDns || isSupplyChain || isAiJailbreak) return "degraded";
    }
    return "online";
  };

  const clusters: ClusterInfo[] = [
    {
      region: "us-east-1",
      name: "US East (N. Virginia)",
      status: getClusterStatus("us-east-1"),
      latency: latencies["us-east-1"] || 45,
    },
    {
      region: "eu-west-3",
      name: "Europe (Paris)",
      status: getClusterStatus("eu-west-3"),
      latency: latencies["eu-west-3"] || 88,
    },
    {
      region: "ap-south-1",
      name: "Asia Pacific (Mumbai)",
      status: getClusterStatus("ap-south-1"),
      latency: latencies["ap-south-1"] || 135,
    },
  ];

  // Notify on stage transitions
  useEffect(() => {
    if (stage !== "idle" && stage !== "complete") {
      addNotification("playbook", `SOAR Pipeline transitioned to stage: ${stage.toUpperCase()}`);
    } else if (stage === "complete") {
      addNotification("remediation", `SOAR Pipeline execution complete. Threat resolved.`);
    }
  }, [stage]);

  const triggerAttack = async (variantIndex: number = 0) => {
    if (isAttacking) return;
    const variant = ATTACK_VARIANTS[variantIndex] || ATTACK_VARIANTS[0];
    setAttacking(true);

    let compiledTasks: SoarTask[] = [];
    const customYaml = playbookRegistry[variant.playbook];
    if (customYaml) {
      const stepRegex = /-\s*id:\s*([^\s\n]+)\n\s*name:\s*([^\n]+)/g;
      let match;
      while ((match = stepRegex.exec(customYaml)) !== null) {
        const key = match[1].replace(/['"]/g, "").trim();
        const label = match[2].replace(/['"]/g, "").trim();
        compiledTasks.push({ key, label, done: false });
      }
    }
    if (compiledTasks.length === 0) {
      compiledTasks = variant.tasks.map((t) => ({ ...t, done: false }));
    }
    setSoarTasks(compiledTasks);
    triggerAudioAlert(variant.severity);

    const attackerIp =
      variant.id === "zero_day"
        ? `185.220.${100 + Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 250)}`
        : variant.id === "sql_injection"
          ? `45.83.${120 + Math.floor(Math.random() * 30)}.${Math.floor(Math.random() * 250)}`
          : `198.51.100.${10 + Math.floor(Math.random() * 80)}`;

    const hash = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const incidentId = `INC-${100000 + Math.floor(Math.random() * 900000)}`;

    addNotification("attack", `Cyber attack simulation triggered: ${variant.name} from IP ${attackerIp}`);

    let attackDstIp = CORPORATE_NET.apiGateway;
    if (variant.id === "sql_injection") {
      attackDstIp = CORPORATE_NET.database;
    } else if (variant.id === "dns_tunneling") {
      attackDstIp = CORPORATE_NET.dnsResolver;
    } else if (variant.id === "stealth_backdoor") {
      attackDstIp = CORPORATE_NET.domainController;
    } else if (variant.id === "supply_chain_apt") {
      attackDstIp = CORPORATE_NET.apiGateway;
    } else if (variant.id === "oauth_hijack") {
      attackDstIp = CORPORATE_NET.domainController;
    } else if (variant.id === "ai_jailbreak") {
      attackDstIp = CORPORATE_NET.apiGateway;
    }

    const incomingLog = {
      source: variant.source,
      src_ip: attackerIp,
      dst_ip: attackDstIp,
      message: variant.message,
      severity: variant.severity,
      anomaly: variant.anomaly,
      hash,
    };

    const incident = {
      id: incidentId,
      title: variant.title,
      src_ip: attackerIp,
      anomaly: variant.anomaly,
      status: "investigating",
      playbook: variant.playbook,
      vt_verdict: variant.vtVerdict,
    };

    if (!user) {
      // Local-only simulation fallback when unauthenticated
      const localLog: LogEntry = {
        id: incomingLog.hash || `log-${Math.random().toString(36).substr(2, 9)}`,
        ts: Date.now(),
        source: incomingLog.source as any,
        srcIp: incomingLog.src_ip,
        dstIp: incomingLog.dst_ip,
        message: incomingLog.message,
        severity: incomingLog.severity as any,
        anomaly: incomingLog.anomaly,
        hash: incomingLog.hash,
      };
      setLogs((prev) => {
        if (prev.some((log) => log.id === localLog.id)) {
          return prev;
        }
        return [localLog, ...prev].slice(0, 200);
      });

      const localIncident: Incident = {
        id: incident.id,
        ts: Date.now(),
        title: incident.title,
        srcIp: incident.src_ip,
        anomaly: incident.anomaly,
        status: incident.status as any,
        playbook: incident.playbook,
        vtVerdict: incident.vt_verdict as any,
        payloadHash: variant.payloadHash,
      };
      setIncidents((prev) => [localIncident, ...prev]);

      // Trigger pipeline stages locally
      const isCatastrophic = variant.id === "catastrophic_wipe";
      const steps: { stage: PipelineStage; delay: number }[] = isCatastrophic
        ? [
            { stage: "collection", delay: 0 },
            { stage: "processing", delay: 800 },
            { stage: "analysis", delay: 1700 },
            { stage: "alert", delay: 2700 },
            { stage: "response", delay: 3500 },
          ]
        : [
            { stage: "collection", delay: 0 },
            { stage: "processing", delay: 800 },
            { stage: "analysis", delay: 1700 },
            { stage: "alert", delay: 2700 },
            { stage: "response", delay: 3500 },
            { stage: "logging", delay: 6500 },
            { stage: "complete", delay: 7500 },
          ];

      setActive(localIncident);

      if (isCatastrophic) {
        setMetrics((m) => ({
          ...m,
          alertsToday: m.alertsToday + 45,
          blockedIps: m.blockedIps + 480,
          meanResponseSec: 999,
        }));
      }

      timers.current.forEach(clearTimeout);
      timers.current = [];

      steps.forEach(({ stage: s, delay }) => {
        const t = setTimeout(() => {
          setStage(s);
          if (s === "analysis") {
            setSeries((prev) => {
              if (prev.length === 0) return prev;
              const next = [...prev];
              const lastIdx = next.length - 1;
              next[lastIdx] = {
                ...next[lastIdx],
                anomalies: Math.round(next[lastIdx].anomalies + variant.anomaly * (isCatastrophic ? 4.5 : 0.4)),
                events: Math.round(next[lastIdx].events + (isCatastrophic ? 1200 : 0)),
                blocked: Math.round(next[lastIdx].blocked + (isCatastrophic ? 250 : 0)),
              };
              return next;
            });
          }
        }, delay);
        timers.current.push(t);
      });

      // Update tasks sequentially in local state
      compiledTasks.forEach((task, i) => {
        if (isCatastrophic && i > 0) return; // Stall subsequent tasks indefinitely
        const t = setTimeout(() => {
          setSoarTasks((prev) =>
            prev.map((tk) => (tk.key === task.key ? { ...tk, done: true } : tk))
          );
          addNotification("playbook", `SOAR Action Completed: ${task.label}`);
        }, 3800 + i * 500);
        timers.current.push(t);
      });

      if (!isCatastrophic) {
        // Complete incident resolution at end locally
        const finish = setTimeout(() => {
          setIncidents((prev) =>
            prev.map((inc) => (inc.id === incidentId ? { ...inc, status: "resolved" } : inc))
          );

          setMetrics((m) => ({
            ...m,
            alertsToday: m.alertsToday + 1,
            blockedIps: m.blockedIps + 1,
            meanResponseSec: Math.round((m.meanResponseSec + 7) / 2),
          }));

          setSeries((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIdx = next.length - 1;
            next[lastIdx] = {
              ...next[lastIdx],
              blocked: next[lastIdx].blocked + 1,
            };
            return next;
          });

          addNotification("remediation", `Mitigation Complete: Incident ${incidentId} has been fully mitigated. WAF rules locked.`);

          setStage("idle");
          setActive(null);
          setAttacking(false);
        }, 9000);
        timers.current.push(finish);
      } else {
        // Send a system warning alert
        addNotification("attack", `SOAR CRITICAL ALARM: Automatic playbook execution stalled on incident ${incidentId}. Manual override mandatory!`);
      }
      return;
    }

    try {
      // 1. Insert incident and log to database
      await supabase.from("incidents").insert(incident);
      await supabase.from("logs").insert(incomingLog);

      // 2. Insert tasks
      const tasksToInsert = compiledTasks.map((t) => ({
        incident_id: incidentId,
        key: t.key,
        label: t.label,
        done: false,
      }));
      await supabase.from("soar_tasks").insert(tasksToInsert);

      // Trigger pipeline stages locally
      const isCatastrophic = variant.id === "catastrophic_wipe";
      const steps: { stage: PipelineStage; delay: number }[] = isCatastrophic
        ? [
            { stage: "collection", delay: 0 },
            { stage: "processing", delay: 800 },
            { stage: "analysis", delay: 1700 },
            { stage: "alert", delay: 2700 },
            { stage: "response", delay: 3500 },
          ]
        : [
            { stage: "collection", delay: 0 },
            { stage: "processing", delay: 800 },
            { stage: "analysis", delay: 1700 },
            { stage: "alert", delay: 2700 },
            { stage: "response", delay: 3500 },
            { stage: "logging", delay: 6500 },
            { stage: "complete", delay: 7500 },
          ];

      setActive({
        ...mapIncidentFromDb(incident),
        payloadHash: variant.payloadHash,
      });

      if (isCatastrophic) {
        setMetrics((m) => ({
          ...m,
          alertsToday: m.alertsToday + 45,
          blockedIps: m.blockedIps + 480,
          meanResponseSec: 999,
        }));
      }

      timers.current.forEach(clearTimeout);
      timers.current = [];

      steps.forEach(({ stage: s, delay }) => {
        const t = setTimeout(() => {
          setStage(s);
          if (s === "analysis") {
            setSeries((prev) => {
              if (prev.length === 0) return prev;
              const next = [...prev];
              const lastIdx = next.length - 1;
              next[lastIdx] = {
                ...next[lastIdx],
                anomalies: Math.round(next[lastIdx].anomalies + variant.anomaly * (isCatastrophic ? 4.5 : 0.4)),
                events: Math.round(next[lastIdx].events + (isCatastrophic ? 1200 : 0)),
                blocked: Math.round(next[lastIdx].blocked + (isCatastrophic ? 250 : 0)),
              };
              return next;
            });
          }
        }, delay);
        timers.current.push(t);
      });

      // Update tasks sequentially in database to sync UI clients
      compiledTasks.forEach((task, i) => {
        if (isCatastrophic && i > 0) return; // Stall subsequent tasks indefinitely
        const t = setTimeout(async () => {
          await supabase
            .from("soar_tasks")
            .update({ done: true })
            .eq("incident_id", incidentId)
            .eq("key", task.key);
        }, 3800 + i * 500);
        timers.current.push(t);
      });

      if (!isCatastrophic) {
        // Complete incident resolution at end
        const finish = setTimeout(async () => {
          await supabase
            .from("incidents")
            .update({ status: "resolved" })
            .eq("id", incidentId);

          setMetrics((m) => ({
            ...m,
            alertsToday: m.alertsToday + 1,
            blockedIps: m.blockedIps + 1,
            meanResponseSec: Math.round((m.meanResponseSec + 7) / 2),
          }));

          setSeries((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIdx = next.length - 1;
            next[lastIdx] = {
              ...next[lastIdx],
              blocked: next[lastIdx].blocked + 1,
            };
            return next;
          });

          addNotification("remediation", `Mitigation Complete: Incident ${incidentId} has been fully mitigated. WAF rules locked.`);

          setStage("idle");
          setActive(null);
          setAttacking(false);
        }, 9000);
        timers.current.push(finish);
      } else {
        // Send a system warning alert
        addNotification("attack", `SOAR CRITICAL ALARM: Automatic playbook execution stalled on incident ${incidentId}. Manual override mandatory!`);
      }
    } catch (err) {
      console.error("Failed to execute database-driven attack trigger:", err);
      setAttacking(false);
    }
  };

  const manualOverrideRecovery = async () => {
    if (!activeIncident || activeIncident.playbook !== "PB-Emergency-System-Override") return;
    
    if (!user) {
      // Local fallback manual recovery
      setSoarTasks((prev) => prev.map((t) => ({ ...t, done: true })));
      setIncidents((prev) =>
        prev.map((i) => (i.id === activeIncident.id ? { ...i, status: "resolved" } : i))
      );
      setStage("complete");
      setTimeout(() => {
        setStage("idle");
        setActive(null);
        setAttacking(false);
        addNotification("remediation", "MANUAL recovery override successful. All system layers restored to nominal health.");
      }, 2000);
      return;
    }

    // Resolve all SOAR tasks in database
    await supabase
      .from("soar_tasks")
      .update({ done: true })
      .eq("incident_id", activeIncident.id);

    // Update incident status to resolved
    await supabase
      .from("incidents")
      .update({ status: "resolved" })
      .eq("id", activeIncident.id);

    // Move stage to complete
    setStage("complete");
    
    // Trigger reset after 2 seconds
    setTimeout(() => {
      setStage("idle");
      setActive(null);
      setAttacking(false);
      addNotification("remediation", "MANUAL recovery override successful. All system layers restored to nominal health.");
    }, 2000);
  };

  return (
    <Ctx.Provider
      value={{
        logs,
        incidents,
        stage,
        activeIncident,
        soarTasks,
        metrics,
        series,
        triggerAttack,
        manualOverrideRecovery,
        isAttacking,
        searchQuery,
        setSearchQuery,
        notifications,
        markNotificationRead,
        clearNotifications,
        clusters,
        complianceScore,
        playbookRegistry,
        savePlaybookYaml,
        triggerAudioAlert,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSim() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSim must be inside SimulationProvider");
  return v;
}