# Changelog

All notable changes to the **VIGILANTIX AI** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-05-24

### Added
*   **WORM RLS Immutability Policies**: Enabled immutable telemetry logging to comply with SOC 2 CC6.5 and ISO 27001 by restricting `logs` and `incidents` to write-only operations (`SELECT` and `INSERT`) for authenticated users, explicitly revoking `UPDATE` and `DELETE`.
*   **Foreign Key Optimizations**: Added `soar_tasks_incident_id_idx` covering index on `public.soar_tasks(incident_id)` for high-latency query prevention.
*   **GDPR IP Pseudonymization**: Integrated frontend IP masking frameworks (e.g. `192.168.1.xxx` masking) inside dashboard views.
*   **Asset Branding Synchronization**: Added custom check-shield vector `public/favicon.svg` and standard fallback `public/favicon.ico` asset package. Linked elements in HTML template headers.

### Changed
*   **Uniform Sidebar Branding**: Swapped the generic `ShieldCheck` icon inside the sidebar brand header with the exact matching vector code from the check-shield favicon.
*   **SVG-Native Network Topology**: Replaced buggy dynamic icon imports with native SVG vector paths wrapped in `foreignObject` tags to fix layout balance and render quality.
*   **Assistant Layout Separation**: Refactored `AICisoAssistant.tsx` position rules with a `right-[368px]` margin offset, completely resolving overlaps with the main Simulation Controller across multiple device viewport scales.

### Fixed
*   **Supabase 400 & 409 Conflict Errors**: Removed obsolete `payload_hash` references from `SimulationContext.tsx` database insertion calls (residual files from the deleted Sandbox tool), resolving model schema mismatch crashes and constraint failures.
*   **Database Function Locks**: Upgraded PostgreSQL schema helper execution methods to `SECURITY INVOKER` and revoked broad public execute permissions.

---

## [1.0.0] - 2026-05-22

### Added
*   **Fullstack SSR Pipeline**: Initial release of VIGILANTIX using TanStack Start and serverless Cloudflare Workers hosting configurations.
*   **Realtime Websocket Channels**: Live incident, network log, and task list broadcast channels syncing Browser clients with PostgreSQL storage.
*   **SOAR Engine Editor**: Declarative YAML playbook editor supporting interactive, syntax-checked configurations.
*   **Real-time Attack Telemetry**: Attack simulator console mimicking multi-vector cyber incidents (DDoS, phishing, exfiltration, ransomware).
*   **Dark Glassmorphism Theme**: Fully customized Tailwind CSS v4 design with neon-glow outlines and animated background grids.
