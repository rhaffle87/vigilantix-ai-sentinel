import React, { useMemo, useState } from "react";
import { useSim, CORPORATE_NET } from "@/context/SimulationContext";
import { Activity, AlertTriangle } from "lucide-react";

interface NodeStats {
  id: string;
  name: string;
  ip: string;
  type: string;
  packets: number;
  health: number;
  x: number;
  y: number;
}

// Native SVG icons — 20×20, each semantically matched to the node type
const NODE_ICONS: Record<string, React.ReactNode> = {
  attacker: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="6" />
      <path d="M9 17v1a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1" />
      <circle cx="9.5" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="9" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 13.5c0 .8.9 1.5 2.5 1.5s2.5-.7 2.5-1.5" />
    </svg>
  ),
  gateway: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="7" rx="1.5" />
      <rect x="2" y="14" width="20" height="7" rx="1.5" />
      <circle cx="6" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="6" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
      <line x1="10" y1="6.5" x2="19" y2="6.5" />
      <line x1="10" y1="17.5" x2="19" y2="17.5" />
    </svg>
  ),
  ad: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 5v6c0 4.5 3.3 8.7 8 10 4.7-1.3 8-5.5 8-10V5l-8-3z" />
      <circle cx="12" cy="10.5" r="2.2" />
      <path d="M12 12.7v2.8" />
    </svg>
  ),
  dns: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8.5a13.5 13.5 0 0 1 20 0" />
      <path d="M5.5 12a9 9 0 0 1 13 0" />
      <path d="M9 15.5a4.5 4.5 0 0 1 6 0" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5.5" rx="8.5" ry="2.5" />
      <path d="M3.5 5.5v4c0 1.4 3.8 2.5 8.5 2.5s8.5-1.1 8.5-2.5v-4" />
      <path d="M3.5 9.5v4c0 1.4 3.8 2.5 8.5 2.5s8.5-1.1 8.5-2.5v-4" />
      <path d="M3.5 13.5v4c0 1.4 3.8 2.5 8.5 2.5s8.5-1.1 8.5-2.5v-4" />
    </svg>
  ),
};

