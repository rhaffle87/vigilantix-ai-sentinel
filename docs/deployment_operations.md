# VIGILANTIX Deployment & Operations Guide

This guide details the local setup, environment variables, production edge builds, performance optimization techniques, and troubleshooting rules for VIGILANTIX.

---

## 🔑 Environment Variables Reference

A `.env` file must reside in the project root directory. Here is the configuration guide:

| Key | Description | Required? | Example Value | Security Impact |
| :--- | :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | Public endpoint API for Supabase project instance | **Yes** | `https://your-project-id.supabase.co` | Safe to expose; handles requests filtered by Row Level Security. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous API key for public requests | **Yes** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Safe to expose; authenticated queries trigger custom security checks. |

---

## 💻 Local Development Setup

### System Prerequisites
*   **Node.js**: v20 or greater (v22 LTS recommended)
*   **Package Manager**: npm or bun
*   **Supabase CLI**: Optional, for executing local schema migrations

### 1. Initialize Workspace
```bash
# Clone the repository
git clone https://github.com/rhaffle87/vigilantix-ai-sentinel.git
cd vigilantix-ai-sentinel

# Install node dependencies
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

---

## 🌐 Production Serverless Deployment

VIGILANTIX is engineered to be deployment-platform agnostic. It supports seamless deployment across major cloud environments, including **Vercel** and **Cloudflare Workers**.

### Option A: Deploying on Vercel (Zero-Config)
Vercel has native support for **TanStack Start** and **Vinxi** out of the box.

1. **Import Repository**: Connect your GitHub repository to Vercel.
2. **Framework Detection**: Vercel automatically detects the Vite/TanStack Start structure.
3. **Environment Variables**: Add your production keys in Vercel's Dashboard:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
4. **Deploy**: Click deploy. Vercel automatically runs `npm run build` and maps Vinxi outputs into Vercel Serverless Functions natively.

### Option B: Deploying on Cloudflare Workers
To target Cloudflare, you can include `@cloudflare/vite-plugin` in your Vite configs. The custom edge server uses a middleware layer that injects strict security headers on every response:

#### SSR Edge Security Headers Configuration (`src/server.ts`)

```typescript
const SECURITY_HEADERS = {
  // Lock down content sources (scripts, styles, workers, connections)
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:* http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*;",
  // Stop clickjacking
  "X-Frame-Options": "DENY",
  // Stop MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Control referrer privacy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Enforce HSTS (Strict HTTPS) for 1 year with preload support
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Restrict access to hardware features (camera, mic, GPS)
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
```

---

## ⚡ Production Bundling & manualChunks

To keep the initial load time extremely fast for SOC operators, heavy data-visualization libraries (`recharts` and `d3`) are lazy-loaded. We compile separate code chunks via Vite/Rollup configurations:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3")) {
              return "charts"; // Bundled into a separate chunk loaded only on-demand
            }
          }
        },
      },
    },
  },
});
```

---

## 🔍 Troubleshooting FAQ

### 1. "400 Bad Request" on Incident Sim Injection
*   **Cause**: The incident object being passed to `supabase.from("incidents").insert()` contains columns that do not match the remote database schema. Typically caused by deprecated fields like `payload_hash` from the removed Forensic Sandbox.
*   **Resolution**: Check [SimulationContext.tsx](file:///e:/Projects/vigilantix-ai/src/context/SimulationContext.tsx) and ensure the payload matches the PostgreSQL definition.

### 2. "409 (Conflict)" on SOAR Tasks Insertion
*   **Cause**: Parent incident insert failed (triggering a `400`), so the children tasks failed to satisfy the foreign key constraint referencing `incident_id` inside `public.soar_tasks`.
*   **Resolution**: Fix the parent insert parameters first. If duplicate keys are suspected, utilize Supabase's `.upsert()` matching on unique constraint values.

### 3. Favicon 404 Console Errors
*   **Cause**: Browsers automatically request `/favicon.ico` or `/favicon.svg`. If these do not exist in the root `public` static asset folder, the server returns a 404.
*   **Resolution**: Verify that [favicon.svg](file:///e:/Projects/vigilantix-ai/public/favicon.svg) and [favicon.ico](file:///e:/Projects/vigilantix-ai/public/favicon.ico) reside inside the root `/public` folder and are linked in [__root.tsx](file:///e:/Projects/vigilantix-ai/src/routes/__root.tsx).
