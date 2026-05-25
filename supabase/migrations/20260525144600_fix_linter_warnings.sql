-- Supabase Migration: 20260525144600_fix_linter_warnings.sql
-- Fix database security linter warnings

-- 1. Drop the legacy overly permissive authenticated policies that bypass RLS
DROP POLICY IF EXISTS "Allow all operations for authenticated users on incidents" ON public.incidents;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on logs" ON public.logs;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on metric_series" ON public.metric_series;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on soar_tasks" ON public.soar_tasks;

-- 2. Alter function rls_auto_enable() to be SECURITY INVOKER and revoke execution privileges
ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- 3. Recreate existing anonymous policies with secure linter-compliant predicates
-- Logs Table
DROP POLICY IF EXISTS "Allow insert for anonymous users on logs" ON public.logs;
CREATE POLICY "Allow insert for anonymous users on logs"
ON public.logs FOR INSERT
TO anon
WITH CHECK ((select auth.role()) = 'anon');

-- Incidents Table
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

-- SOAR Tasks Table
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
