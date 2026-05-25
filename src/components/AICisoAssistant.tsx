import React, { useState, useEffect, useRef } from "react";
import { useSim } from "@/context/SimulationContext";
import { Terminal, Shield, Send, Sparkles, MessageSquare, X, Play, ShieldAlert, Cpu } from "lucide-react";

interface Message {
  sender: "user" | "ciso";
  text: string;
  time: string;
  isCommand?: boolean;
}

export function AICisoAssistant() {
  const { activeIncident, stage, manualOverrideRecovery } = useSim();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ciso",
      text: "VIGILANTIX Virtual CISO initialized. I have complete visibility over your corporate subnet. Ask me anything about current telemetry or active incidents.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Push CISO updates when an attack begins
  useEffect(() => {
    if (activeIncident) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ciso",
            text: `⚠️ CRITICAL INCIDENT REPORTED: ${activeIncident.title}. Source IP: ${activeIncident.srcIp}. Playbook locked: ${activeIncident.playbook}. How would you like me to assist? You can trigger isolation protocols by typing /isolate.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeIncident]);

  const handleSend = (textToSend?: string) => {
    const rawText = textToSend || input;
    if (!rawText.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isCmd = rawText.startsWith("/");

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: rawText, time: userTime, isCommand: isCmd },
    ]);
    if (!textToSend) setInput("");

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const cisoTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let reply = "";

      const normalized = rawText.toLowerCase().trim();

      if (normalized.startsWith("/isolate")) {
        if (activeIncident) {
          if (activeIncident.title.toLowerCase().includes("wiper")) {
            reply = `🤖 COMMAND EXECUTED: /isolate. Core directory takeover detected. Boundary network airgap isolation attempt... STALLED. The host has been completely locked down by administrative wiper processes. Manual emergency SOAR override mandatory! Please click the "FORCE MANUAL OVERRIDE" button.`;
          } else {
            reply = `🤖 COMMAND EXECUTED: /isolate. Securing targeted subnet host. Initiating API block rules and isolating targeted interface at firewall levels. Dynamic WAF forcefield activated! Check the Network Topology map to view packet containment.`;
          }
        } else {
          reply = `🤖 Isolation command ignored: No active host compromise or threat incident detected on local subnets.`;
        }
      } else if (normalized.startsWith("/override") || normalized.includes("override") || normalized.includes("recover")) {
        if (activeIncident) {
          if (activeIncident.title.toLowerCase().includes("wiper")) {
            manualOverrideRecovery?.();
            reply = `🤖 EMERGENCY COMMAND EXECUTION: Initiating manual override token sequence. Overriding active SOAR recovery flags. Database clusters and Domain controllers returning to nominal state. Remediation completed.`;
          } else {
            reply = `🤖 Manual override is only required during Catastrophic Wiper takeovers. Automated playbooks are fully managing the current ${activeIncident.title} incident.`;
          }
        } else {
          reply = `🤖 System is healthy. Manual override recovery sequence is not required.`;
        }
      } else if (normalized.includes("who are you") || normalized.includes("ciso")) {
        reply = `I am Antigravity Virtual CISO, your conversational cyber assistant. I monitor network gateways, databases, and DNS resolvers in real-time, helping SOC operators remediate multi-vector attacks.`;
      } else if (normalized.includes("status") || normalized.includes("healthy") || normalized.includes("health")) {
        if (activeIncident) {
          reply = `🔴 ALERT: System currently degraded under active threat: ${activeIncident.title}. Pipeline stage: ${stage.toUpperCase()}. Sector integrity checks indicate ongoing compromised streams.`;
        } else {
          reply = `🟢 NOMINAL: All corporate subnets, DB clusters, and directory controllers are healthy. Global cluster latencies are stable.`;
        }
      } else {
        reply = `I've analyzed your query regarding our security perimeter. If you suspect an ongoing intrusion or wish to apply mitigation blocks, type "/isolate" to spin up firewalls, or "/override" to execute manual overrides during catastrophic firmware wipes.`;
      }

      setMessages((prev) => [
        ...prev,
        { sender: "ciso", text: reply, time: cisoTime },
      ]);
    }, 1200);
  };

  return (
    <>
      {/* Floating terminal trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[72px] right-4 sm:bottom-6 sm:right-[368px] z-40 bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-3 rounded-full flex items-center gap-2 shadow-2xl hover:scale-105 transition-all duration-300 group border border-border/40 font-semibold"
      >
        <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
        <span className="font-mono text-xs uppercase tracking-wider">Virtual CISO</span>
        {activeIncident && (
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Slide-out Terminal Chat Screen */}
      {isOpen && (
        <div className="fixed bottom-[136px] left-4 right-4 sm:bottom-24 sm:right-[368px] sm:left-auto w-auto sm:w-[420px] h-[480px] sm:h-[520px] bg-card/95 border border-border/80 rounded-2xl shadow-2xl flex flex-col z-40 backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="p-3 border-b border-border/60 bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-accent/20 rounded-md border border-accent/30 text-accent">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Virtual CISO Command Room
                </h4>
                <div className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Agent v2.4 Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-border/60 rounded-md transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat scrolling viewport */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {/* Time / Sender header */}
                <span className="text-[9px] text-muted-foreground mb-1 select-none">
                  {msg.sender === "user" ? "SOC OPERATOR" : "VIRTUAL CISO"} • {msg.time}
                </span>

                {/* Message bubble */}
                <div
                  className={`p-2.5 rounded-xl border text-left leading-relaxed ${
                    msg.sender === "user"
                      ? msg.isCommand
                        ? "bg-accent/10 border-accent/40 text-accent"
                        : "bg-primary border-primary-foreground/15 text-primary-foreground"
                      : "bg-muted/80 border-border/80 text-foreground"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="self-start flex flex-col items-start max-w-[85%]">
                <span className="text-[9px] text-muted-foreground mb-1">VIRTUAL CISO • thinking...</span>
                <div className="bg-muted/80 border border-border/80 p-2.5 rounded-xl flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick-Mitigation Commands Panel */}
          {activeIncident && (
            <div className="p-2 border-t border-border/40 bg-muted/30 flex items-center gap-1.5 overflow-x-auto select-none">
              <span className="font-mono text-[9px] text-red-400 font-bold uppercase shrink-0">Remediate:</span>
              <button
                onClick={() => handleSend("/isolate")}
                className="font-mono text-[10px] font-semibold bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent px-2 py-0.5 rounded transition-all shrink-0"
              >
                /isolate host
              </button>
              {activeIncident.title.toLowerCase().includes("wiper") && (
                <button
                  onClick={() => handleSend("/override")}
                  className="font-mono text-[10px] font-semibold bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-red-400 px-2 py-0.5 rounded transition-all shrink-0 animate-pulse"
                >
                  /override wipe
                </button>
              )}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-border/60 bg-muted/40 flex items-center gap-2">
            <input
              type="text"
              placeholder={activeIncident ? "Type /isolate to isolate targeted server..." : "Ask the CISO..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-card border border-border/80 focus:border-accent/80 px-3 py-2 rounded-lg font-mono text-xs focus:outline-none transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
