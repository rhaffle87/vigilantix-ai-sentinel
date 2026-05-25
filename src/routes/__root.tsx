import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SimulationProvider, useSim } from "@/context/SimulationContext";
import { SimulationController } from "@/components/SimulationController";
import { Toaster } from "@/components/ui/sonner";
import { ShieldAlert, Search, Bell, LogOut, CheckCircle, Cpu, Info, Activity, Trash2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useMounted } from "@/hooks/use-mounted";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message || "Something went wrong on our end. You can try refreshing or head back home."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VIGILANTIX AI — SOC-SOAR Platform" },
      { name: "description", content: "AI-driven Security Operations & Automated Response platform." },
      { name: "author", content: "VIGILANTIX AI" },
      { property: "og:title", content: "VIGILANTIX AI — SOC-SOAR Platform" },
      { property: "og:description", content: "Real-time threat monitoring, AI anomaly detection, and SOAR automation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.navigate({ to: "/login" });
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
        {/* Futuristic subtle network line background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            {/* Spinning accent circle */}
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-accent" />
            {/* Inner pulsing shield core */}
            <div className="h-8 w-8 animate-pulse rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
              <ShieldAlert className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent animate-pulse">
              Authenticating Terminal
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              Establishing encrypted tunnel to Vigilantix SOC...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const isLoginPage = router.state.location.pathname === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isLoginPage ? (
          <>
            <Outlet />
            <Toaster />
          </>
        ) : (
          <ProtectedLayout>
            <SimulationProvider>
              <SidebarProvider>
                <div className="flex min-h-screen w-full bg-background text-foreground">
                  <AppSidebar />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <TopBar />
                    <main className="flex-1 overflow-x-hidden">
                      <Outlet />
                    </main>
                  </div>
                </div>
                <SimulationController />
                <Toaster />
              </SidebarProvider>
            </SimulationProvider>
          </ProtectedLayout>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function TopBar() {
  const {
    stage,
    activeIncident,
    metrics,
    searchQuery,
    setSearchQuery,
    logs,
    incidents,
    notifications,
    markNotificationRead,
    clearNotifications,
  } = useSim();
  const { signOut } = useAuth();
  const router = useRouter();
  const alerting = stage !== "idle" && stage !== "complete";
  const mounted = useMounted();
  const [isFocused, setIsFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.navigate({ to: "/login" });
  };

  const q = searchQuery.toLowerCase().trim();
  const matchedIncidents = q
    ? incidents.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.srcIp.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      )
    : [];

  const matchedLogs = q
    ? logs.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.srcIp.toLowerCase().includes(q) ||
          l.dstIp.toLowerCase().includes(q) ||
          (l.hash && l.hash.toLowerCase().includes(q))
      )
    : [];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger />
      <div className="hidden items-center gap-2 md:flex">
        <div
          className={`h-2 w-2 rounded-full animate-flicker ${
            activeIncident
              ? "bg-destructive"
              : alerting
                ? "bg-warning"
                : "bg-success"
          }`}
          aria-hidden="true"
        />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          System Status:{" "}
          <span
            className={
              activeIncident
                ? "text-destructive font-semibold"
                : alerting
                  ? "text-warning font-semibold"
                  : "text-success"
            }
          >
            {activeIncident
              ? "Incident Active"
              : alerting
                ? "Remediating"
                : "Operational"}
          </span>
        </span>
      </div>

      <div className="relative ml-auto hidden w-72 md:block">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id="search-input"
          name="search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          aria-label="Search logs, IPs, hashes"
          placeholder="Search logs, IPs, hashes…"
          className="h-8 w-full rounded-md border border-border bg-muted/40 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus:outline-none"
        />
        {isFocused && searchQuery.trim() !== "" && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[320px] overflow-y-auto rounded-md border border-border bg-card/95 backdrop-blur p-2 shadow-2xl glow-primary">
            {matchedIncidents.length === 0 && matchedLogs.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-3">
                {matchedIncidents.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent border-b border-border/40">
                      Incidents ({matchedIncidents.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {matchedIncidents.slice(0, 3).map((i) => (
                        <button
                          key={i.id}
                          onClick={() => {
                            setSearchQuery(i.id);
                            router.navigate({ to: "/" });
                          }}
                          className="w-full text-left rounded px-2 py-1 text-[11px] hover:bg-muted/50 transition duration-150"
                        >
                          <div className="flex items-center justify-between font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-accent">{i.id}</span>
                              <span className="font-mono text-[9px] text-muted-foreground">{i.srcIp}</span>
                            </div>
                            <span className="text-[10px] uppercase text-muted-foreground">{i.status}</span>
                          </div>
                          <div className="truncate text-foreground font-semibold mt-0.5">{i.title}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchedLogs.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary border-b border-border/40">
                      Logs & IPs ({matchedLogs.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {matchedLogs.slice(0, 4).map((l) => (
                        <button
                          key={l.id}
                          onClick={() => {
                            setSearchQuery(l.srcIp);
                            router.navigate({ to: "/logs" });
                          }}
                          className="w-full text-left rounded px-2 py-1 text-[11px] hover:bg-muted/50 transition duration-150"
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span className="font-mono text-foreground">{l.srcIp}</span>
                            <span className="text-[9px] uppercase tracking-wider text-accent">{l.source}</span>
                          </div>
                          <div className="truncate text-muted-foreground text-[10px] mt-0.5">{l.message}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden items-center gap-3 rounded-md border border-border bg-card/40 px-3 py-1.5 text-[11px] md:flex">
        <span className="text-muted-foreground">EPS</span>
        <span className="font-mono font-semibold text-accent">
          {mounted ? metrics.eventsPerSec.toLocaleString() : "..."}
        </span>
        <span className="text-muted-foreground">| Alerts</span>
        <span className="font-mono font-semibold text-warning">{metrics.alertsToday}</span>
      </div>

      <div className="relative">
        <button
          id="bell-button"
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className={`relative flex h-8 w-8 items-center justify-center rounded-md border transition-all duration-200 hover-ring hover:scale-105 active:scale-95 ${
            isNotifOpen
              ? "border-accent bg-accent/15 scale-95"
              : alerting
                ? "border-destructive bg-destructive/15 animate-pulse-alert"
                : "border-border bg-card/40 hover:bg-card/70 hover:border-accent/40"
          } focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none`}
          aria-label={alerting ? `${metrics.alertsToday} active alerts` : "No active alerts"}
        >
          {alerting ? (
            <ShieldAlert className="h-4 w-4 text-destructive ring-bell-icon" aria-hidden="true" />
          ) : (
            <Bell className={`h-4 w-4 ring-bell-icon transition-colors ${isNotifOpen ? "text-accent" : "text-muted-foreground"}`} aria-hidden="true" />
          )}
          {notifications.some((n) => !n.read) && (
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground animate-pulse">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>

        {isNotifOpen && (
          <div id="notifications-dropdown" className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-md border border-border bg-card/95 backdrop-blur shadow-2xl glow-primary">
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
              <span id="notifications-title" className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                System Alerts & Logs ({notifications.filter((n) => !n.read).length} Unread)
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    clearNotifications();
                  }}
                  className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No notifications recorded yet.
                </div>
              ) : (
                notifications.map((n) => {
                  let NotifIcon = Info;
                  let iconColor = "text-info";
                  if (n.type === "attack") {
                    NotifIcon = ShieldAlert;
                    iconColor = "text-destructive";
                  } else if (n.type === "playbook") {
                    NotifIcon = Cpu;
                    iconColor = "text-accent";
                  } else if (n.type === "remediation") {
                    NotifIcon = CheckCircle;
                    iconColor = "text-success";
                  } else if (n.type === "variable") {
                    NotifIcon = Activity;
                    iconColor = "text-warning";
                  }

                  return (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`flex gap-3 p-3 hover:bg-muted/40 cursor-pointer transition-colors ${
                        !n.read ? "bg-muted/10 font-semibold" : ""
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
                        <NotifIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-foreground leading-snug">{n.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-muted-foreground">
                            {formatRelativeTime(n.timestamp)}
                          </span>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/40 transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>

      <div
        role="img"
        aria-label="Operator initials: SO"
        className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary text-xs font-bold text-primary-foreground select-none"
      >
        SO
      </div>
    </header>
  );
}
