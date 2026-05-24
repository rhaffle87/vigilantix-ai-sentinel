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
import { ShieldAlert, Search, Bell } from "lucide-react";

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
          Something went wrong on our end. You can try refreshing or head back home.
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

function TopBar() {
  const { stage, activeIncident, metrics } = useSim();
  const alerting = stage !== "idle" && stage !== "complete";
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger />
      <div className="hidden items-center gap-2 md:flex">
        <div className="h-2 w-2 rounded-full bg-success animate-flicker" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          System Status: <span className="text-success">Operational</span>
        </span>
      </div>

      <div className="relative ml-auto hidden w-72 md:block">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search logs, IPs, hashes…"
          className="h-8 w-full rounded-md border border-border bg-muted/40 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
      </div>

      <div className="hidden items-center gap-3 rounded-md border border-border bg-card/40 px-3 py-1.5 text-[11px] md:flex">
        <span className="text-muted-foreground">EPS</span>
        <span className="font-mono font-semibold text-accent">
          {metrics.eventsPerSec.toLocaleString()}
        </span>
        <span className="text-muted-foreground">| Alerts</span>
        <span className="font-mono font-semibold text-warning">{metrics.alertsToday}</span>
      </div>

      <button
        className={`relative flex h-8 w-8 items-center justify-center rounded-md border ${
          alerting
            ? "border-destructive bg-destructive/15 animate-pulse-alert"
            : "border-border bg-card/40"
        }`}
        aria-label="alerts"
      >
        {alerting ? (
          <ShieldAlert className="h-4 w-4 text-destructive" />
        ) : (
          <Bell className="h-4 w-4 text-muted-foreground" />
        )}
        {activeIncident && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
            !
          </span>
        )}
      </button>

      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary text-xs font-bold text-primary-foreground">
        SO
      </div>
    </header>
  );
}
