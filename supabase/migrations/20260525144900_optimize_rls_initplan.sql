-- Supabase Migration: 20260525144900_optimize_rls_initplan.sql
-- Optimize RLS policy performance by caching auth.role() evaluation using InitPlan subqueries

-- 1. Logs Table - Anon Insert
DROP POLICY IF EXISTS "Allow insert for anonymous users on logs" ON public.logs;
CREATE POLICY "Allow insert for anonymous users on logs"
ON public.logs FOR INSERT
TO anon
WITH CHECK ((select auth.role()) = 'anon');

-- 2. Incidents Table - Anon Insert & Update
DROP POLICY IF EXISTS "Allow insert for anonymous users on incidents" ON public.incidents;
CREATE POLICY "Allow insert for anonymous users on incidents"
ON public.incidents FOR INSERT
TO anon
WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow update for anonymous users on incidents" ON public.incidents;
CREATE POLICY "Allow update for anonymous users on incidents"
ON public.incidents FOR UPDATE
TO anon
USING ((select auth.role()) = 'anon')
WITH CHECK ((select auth.role()) = 'anon');

-- 3. SOAR Tasks Table - Anon Insert & Update
DROP POLICY IF EXISTS "Allow insert for anonymous users on soar_tasks" ON public.soar_tasks;
CREATE POLICY "Allow insert for anonymous users on soar_tasks"
ON public.soar_tasks FOR INSERT
TO anon
WITH CHECK ((select auth.role()) = 'anon');

DROP POLICY IF EXISTS "Allow update for anonymous users on soar_tasks" ON public.soar_tasks;
CREATE POLICY "Allow update for anonymous users on soar_tasks"
ON public.soar_tasks FOR UPDATE
TO anon
USING ((select auth.role()) = 'anon')
WITH CHECK ((select auth.role()) = 'anon');
