# VIGILANTIX AI — SOC & SOAR Simulation Platform

Welcome to the **VIGILANTIX AI** platform documentation. VIGILANTIX is an enterprise-grade Security Operations Center (SOC) and Security Orchestration, Automation, and Response (SOAR) simulation environment. It offers real-time network topology visualization, automated threat generation, AI-assisted security decision-making, and interactive playbook configurations.

---

## 🎯 Project Mission & Value Proposition

In modern cybersecurity operations, security analysts and operators must deal with complex, high-velocity alert environments. VIGILANTIX serves as a premium, low-latency control and training environment that bridges the gap between raw telemetry monitoring and automated response orchestration.

Key pillars of VIGILANTIX:
1. **Real-time Threat Telemetry**: Streaming metrics and network logging visualizing multi-vector attacks (DDoS, Exfiltration, Ransomware, Phishing).
2. **Interactive Topology Mapping**: Live network node graph visualizers tracking telemetry load, path routing, and simulated security compromises.
3. **SOAR Playbook Automation**: Declarative YAML-based playbook engine letting operators modify, trigger, and resolve incident responses on the fly.
4. **AI Virtual CISO Support**: Context-aware, low-latency AI advisor parsing security metadata and proposing immediate mitigation strategies.
5. **Hardened Security & Compliant Infrastructure**: Append-Only database constraints (WORM log systems), strict HTTP security posture, and pseudonymized operator tracking.

---

## 💻 Core Technology Stack

VIGILANTIX is engineered with a modern, high-performance, and secure full-stack architecture:

| Tier | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Core** | **React 19** + **TypeScript** | Strict-typed modular UI views, component states, and rendering pipelines. |
| **Routing & SSR** | **TanStack Start** | Modern, type-safe full-stack framework with integrated Server-Side Rendering (SSR) & client hydration. |
| **Realtime Datastore** | **Supabase** (PostgreSQL) | Structured storage, foreign-key indexing, and Row Level Security (RLS) policies. |
| **Real-time Sync** | **Supabase Channels** (WebSockets) | Bidirectional streaming pipelines synchronizing incidents, task responses, and logs. |
| **State Management** | **React Context** + **Hooks** | Centralized, performant client-side state engines for telemetry simulations. |
| **Styling & Theme** | **Tailwind CSS v4** | CSS-first configuration, theme variables, and custom hardware-accelerated animations. |
| **Build System** | **Vite v7** | Lightning-fast ESM dev server and code-splitting Rollup production bundling. |
| **Edge Server** | **Cloudflare Workers** | Secure, low-latency, and serverless hosting environment using Vite SSR adapters. |

---

## 📂 Holistic Directory Structure

Below is an exhaustive mapping of the VIGILANTIX project directories and files to help onboarding engineers navigate the workspace:

```text
vigilantix-ai/
├── .env                          # Local environment secrets and keys
├── .gitignore                    # Version control ignore lists
├── components.json               # Radix UI / Shadcn configuration settings
├── package.json                  # Node.js dependencies, scripts, and package specs
├── tsconfig.json                 # Core TypeScript compiler configuration rules
├── vite.config.ts                # Vite build settings, chunking, and TanStack Start plugins
├── wrangler.jsonc                # Cloudflare wrangler deployment configuration
├── public/                       # Static public assets
│   ├── favicon.svg               # Premium custom check-shield vector icon
│   └── favicon.ico               # Legacy favicon binary fallback
├── supabase/                     # Supabase database configurations
│   └── migrations/
│       └── 20260524063037_init_telemetry.sql # Hardened SQL schema, indexes, and RLS WORM rules
├── src/                          # Application source code
│   ├── entry-client.tsx          # TanStack Start hydration client entrypoint
│   ├── entry-server.tsx          # SSR server rendering hook entrypoint
│   ├── routeTree.gen.ts          # Auto-generated TanStack Route tree mappings
│   ├── server.ts                 # Custom Cloudflare SSR Fetch handler & security header injector
│   ├── styles.css                # Global Tailwind CSS and hardware-accelerated custom animations
│   ├── components/               # Shared frontend UI components
│   │   ├── AICisoAssistant.tsx   # Context-aware AI virtual advisor panel
│   │   ├── AppSidebar.tsx        # Navigation sidebar with matching check-shield brand logo
│   │   ├── NetworkTopology.tsx   # High-fidelity SVG-based interactive live node graph
│   │   ├── SimulationController.tsx # Telemetry incident injector pane
│   │   └── ui/                   # Reusable low-level design system elements (buttons, cards, etc.)
│   ├── context/                  # Global application states
│   │   ├── AuthContext.tsx       # Supabase GoTrue authentication context provider
│   │   └── SimulationContext.tsx # Streaming threat simulation loop and Supabase websocket sync
│   ├── hooks/                    # Reusable React hooks
│   │   └── use-mounted.ts        # Client-side component hydration mount check hook
│   ├── lib/                      # External utility clients
│   │   └── supabase.ts           # Supabase client instantiation code
│   └── routes/                   # File-system based application routes (TanStack Start)
│       ├── __root.tsx            # Main shell template containing HTML header links and layout
│       ├── index.tsx             # Main dashboard displaying realtime analytics and topology map
│       ├── login.tsx             # Authentication portal
│       ├── logs.tsx              # Read-only audit log dashboard
│       ├── soar.tsx              # Interactive SOAR task and playbook YAML editor
│       └── billing.tsx           # Premium subscription management view
└── tests/                        # Automated testing frameworks (Playwright & Vitest)
```
