import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
}

export interface SoarTask {
  key: string;
  label: string;
  done: boolean;
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
  triggerAttack: () => void;
  isAttacking: boolean;
}

const Ctx = createContext<SimState | null>(null);

const SOURCES: LogEntry["source"][] = ["endpoint", "network", "server", "firewall", "auth"];
const MSGS: Record<LogEntry["source"], string[]> = {
  endpoint: ["EDR heartbeat", "Process exec: chrome.exe", "USB device mounted", "DLL load: kernel32"],
  network: ["TCP SYN ack", "DNS query resolved", "TLS handshake ok", "Packet inspect ok"],
  server: ["Nginx 200 /api/health", "DB query 12ms", "Cron job ok", "Container restart"],
  firewall: ["Rule match: allow 443", "Rate limit ok", "GeoIP allow EU", "ACL pass"],
  auth: ["OAuth token refresh", "MFA verify ok", "Session start", "Audit log write"],
};

const randIp = () =>
  `${10 + Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 256)}.${Math.floor(
    Math.random() * 256,
  )}.${Math.floor(Math.random() * 256)}`;

function makeLog(): LogEntry {
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const msgs = MSGS[source];
  const anomaly = Math.random() < 0.05 ? 40 + Math.random() * 40 : Math.random() * 30;
  return {
    id: Math.random().toString(36).slice(2, 10),
    ts: Date.now(),
    source,
    srcIp: randIp(),
    dstIp: randIp(),
    message: msgs[Math.floor(Math.random() * msgs.length)],
    severity: anomaly > 60 ? "warn" : "info",
    anomaly,
  };
}

const INITIAL_TASKS: SoarTask[] = [
  { key: "block_ip", label: "Block malicious IP at edge firewall", done: false },
  { key: "isolate", label: "Isolate infected endpoint device", done: false },
  { key: "notify", label: "Dispatch admin notification (email + pager)", done: false },
  { key: "snapshot", label: "Snapshot endpoint memory for forensics", done: false },
  { key: "ticket", label: "Create incident ticket in audit log", done: false },
];

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    Array.from({ length: 30 }, makeLog).map((l) => ({ ...l, ts: Date.now() - Math.random() * 60000 })),
  );
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "INC-9281",
      ts: Date.now() - 1000 * 60 * 60 * 4,
      title: "Brute force on auth gateway",
      srcIp: "185.220.101.45",
      anomaly: 92,
      status: "resolved",
      playbook: "PB-Auth-Lockdown",
      vtVerdict: "malicious",
    },
    {
      id: "INC-9275",
      ts: Date.now() - 1000 * 60 * 60 * 26,
      title: "Suspicious PowerShell on WIN-EP-22",
      srcIp: "10.0.4.21",
      anomaly: 88,
      status: "resolved",
      playbook: "PB-EDR-Isolate",
      vtVerdict: "suspicious",
    },
  ]);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [activeIncident, setActive] = useState<Incident | null>(null);
  const [soarTasks, setSoarTasks] = useState<SoarTask[]>(INITIAL_TASKS);
  const [isAttacking, setAttacking] = useState(false);

  const [metrics, setMetrics] = useState({
    eventsPerSec: 1248,
    alertsToday: 27,
    blockedIps: 412,
    meanResponseSec: 38,
  });

  const [series, setSeries] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      t: `${String(i).padStart(2, "0")}:00`,
      events: 800 + Math.floor(Math.random() * 800),
      anomalies: Math.floor(Math.random() * 35),
      blocked: Math.floor(Math.random() * 18),
    })),
  );

  // Live log stream
  useEffect(() => {
    const id = setInterval(() => {
      setLogs((prev) => [makeLog(), ...prev].slice(0, 200));
      setMetrics((m) => ({
        ...m,
        eventsPerSec: 1100 + Math.floor(Math.random() * 400),
      }));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  // Series rotation
  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const next = [...prev.slice(1), {
          t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          events: 800 + Math.floor(Math.random() * 800),
          anomalies: Math.floor(Math.random() * 35),
          blocked: Math.floor(Math.random() * 18),
        }];
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerAttack = () => {
    if (isAttacking) return;
    setAttacking(true);
    setSoarTasks(INITIAL_TASKS.map((t) => ({ ...t, done: false })));
    const attackerIp = `185.220.${100 + Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 250)}`;
    const hash = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const incidentId = `INC-${9300 + Math.floor(Math.random() * 99)}`;
    const incoming: LogEntry = {
      id: Math.random().toString(36).slice(2, 10),
      ts: Date.now(),
      source: "network",
      srcIp: attackerIp,
      dstIp: "10.0.0.12",
      message: "Inbound exploit payload — suspected CVE-2024-31337",
      severity: "critical",
      anomaly: 94 + Math.random() * 5,
      hash,
    };

    const incident: Incident = {
      id: incidentId,
      ts: Date.now(),
      title: "Zero-day exploit attempt on edge gateway",
      srcIp: attackerIp,
      anomaly: incoming.anomaly,
      status: "investigating",
      playbook: "PB-Critical-Containment",
      vtVerdict: "malicious",
    };

    const steps: { stage: PipelineStage; delay: number }[] = [
      { stage: "collection", delay: 0 },
      { stage: "processing", delay: 800 },
      { stage: "analysis", delay: 1700 },
      { stage: "alert", delay: 2700 },
      { stage: "response", delay: 3500 },
      { stage: "logging", delay: 6500 },
      { stage: "complete", delay: 7500 },
    ];

    setActive(incident);
    setLogs((p) => [incoming, ...p]);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    steps.forEach(({ stage: s, delay }) => {
      const t = setTimeout(() => setStage(s), delay);
      timers.current.push(t);
    });

    // SOAR task progression staggered during "response"
    INITIAL_TASKS.forEach((task, i) => {
      const t = setTimeout(() => {
        setSoarTasks((prev) => prev.map((x) => (x.key === task.key ? { ...x, done: true } : x)));
      }, 3800 + i * 500);
      timers.current.push(t);
    });

    const finish = setTimeout(() => {
      setIncidents((prev) => [{ ...incident, status: "resolved" }, ...prev]);
      setMetrics((m) => ({
        ...m,
        alertsToday: m.alertsToday + 1,
        blockedIps: m.blockedIps + 1,
        meanResponseSec: Math.round((m.meanResponseSec + 7) / 2),
      }));
      setStage("idle");
      setActive(null);
      setAttacking(false);
    }, 9000);
    timers.current.push(finish);
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
        isAttacking,
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