# Contributing to VIGILANTIX AI

Thank you for your interest in contributing to **VIGILANTIX AI**! We welcome contributions from developers, security analysts, and UI/UX designers to help make our SOC-SOAR platform more robust, secure, and user-friendly.

---

## 🗺️ Developer Onboarding & Workflow

### 1. Setting Up Your Workspace
Follow the instructions in the [Quick Start Guide](README.md#🚀-quick-start-guide) or the detailed [docs/deployment_operations.md](docs/deployment_operations.md) to set up your local development environment.

### 2. Branching Strategy
We adhere to a standard branch system:
*   `main`: The production-ready branch. All merges here must be compiled, type-safe, and fully audited.
*   `feature/*`: For building new elements or components (e.g., `feature/new-attack-variant`).
*   `bugfix/*`: For fixing layout collisions or logic errors (e.g., `bugfix/sidebar-overlap`).
*   `security/*`: For security patching, RLS hardening, or regulatory compliance upgrades.

### 3. Pull Request (PR) Requirements
Before opening a PR, ensure that:
1.  **Type Safety Check**: Run `npx tsc --noEmit` and confirm that there are zero type-checking errors.
2.  **Production Compiler**: Build the project using `npm run build` to ensure all SSR and client environment bundles render cleanly.
3.  **Visual Polish**: Any UI additions must adhere to the dark glassmorphic design guidelines. Ensure no elements overlap.
4.  **Database Migration Compliance**: If modifying database schemas, verify that SQL policies adhere to Least Privilege rules and enforce Row Level Security (RLS) constraints.

---

## 🎨 Design & Code Standards

### TypeScript & React
*   Use descriptive type interfaces instead of `any`.
*   Maintain clean, modular components inside the `src/components/` folder.
*   Enforce proper hook cleanups (e.g., unsubscribing WebSocket connections) to prevent memory or connection leaks.

### Styling & CSS (Tailwind v4)
*   Adhere to design tokens specified in [src/styles.css](src/styles.css).
*   Avoid inline styling overrides where possible; utilize Tailwind utility classes.
*   Any customized animations must be hardware-accelerated using `will-change` properties.

### Database Schema Rules
*   Every table must have Row-Level Security (RLS) enabled.
*   Log, incident, and metric series telemetry must maintain **WORM (Write Once, Read Many)** immutability constraints (restrict `UPDATE` and `DELETE` access).
*   Avoid overly broad wildcard rules. Every policy must contain exact roles and scopes (`TO authenticated`).
*   Verify foreign key indexes to prevent performance issues during active joins.

---

## 🏆 Code of Conduct

*   Be respectful, professional, and collaborative.
*   Focus on technical evaluation and actionable code feedback rather than emotional debates.
*   Prioritize system security, performance, and user-privacy (GDPR client IP anonymization).
