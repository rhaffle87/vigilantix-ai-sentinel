-- Supabase Migration: 20260525145200_recreate_authenticated_policies.sql
-- Recreate the missing RLS policies for the authenticated role on telemetry/incident tables.
-- Uses optimized (select auth.uid()) subqueries to satisfy performance guidelines.

-- 1. Logs Table
DROP POLICY IF EXISTS "Allow select for authenticated users on logs" ON public.logs;
CREATE POLICY "Allow select for authenticated users on logs"
ON public.logs FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users on logs" ON public.logs;
CREATE POLICY "Allow insert for authenticated users on logs"
ON public.logs FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);


-- 2. Incidents Table
DROP POLICY IF EXISTS "Allow select for authenticated users on incidents" ON public.incidents;
CREATE POLICY "Allow select for authenticated users on incidents"
ON public.incidents FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users on incidents" ON public.incidents;
CREATE POLICY "Allow insert for authenticated users on incidents"
ON public.incidents FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow update for authenticated users on incidents" ON public.incidents;
CREATE POLICY "Allow update for authenticated users on incidents"
ON public.incidents FOR UPDATE
TO authenticated
USING ((select auth.uid()) IS NOT NULL)
WITH CHECK ((select auth.uid()) IS NOT NULL);


-- 3. SOAR Tasks Table
DROP POLICY IF EXISTS "Allow select for authenticated users on soar_tasks" ON public.soar_tasks;
CREATE POLICY "Allow select for authenticated users on soar_tasks"
ON public.soar_tasks FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users on soar_tasks" ON public.soar_tasks;
CREATE POLICY "Allow insert for authenticated users on soar_tasks"
ON public.soar_tasks FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow update for authenticated users on soar_tasks" ON public.soar_tasks;
CREATE POLICY "Allow update for authenticated users on soar_tasks"
ON public.soar_tasks FOR UPDATE
TO authenticated
USING ((select auth.uid()) IS NOT NULL)
WITH CHECK ((select auth.uid()) IS NOT NULL);


-- 4. Metric Series Table
DROP POLICY IF EXISTS "Allow select for authenticated users on metric_series" ON public.metric_series;
CREATE POLICY "Allow select for authenticated users on metric_series"
ON public.metric_series FOR SELECT
TO authenticated
USING (true);
