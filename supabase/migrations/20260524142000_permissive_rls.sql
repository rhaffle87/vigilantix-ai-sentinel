-- Supabase Migration: 20260524142000_permissive_rls.sql
-- Relax Row Level Security (RLS) to permit anonymous (anon) guest interactions on telemetry tables

-- 1. Logs permissive policies
CREATE POLICY "Allow select for anonymous users on logs"
ON public.logs FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow insert for anonymous users on logs"
ON public.logs FOR INSERT
TO anon
WITH CHECK (true);

-- 2. Incidents permissive policies
CREATE POLICY "Allow select for anonymous users on incidents"
ON public.incidents FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow insert for anonymous users on incidents"
ON public.incidents FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow update for anonymous users on incidents"
ON public.incidents FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 3. SOAR Tasks permissive policies
CREATE POLICY "Allow select for anonymous users on soar_tasks"
ON public.soar_tasks FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow insert for anonymous users on soar_tasks"
ON public.soar_tasks FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow update for anonymous users on soar_tasks"
ON public.soar_tasks FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 4. Metric Series permissive policies
CREATE POLICY "Allow select for anonymous users on metric_series"
ON public.metric_series FOR SELECT
TO anon
USING (true);
