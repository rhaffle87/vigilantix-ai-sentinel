import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Authenticate · VIGILANTIX AI" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // If email confirmation is enabled, session will be null
        if (data.user && !data.session) {
          setSuccess("Registration successful! Please check your email to confirm your operator profile before signing in.");
          setEmail("");
          setPassword("");
          setIsSignUp(false); // Toggle to Sign In mode
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      
      // Navigate to dashboard on success
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isSignUp ? "Create Account" : "SOC Authorization"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? "Register a new operator profile" : "Enter credentials to access the command center"}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="text-xs font-semibold text-foreground uppercase tracking-wider">Email</label>
            <input
              id="email-input"
              type="email"
              name="email"
              autoComplete={isSignUp ? "username" : "email"}
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus:outline-none"
              placeholder="operator@vigilantix.ai"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password-input" className="text-xs font-semibold text-foreground uppercase tracking-wider">Password</label>
            <input
              id="password-input"
              type="password"
              name="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus:outline-none"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {loading ? "Authenticating..." : isSignUp ? "Register" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account? " : "Need an operator profile? "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
          >
            {isSignUp ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
