-- Create logs table
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT now() NOT NULL,
  source TEXT NOT NULL, -- 'endpoint' | 'network' | 'server' | 'firewall' | 'auth'
  src_ip TEXT NOT NULL,
  dst_ip TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'info' | 'warn' | 'critical'
  anomaly NUMERIC NOT NULL,
  hash TEXT
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id TEXT PRIMARY KEY, -- e.g., 'INC-9281'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  src_ip TEXT NOT NULL,
  anomaly NUMERIC NOT NULL,
  status TEXT DEFAULT 'investigating' NOT NULL, -- 'investigating' | 'contained' | 'resolved'
  playbook TEXT NOT NULL,
  vt_verdict TEXT NOT NULL -- 'malicious' | 'suspicious' | 'clean'
);

-- Create soar_tasks table
CREATE TABLE IF NOT EXISTS public.soar_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id TEXT REFERENCES public.incidents(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  done BOOLEAN DEFAULT false NOT NULL
);

-- Create metric_series table for charts
CREATE TABLE IF NOT EXISTS public.metric_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  t TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  events INTEGER NOT NULL,
  anomalies INTEGER NOT NULL,
  blocked INTEGER NOT NULL
);

-- Enable RLS for all tables
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soar_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_series ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for authenticated users
CREATE POLICY "Allow select for authenticated users on logs"
ON public.logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users on logs"
ON public.logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow select for authenticated users on incidents"
ON public.incidents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users on incidents"
ON public.incidents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update for authenticated users on incidents"
ON public.incidents FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow select for authenticated users on soar_tasks"
ON public.soar_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users on soar_tasks"
ON public.soar_tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update for authenticated users on soar_tasks"
ON public.soar_tasks FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow select for authenticated users on metric_series"
ON public.metric_series FOR SELECT
TO authenticated
USING (true);

-- Create covering index for foreign key performance
CREATE INDEX IF NOT EXISTS soar_tasks_incident_id_idx ON public.soar_tasks(incident_id);

-- Revoke EXECUTE on public.rls_auto_enable() from public to prevent anon execution
ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.soar_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metric_series;

-- Seed Initial Incidents
INSERT INTO public.incidents (id, created_at, title, src_ip, anomaly, status, playbook, vt_verdict)
VALUES 
  ('INC-9281', now() - interval '4 hours', 'Brute force on auth gateway', '185.220.101.45', 92, 'resolved', 'PB-Auth-Lockdown', 'malicious'),
  ('INC-9275', now() - interval '26 hours', 'Suspicious PowerShell on WIN-EP-22', '10.0.4.21', 88, 'resolved', 'PB-EDR-Isolate', 'suspicious')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial SOAR Tasks for the Incidents
INSERT INTO public.soar_tasks (incident_id, key, label, done)
VALUES
  ('INC-9281', 'block_ip', 'Block malicious IP at edge firewall', true),
  ('INC-9281', 'isolate', 'Isolate infected endpoint device', true),
  ('INC-9281', 'notify', 'Dispatch admin notification (email + pager)', true),
  ('INC-9281', 'snapshot', 'Snapshot endpoint memory for forensics', true),
  ('INC-9281', 'ticket', 'Create incident ticket in audit log', true),
  ('INC-9275', 'block_ip', 'Block malicious IP at edge firewall', true),
  ('INC-9275', 'isolate', 'Isolate infected endpoint device', true),
  ('INC-9275', 'notify', 'Dispatch admin notification (email + pager)', true),
  ('INC-9275', 'snapshot', 'Snapshot endpoint memory for forensics', true),
  ('INC-9275', 'ticket', 'Create incident ticket in audit log', true)
ON CONFLICT DO NOTHING;

-- Seed Initial Metric Series (hourly trailing data points)
INSERT INTO public.metric_series (t, events, anomalies, blocked)
VALUES
  (now() - interval '23 hours', 950, 12, 2),
  (now() - interval '22 hours', 1120, 8, 1),
  (now() - interval '21 hours', 1040, 15, 3),
  (now() - interval '20 hours', 1200, 22, 5),
  (now() - interval '19 hours', 1310, 19, 4),
  (now() - interval '18 hours', 1450, 25, 6),
  (now() - interval '17 hours', 1100, 14, 2),
  (now() - interval '16 hours', 920, 9, 1),
  (now() - interval '15 hours', 870, 7, 0),
  (now() - interval '14 hours', 1050, 18, 3),
  (now() - interval '13 hours', 1230, 20, 4),
  (now() - interval '12 hours', 1190, 15, 2),
  (now() - interval '11 hours', 1380, 24, 7),
  (now() - interval '10 hours', 1410, 31, 8),
  (now() - interval '9 hours', 1280, 17, 3),
  (now() - interval '8 hours', 1150, 13, 2),
  (now() - interval '7 hours', 1090, 10, 1),
  (now() - interval '6 hours', 1240, 16, 4),
  (now() - interval '5 hours', 1360, 22, 5),
  (now() - interval '4 hours', 1480, 28, 9),
  (now() - interval '3 hours', 1520, 35, 11),
  (now() - interval '2 hours', 1410, 21, 6),
  (now() - interval '1 hour', 1330, 18, 5),
  (now(), 1250, 14, 3);

