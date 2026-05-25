import { useState } from "react";
import { Zap, ChevronDown, ChevronUp, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSim, type PipelineStage, ATTACK_VARIANTS } from "@/context/SimulationContext";

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: "collection", label: "Collect" },
  { key: "processing", label: "Process" },
  { key: "analysis", label: "Analyze" },
  { key: "alert", label: "Alert" },
  { key: "response", label: "Respond" },
  { key: "logging", label: "Log" },
];

const ORDER: PipelineStage[] = [
  "idle",
  "collection",
  "processing",
  "analysis",
  "alert",
  "response",
  "logging",
  "complete",
];

export function SimulationController() {
  const [open, setOpen] = useState(true);
  const [selectedAttack, setSelectedAttack] = useState(0);
  const { triggerAttack, isAttacking, stage, activeIncident, manualOverrideRecovery } = useSim();
  const idx = ORDER.indexOf(stage);

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 w-auto sm:w-[340px] rounded-lg border border-border bg-card/95 backdrop-blur shadow-2xl glow-primary">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
            Simulation Controller
          </span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="toggle"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 p-3">
          <p className="text-xs text-muted-foreground">
            Inject a synthetic high-severity payload and watch the 6-stage SOC to SOAR
            pipeline execute end-to-end.
          </p>

          <div className="space-y-1">
            <label htmlFor="attack-select" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Select Attack Vector
            </label>
            <select
              id="attack-select"
              value={selectedAttack}
              onChange={(e) => setSelectedAttack(Number(e.target.value))}
              disabled={isAttacking}
              className="w-full rounded border border-border bg-background/50 backdrop-blur px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            >
              {ATTACK_VARIANTS.map((v, i) => (
                <option key={v.id} value={i} className="bg-card">
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => triggerAttack(selectedAttack)}
            disabled={isAttacking}
            className="w-full bg-gradient-alert text-destructive-foreground font-semibold uppercase tracking-wider hover:opacity-90 glow-alert"
          >
            {isAttacking ? (
              <>
                <Crosshair className="mr-2 h-4 w-4 animate-spin" />
                Attack in progress…
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Trigger Cyber Attack
              </>
            )}
          </Button>

          <div className="space-y-1">
            {STAGES.map((s, i) => {
              const sIdx = ORDER.indexOf(s.key);
              const active = stage === s.key;
              const done = idx > sIdx && idx > 0;
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-2 rounded px-2 py-1 text-xs transition ${active
                      ? "bg-primary/15 text-primary"
                      : done
                        ? "text-success"
                        : "text-muted-foreground"
                    }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${active
                        ? "border-primary bg-primary/20 animate-flicker"
                        : done
                          ? "border-success bg-success/20"
                          : "border-border"
                      }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span>{s.label}</span>
                  {active && <span className="ml-auto text-[10px]">running…</span>}
                </div>
              );
            })}
          </div>

          {activeIncident && (
            <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-destructive">{activeIncident.id}</span>
                {activeIncident.playbook === "PB-Emergency-System-Override" && (
                  <span className="animate-pulse font-semibold uppercase tracking-widest text-[9px] text-destructive bg-destructive/20 px-1 py-0.5 rounded">
                    STALLED
                  </span>
                )}
              </div>
              <div className="text-foreground">{activeIncident.title}</div>
              <div className="mt-1 text-muted-foreground">
                src: <span className="font-mono text-accent">{activeIncident.srcIp}</span>
              </div>
              {activeIncident.playbook === "PB-Emergency-System-Override" && (
                <Button
                  onClick={manualOverrideRecovery}
                  className="mt-2 w-full bg-success text-success-foreground font-semibold uppercase tracking-wider text-[10px] py-1 h-7"
                >
                  Force Manual Override Recovery
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}