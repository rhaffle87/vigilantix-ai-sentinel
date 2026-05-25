import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  User,
  Users,
  Settings,
  Globe,
  Sliders,
  Check,
  Save,
  Shield,
  Activity,
  Copy,
  Lock,
  Wifi,
  ChevronRight,
  Plus,
  RefreshCw,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/account")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: AccountPage,
  head: () => ({ meta: [{ title: "Operator Profile & Preferences · VIGILANTIX AI" }] }),
});

interface Preferences {
  region: string;
  cluster: string;
  minSeverity: string;
  audioAlerts: boolean;
  feeds: string[];
}

const DEFAULT_PREFERENCES: Preferences = {
  region: "global",
  cluster: "production",
  minSeverity: "info",
  audioAlerts: true,
  feeds: ["mitre", "cisa"],
};

interface Operator {
  id: string;
  name: string;
  role: string;
  status: "active" | "standby" | "off-duty";
  ip: string;
}

const INITIAL_OPERATORS: Operator[] = [
  { id: "OP-01", name: "Rafli A. I. Hartono", role: "Owner & Lead Architect", status: "active", ip: "10.0.0.1" },
  { id: "OP-02", name: "Sarah Jenkins", role: "Threat Intel Analyst", status: "standby", ip: "10.0.4.15" },
  { id: "OP-03", name: "Marcus Vance", role: "SecOps Incident Responder", status: "off-duty", ip: "10.0.2.8" },
  { id: "OP-04", name: "AI-Sentinel Autonomous Agent", role: "Autonomous SOAR Operator", status: "active", ip: "127.0.0.1" },
];

function AccountPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [operators, setOperators] = useState<Operator[]>(INITIAL_OPERATORS);
  const [newOpName, setNewOpName] = useState("");
  const [newOpRole, setNewOpRole] = useState("SecOps Specialist");
  const [newOpStatus, setNewOpStatus] = useState<"active" | "standby" | "off-duty">("active");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`vigilantix_prefs_${user.id}`);
      if (stored) {
        try {
          setPreferences(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse preferences", e);
        }
      }
    }
  }, [user]);

  const handleSavePreferences = () => {
    if (user?.id) {
      localStorage.setItem(`vigilantix_prefs_${user.id}`, JSON.stringify(preferences));
      toast.success("Preferences updated", {
        description: "Environment config synchronized with local terminal agent.",
      });
    }
  };

  const handleCopyUid = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setIsCopied(true);
      toast.success("Copied to clipboard", {
        description: "User UUID copied successfully.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRegisterOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) {
      toast.error("Invalid input", {
        description: "Operator name cannot be empty.",
      });
      return;
    }

    const newOp: Operator = {
      id: `OP-${String(operators.length + 1).padStart(2, "0")}`,
      name: newOpName.trim(),
      role: newOpRole,
      status: newOpStatus,
      ip: `10.0.5.${Math.floor(Math.random() * 254) + 1}`,
    };

    setOperators([...operators, newOp]);
    setNewOpName("");
    setIsRegistering(false);
    toast.success("Operator registered", {
      description: `${newOp.name} added to authorized SOC roster.`,
    });
  };

  const handleToggleFeed = (feed: string) => {
    setPreferences((prev) => {
      const feeds = prev.feeds.includes(feed)
        ? prev.feeds.filter((f) => f !== feed)
        : [...prev.feeds, feed];
      return { ...prev, feeds };
    });
  };

  const activeRegionName = {
    global: "Global Mesh Network",
    us_east: "US-East-1 (N. Virginia)",
    eu_west: "EU-West-1 (Dublin)",
    ap_southeast: "AP-Southeast-3 (Jakarta)",
  }[preferences.region] || preferences.region;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header section */}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Security Clearance Level III</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Operator Profile & Terminal Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure default monitoring targets, preferred environments, and view active authorized terminal operators.
          </p>
        </div>

        {/* Top Split Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Identity Card */}
          <div className="rounded-lg border border-border bg-card p-5 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary font-mono">
                  Clearance: Admin
                </span>
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-success font-mono">
                  <Wifi className="h-3 w-3 animate-pulse" /> Terminal Connected
                </span>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-primary text-xl font-bold text-primary-foreground select-none shadow-lg shadow-primary/20">
                  {user?.email ? user.email.split("@")[0].slice(0, 2).toUpperCase() : "OP"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg tracking-tight text-foreground">
                    {user?.email ? user.email.split("@")[0] : "Active Operator"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {user?.email || "anonymous-operator@vigilantix.ai"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs font-mono">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">User ID</span>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <span className="truncate max-w-[140px]" title={user?.id}>
                      {user?.id || "N/A"}
                    </span>
                    {user?.id && (
                      <button
                        onClick={handleCopyUid}
                        className="text-muted-foreground hover:text-accent transition-colors"
                        aria-label="Copy User ID"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Assigned Role</span>
                  <span className="text-foreground text-right font-medium">SOC Administrator</span>
                </div>

                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Auth Provider</span>
                  <span className="text-foreground capitalize">{user?.app_metadata?.provider || "Supabase Auth"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session Status</span>
                  <span className="text-accent font-semibold flex items-center gap-1">
                    <Lock className="h-3 w-3" /> SECURED
                  </span>
                </div>
              </div>
            </div>

            <div className="relative border-t border-border/40 pt-4 mt-4 flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span>Session Initialized: {new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Preferences Configuration */}
          <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                <Settings className="h-4 w-4 text-accent" /> Preferred Environment Settings
              </h3>
              <button
                onClick={handleSavePreferences}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1 shadow-sm shadow-primary/25"
              >
                <Save className="h-3 w-3" /> Save Config
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-accent" /> Default Deployment Region
                </label>
                <select
                  value={preferences.region}
                  onChange={(e) => setPreferences({ ...preferences, region: e.target.value })}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="global">Global Mesh Network</option>
                  <option value="us_east">US-East-1 (N. Virginia)</option>
                  <option value="eu_west">EU-West-1 (Dublin)</option>
                  <option value="ap_southeast">AP-Southeast-3 (Jakarta)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-accent" /> Target Cluster Scope
                </label>
                <select
                  value={preferences.cluster}
                  onChange={(e) => setPreferences({ ...preferences, cluster: e.target.value })}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="production">Production EKS Clusters</option>
                  <option value="staging">Staging & Sandbox Nodes</option>
                  <option value="hybrid">All Hybrid-Cloud Networks</option>
                  <option value="isolated">Isolated DR VPC Block</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-accent" /> Minimum Ingestion Severity
                </label>
                <select
                  value={preferences.minSeverity}
                  onChange={(e) => setPreferences({ ...preferences, minSeverity: e.target.value })}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="info">Info - Load All Stream Messages</option>
                  <option value="warn">Warning - Filter Suspicious Activities</option>
                  <option value="critical">Critical - Alert Severe Incidents Only</option>
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                <div className="flex items-center justify-between rounded-md border border-border/80 bg-muted/15 p-2">
                  <span className="text-xs font-medium text-muted-foreground">Audio Severity Alerts</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={preferences.audioAlerts}
                      onChange={(e) => setPreferences({ ...preferences, audioAlerts: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-muted-foreground/30 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-card after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none" />
                  </label>
                </div>
              </div>
            </div>

            {/* Checkboxes for Threat Feeds */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <label className="text-xs font-semibold text-muted-foreground block">
                Active Threat Intelligence Feeds
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: "mitre", name: "Mitre ATT&CK Feeds" },
                  { id: "alienvault", name: "AlienVault OTX IP" },
                  { id: "shodan", name: "Shodan Port Scans" },
                  { id: "cisa", name: "CISA Known Exploits" },
                  { id: "vt", name: "VirusTotal Hashes" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleToggleFeed(f.id)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition duration-150 ${
                      preferences.feeds.includes(f.id)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                      preferences.feeds.includes(f.id) ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"
                    }`}>
                      {preferences.feeds.includes(f.id) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section - Roster list */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Operator List */}
          <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="space-y-0.5">
                <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                  <Users className="h-4 w-4 text-accent" /> Authorized SOC Operators
                </h3>
                <p className="text-[11px] text-muted-foreground">List of current analysts registered in active SOC rotation.</p>
              </div>
              
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-semibold hover:bg-muted/50 transition duration-150"
              >
                <Plus className="h-3 w-3" /> Register Operator
              </button>
            </div>

            {/* Operator registration form overlay-like card */}
            {isRegistering && (
              <form onSubmit={handleRegisterOperator} className="border border-border/80 bg-muted/10 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent">Register New Security Operator</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Operator Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={newOpName}
                      onChange={(e) => setNewOpName(e.target.value)}
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Operational Role</label>
                    <select
                      value={newOpRole}
                      onChange={(e) => setNewOpRole(e.target.value)}
                      className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      <option value="SecOps Specialist">SecOps Specialist</option>
                      <option value="Incident Responder">Incident Responder</option>
                      <option value="Threat Hunter">Threat Hunter</option>
                      <option value="Compliance Auditor">Compliance Auditor</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Initial Status</label>
                    <select
                      value={newOpStatus}
                      onChange={(e) => setNewOpStatus(e.target.value as any)}
                      className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      <option value="active">Active Now</option>
                      <option value="standby">On Standby</option>
                      <option value="off-duty">Off Duty</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="rounded px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground glow-primary"
                  >
                    Authorize Operator
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground uppercase font-mono text-[9px] tracking-wider">
                    <th className="py-2">Operator ID</th>
                    <th className="py-2">Full Name</th>
                    <th className="py-2">Assigned Role</th>
                    <th className="py-2">Clearance Node IP</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {operators.map((op) => (
                    <tr key={op.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 font-mono text-muted-foreground">{op.id}</td>
                      <td className="py-2.5 font-semibold text-foreground">{op.name}</td>
                      <td className="py-2.5 text-muted-foreground">{op.role}</td>
                      <td className="py-2.5 font-mono text-[11px] text-muted-foreground">{op.ip}</td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          op.status === "active"
                            ? "bg-success/15 text-success"
                            : op.status === "standby"
                              ? "bg-warning/15 text-warning"
                              : "bg-muted text-muted-foreground"
                        }`}>
                          <span className={`h-1 w-1 rounded-full ${
                            op.status === "active"
                              ? "bg-success"
                              : op.status === "standby"
                                ? "bg-warning"
                                : "bg-muted-foreground"
                          }`} />
                          {op.status === "active" ? "Active" : op.status === "standby" ? "Standby" : "Off-duty"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Config Details Summary */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
              <Shield className="h-4 w-4 text-accent" /> Active Terminal Profile
            </h3>
            
            <div className="rounded-md border border-border/80 bg-muted/10 p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Node:</span>
                <span className="text-accent font-semibold">{activeRegionName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Log Severity:</span>
                <span className="text-foreground capitalize">{preferences.minSeverity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Cluster:</span>
                <span className="text-foreground capitalize">{preferences.cluster}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Audio Alerts:</span>
                <span className="text-foreground">{preferences.audioAlerts ? "ON" : "OFF"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intel Sources:</span>
                <span className="text-foreground">{preferences.feeds.length} Active</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <h4 className="text-xs font-semibold text-foreground">Active Policy Audits</h4>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" />
                  <span>Session token rotated every 60 minutes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" />
                  <span>Regional firewalls updated dynamically</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" />
                  <span>Full endpoint audit logs compiled hourly</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