-- Seed Initial Logs (30 recent log entries)
INSERT INTO public.logs (ts, source, src_ip, dst_ip, message, severity, anomaly)
VALUES
  (now() - interval '1 minute', 'network', '192.168.1.105', '10.0.0.15', 'TCP SYN ack', 'info', 12),
  (now() - interval '2 minutes', 'endpoint', '10.0.4.12', '10.0.0.1', 'EDR heartbeat', 'info', 5),
  (now() - interval '3 minutes', 'server', '10.0.2.55', '10.0.2.1', 'Nginx 200 /api/health', 'info', 8),
  (now() - interval '4 minutes', 'firewall', '88.23.45.112', '10.0.0.12', 'Rule match: allow 443', 'info', 15),
  (now() - interval '5 minutes', 'auth', '10.0.5.99', '10.0.0.2', 'Session start', 'info', 22),
  (now() - interval '6 minutes', 'network', '10.0.4.88', '192.168.1.200', 'DNS query resolved', 'info', 10),
  (now() - interval '7 minutes', 'endpoint', '10.0.4.12', '10.0.0.1', 'Process exec: chrome.exe', 'info', 18),
  (now() - interval '8 minutes', 'server', '10.0.2.56', '10.0.2.1', 'DB query 12ms', 'info', 11),
  (now() - interval '9 minutes', 'firewall', '142.250.74.46', '10.0.0.12', 'Rate limit ok', 'info', 7),
  (now() - interval '10 minutes', 'auth', '10.0.5.99', '10.0.0.2', 'MFA verify ok', 'info', 14),
  (now() - interval '11 minutes', 'network', '192.168.1.105', '10.0.0.15', 'TLS handshake ok', 'info', 13),
  (now() - interval '12 minutes', 'endpoint', '10.0.4.12', '10.0.0.1', 'DLL load: kernel32', 'info', 25),
  (now() - interval '13 minutes', 'server', '10.0.2.55', '10.0.2.1', 'Cron job ok', 'info', 4),
  (now() - interval '14 minutes', 'firewall', '223.19.45.2', '10.0.0.12', 'GeoIP allow EU', 'info', 19),
  (now() - interval '15 minutes', 'auth', '10.0.5.101', '10.0.0.2', 'OAuth token refresh', 'info', 20),
  (now() - interval '16 minutes', 'network', '10.0.4.88', '192.168.1.200', 'Packet inspect ok', 'info', 6),
  (now() - interval '17 minutes', 'endpoint', '10.0.4.12', '10.0.0.1', 'USB device mounted', 'info', 30),
  (now() - interval '18 minutes', 'server', '10.0.2.56', '10.0.2.1', 'Container restart', 'warn', 45),
  (now() - interval '19 minutes', 'firewall', '5.188.10.45', '10.0.0.12', 'ACL pass', 'info', 12),
  (now() - interval '20 minutes', 'auth', '10.0.5.99', '10.0.0.2', 'Audit log write', 'info', 15),
  (now() - interval '21 minutes', 'network', '192.168.1.105', '10.0.0.15', 'TCP SYN ack', 'info', 12),
  (now() - interval '22 minutes', 'endpoint', '10.0.4.12', '10.0.0.1', 'EDR heartbeat', 'info', 5),
  (now() - interval '23 minutes', 'server', '10.0.2.55', '10.0.2.1', 'Nginx 200 /api/health', 'info', 8),
  (now() - interval '24 minutes', 'firewall', '88.23.45.112', '10.0.0.12', 'Rule match: allow 443', 'info', 15),
  (now() - interval '25 minutes', 'auth', '10.0.5.99', '10.0.0.2', 'Session start', 'info', 22),
  (now() - interval '26 minutes', 'network', '10.0.4.88', '192.168.1.200', 'DNS query resolved', 'info', 10),
  (now() - interval '27 minutes', 'endpoint', '10.0.4.12', '10.0.0.1', 'Process exec: chrome.exe', 'info', 18),
  (now() - interval '28 minutes', 'server', '10.0.2.56', '10.0.2.1', 'DB query 12ms', 'info', 11),
  (now() - interval '29 minutes', 'firewall', '142.250.74.46', '10.0.0.12', 'Rate limit ok', 'info', 7),
  (now() - interval '30 minutes', 'auth', '10.0.5.99', '10.0.0.2', 'MFA verify ok', 'info', 14);