export function NetworkTopology() {
  const { activeIncident, stage } = useSim();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = useMemo<NodeStats[]>(() => {
    const isWiper = activeIncident?.title.toLowerCase().includes("wiper");
    return [
      {
        id: "attacker",
        name: "External Attacker Subnet",
        ip: activeIncident ? activeIncident.srcIp : "185.220.101.44",
        type: "Threat Source",
        packets: activeIncident ? 1420 : 12,
        health: activeIncident ? 100 : 0,
        x: 60,
        y: 155,
      },
      {
        id: "gateway",
        name: "Edge Web Gateway",
        ip: CORPORATE_NET.apiGateway,
        type: "DMZ Gateway Proxy",
        packets: activeIncident ? 5240 : 1120,
        health: isWiper ? 12.45 : activeIncident ? 88.4 : 99.9,
        x: 230,
        y: 155,
      },
      {
        id: "ad",
        name: "Active Directory DS",
        ip: CORPORATE_NET.domainController,
        type: "Identity Controller",
        packets:
          activeIncident?.title.toLowerCase().includes("backdoor") ||
          activeIncident?.title.toLowerCase().includes("oauth")
            ? 3420
            : 340,
        health: isWiper
          ? 10.15
          : activeIncident?.title.toLowerCase().includes("backdoor")
          ? 42.1
          : activeIncident?.title.toLowerCase().includes("oauth")
          ? 74.8
          : 99.8,
        x: 400,
        y: 70,
      },
      {
        id: "dns",
        name: "Recursive DNS Resolver",
        ip: CORPORATE_NET.dnsResolver,
        type: "Internal DNS Directory",
        packets: activeIncident?.title.toLowerCase().includes("dns") ? 2980 : 420,
        health: isWiper
          ? 15.3
          : activeIncident?.title.toLowerCase().includes("dns")
          ? 38.6
          : 99.9,
        x: 400,
        y: 155,
      },
      {
        id: "database",
        name: "Primary DB Cluster",
        ip: CORPORATE_NET.database,
        type: "Production MSSQL Database",
        packets: activeIncident?.title.toLowerCase().includes("sql") ? 4180 : 890,
        health: isWiper
          ? 9.8
          : activeIncident?.title.toLowerCase().includes("sql")
          ? 48.2
          : 99.9,
        x: 400,
        y: 240,
      },
    ];
  }, [activeIncident]);

  const attackedNodeId = useMemo(() => {
    if (!activeIncident) return null;
    const t = activeIncident.title.toLowerCase();
    if (t.includes("sql")) return "database";
    if (t.includes("dns")) return "dns";
    if (t.includes("backdoor") || t.includes("oauth")) return "ad";
    return "gateway";
  }, [activeIncident]);

  const forcefieldActive = useMemo(
    () => activeIncident && ["response", "logging", "complete"].includes(stage),
    [activeIncident, stage]
  );

  const targetNode = nodes.find((n) => n.id === attackedNodeId);
  const gatewayNode = nodes.find((n) => n.id === "gateway")!;
  const attackerNode = nodes.find((n) => n.id === "attacker")!;

  return (
    <div
      onClick={() => setHoveredNode(null)}
      className="relative w-full h-[320px] bg-card border border-border/80 rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <Activity
            className={`w-4 h-4 ${activeIncident ? "text-red-500 animate-pulse" : "text-emerald-500"}`}
          />
          <span className="font-mono text-xs font-semibold tracking-wider uppercase text-foreground/80">
            Interactive Network Topology
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
            <span className="text-muted-foreground">Secure Node</span>
          </div>
          {activeIncident && (
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/30 animate-ping" />
              <span className="text-red-400 font-bold uppercase">Attack Target</span>
            </div>
          )}
          {forcefieldActive && (
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-500/20 animate-pulse" />
              <span className="text-sky-400 font-bold uppercase">WAF Forcefield</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG canvas */}
      <div className="relative w-full h-[220px]">
        <svg className="w-full h-full" viewBox="0 0 480 290">
          <defs>
            <pattern id="topoGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.3 0.04 260 / 25%)" strokeWidth="0.5" />
            </pattern>
            <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="forcefieldGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="100%" height="100%" fill="url(#topoGrid)" rx="6" />

          {/* Attacker → Gateway threat line */}
          {activeIncident && (
            <line
              x1={attackerNode.x}
              y1={attackerNode.y}
              x2={gatewayNode.x}
              y2={gatewayNode.y}
              stroke={forcefieldActive && attackedNodeId === "gateway" ? "var(--border)" : "#ef4444"}
              strokeWidth="2.5"
              strokeDasharray={forcefieldActive && attackedNodeId === "gateway" ? "6,4" : "none"}
            />
          )}

          {/* Gateway → inner-node Bezier links */}
          {nodes
            .filter((n) => n.id !== "attacker" && n.id !== "gateway")
            .map((n) => {
              const isTargeted = n.id === attackedNodeId;
              const lineColor = activeIncident && isTargeted
                ? forcefieldActive ? "#0ea5e9" : "#ef4444"
                : "oklch(0.5 0.08 260 / 40%)";
              return (
                <path
                  key={`link-${n.id}`}
                  d={`M ${gatewayNode.x} ${gatewayNode.y} C ${(gatewayNode.x + n.x) / 2} ${gatewayNode.y}, ${(gatewayNode.x + n.x) / 2} ${n.y}, ${n.x} ${n.y}`}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={activeIncident && isTargeted ? "2.5" : "1.5"}
                  className="transition-all duration-500"
                />
              );
            })}

          {/* Idle ambient green packets */}
          {!activeIncident &&
            nodes
              .filter((n) => n.id !== "attacker" && n.id !== "gateway")
              .map((n, i) => (
                <circle key={`pkt-${n.id}`} r="3" fill="#10b981" filter="url(#nodeGlow)">
                  <animateMotion
                    path={`M ${gatewayNode.x} ${gatewayNode.y} C ${(gatewayNode.x + n.x) / 2} ${gatewayNode.y}, ${(gatewayNode.x + n.x) / 2} ${n.y}, ${n.x} ${n.y}`}
                    dur={`${2 + i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}

          {/* Active red attack laser packets */}
          {activeIncident && !forcefieldActive && targetNode && (
            <>
              <circle r="5" fill="#f43f5e" filter="url(#nodeGlow)">
                <animateMotion
                  path={`M ${attackerNode.x} ${attackerNode.y} L ${gatewayNode.x} ${gatewayNode.y}`}
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="5" fill="#f43f5e" filter="url(#nodeGlow)">
                <animateMotion
                  path={`M ${gatewayNode.x} ${gatewayNode.y} C ${(gatewayNode.x + targetNode.x) / 2} ${gatewayNode.y}, ${(gatewayNode.x + targetNode.x) / 2} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`}
                  dur="1.2s"
                  begin="0.2s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}

          {/* WAF forcefield deflect packets */}
          {forcefieldActive && targetNode && (
            <>
              <circle r="5" fill="#0ea5e9" filter="url(#nodeGlow)">
                <animateMotion
                  path={`M ${attackerNode.x} ${attackerNode.y} L ${gatewayNode.x - 28} ${gatewayNode.y}`}
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="3.5" fill="#0284c7">
                <animateMotion
                  path={`M ${gatewayNode.x - 28} ${gatewayNode.y} L ${attackerNode.x} ${attackerNode.y}`}
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}

          {/* Forcefield ring */}
          {forcefieldActive && targetNode && (
            <circle
              cx={targetNode.x}
              cy={targetNode.y}
              r="30"
              fill="rgba(14,165,233,0.10)"
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeDasharray="4,4"
              filter="url(#forcefieldGlow)"
              className="animate-[spin_10s_linear_infinite]"
            />
          )}

          {/* ── Node rendering ── */}
          {nodes
            .filter((n) => n.id !== "attacker" || activeIncident)
            .map((n) => {
              const isTargeted = n.id === attackedNodeId;
              const isHovered = hoveredNode === n.id;

              // Derive colors from node state
              let strokeColor: string;
              let fillColor: string;
              let iconColor: string;

              if (n.id === "attacker") {
                strokeColor = "#f43f5e";
                fillColor = "oklch(0.14 0.07 10)";
                iconColor = "#fb7185";
              } else if (n.health < 20) {
                strokeColor = "#ef4444";
                fillColor = "oklch(0.14 0.06 10)";
                iconColor = "#f87171";
              } else if (n.health < 80) {
                strokeColor = "#f59e0b";
                fillColor = "oklch(0.15 0.05 60)";
                iconColor = "#fbbf24";
              } else {
                strokeColor = "#10b981";
                fillColor = "oklch(0.15 0.04 160)";
                iconColor = "#34d399";
              }

              if (isTargeted && !forcefieldActive) strokeColor = "#f43f5e";
              if (isTargeted && forcefieldActive) strokeColor = "#0ea5e9";
              if (isHovered) strokeColor = "var(--accent)";

              const NODE_R = 24; // node circle radius
              const ICON_SIZE = 20; // icon bounding box

              return (
                <g
                  key={n.id}
                  onMouseEnter={() => setHoveredNode(n.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoveredNode(hoveredNode === n.id ? null : n.id);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {/* Animated ping ring on attacked/critical nodes */}
                  {(isTargeted || n.health < 20) && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={NODE_R + 6}
                      fill="none"
                      stroke={n.health < 20 ? "#ef4444" : forcefieldActive ? "#0ea5e9" : "#f43f5e"}
                      strokeWidth="1.5"
                      className="animate-ping opacity-40"
                    />
                  )}

                  {/* Main node circle */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={NODE_R}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isHovered || isTargeted ? "2.5" : "1.5"}
                    style={{ transition: "all 0.3s" }}
                  />

                  {/* Icon via foreignObject — centered in the node */}
                  <foreignObject
                    x={n.x - ICON_SIZE / 2}
                    y={n.y - ICON_SIZE / 2}
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                  >
                    <div
                      style={{
                        width: ICON_SIZE,
                        height: ICON_SIZE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: iconColor,
                      }}
                    >
                      {NODE_ICONS[n.id]}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
        </svg>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-popover/95 border border-border/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {(() => {
            const node = nodes.find((n) => n.id === hoveredNode)!;
            const isAttacked = node.id === attackedNodeId;
            return (
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground">{node.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">({node.ip})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                    <span>Type: {node.type}</span>
                    <span>•</span>
                    <span>Packets: {node.packets.toLocaleString()} ops/s</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">Health</span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        node.health > 80
                          ? "text-emerald-400"
                          : node.health > 40
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {node.health.toFixed(2)}%
                    </span>
                  </div>
                  {isAttacked && (
                    <div className="flex items-center gap-1 bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] font-mono px-1.5 py-0.5 rounded uppercase animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Infiltrated
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-mono text-muted-foreground transition-all duration-200 ${hoveredNode ? "opacity-0 invisible pointer-events-none" : "opacity-100 visible"}`}>
        <span>Subnet Gateway: {CORPORATE_NET.apiGateway}</span>
        <span>•</span>
        <span>Status: Nominal sync channel established</span>
      </div>
    </div>
  );
}

