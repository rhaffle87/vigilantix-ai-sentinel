import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  BrainCircuit,
  Workflow,
  CreditCard,
  ShieldCheck,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSim } from "@/context/SimulationContext";

const items = [
  { title: "SOC Hub", url: "/", icon: LayoutDashboard },
  { title: "Data Collector & Logs", url: "/logs", icon: Database },
  { title: "AI Detection Engine", url: "/ai-detection", icon: BrainCircuit },
  { title: "SOAR Playbooks", url: "/soar", icon: Workflow },
  { title: "Billing & Infra", url: "/billing", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { metrics } = useSim();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-primary glow-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-widest text-foreground">
                VIGILANTIX
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
                AI · SOC-SOAR
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = path === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={it.url} className="flex items-center gap-3">
                        <it.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm">{it.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="m-2 rounded-md border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-accent" />
              <span>Live ingestion</span>
            </div>
            <div className="mt-1 text-lg font-mono font-semibold text-accent">
              {metrics.eventsPerSec.toLocaleString()}
              <span className="ml-1 text-[10px] text-muted-foreground">ev/s</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <Activity className="h-4 w-4 text-accent" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}