import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { kitchen } from "@/lib/kitchen-config";

type AuthSearch = { next?: string };

function isSafePath(p: unknown): p is string {
  return typeof p === "string" && p.startsWith("/") && !p.startsWith("//");
}

type Screen = "landing" | "email" | "phone" | "phone-verify" | "signin" | "forgot-password";

function calculatePasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score: 0, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score: 33, label: "Fair", color: "bg-orange-500" };
  if (score <= 4) return { score: 66, label: "Good", color: "bg-yellow-500" };
  return { score: 100, label: "Strong", color: "bg-green-500" };
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  showStrength = false,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  autoComplete: string;
  required?: boolean;
  showStrength?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = showStrength ? calculatePasswordStrength(value) : null;

  return (
    <div>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          required={required}
          minLength={6}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-input bg-background px-3 py-3 pr-10 text-sm outline-none focus:border-clay"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value && strength && (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Strength:</span>
            <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${strength.color}`}
              style={{ width: `${strength.score}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    next: isSafePath(s.next) ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Sign in · ${kitchen.brand.fullName}` },
      { name: "description", content: `Sign in to order from ${kitchen.brand.fullName}.` },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = next ?? "/account";

  const [screen, setScreen] = useState<Screen>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [busy, setBusy] = useState(false);
  const [phoneToken, setPhoneToken] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: dest });
    });
  }, [navigate, dest]);

  async function handleEmailSignup(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          landmark: landmark.trim() || null,
        },
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      navigate({ to: dest });
    } else {
      toast.success(
        "Check your email to confirm your account. Your details will be saved automatically after confirmation.",
      );
      setScreen("landing");
    }
  }

  async function handleEmailSignin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: dest });
  }

  async function handleSendOtp() {
    if (!phone.trim()) return toast.error("Enter your phone number");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPhoneToken(phone.trim());
    setOtp(Array(6).fill(""));
    setScreen("phone-verify");
  }

  async function handleVerifyOtp() {
    const token = otp.join("");
    if (token.length !== 6) return toast.error("Enter the full 6-digit code");
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phoneToken,
      token,
      type: "sms",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/account/complete" });
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return toast.error("Enter your email address");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/auth/reset-password",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email for the reset link.");
    setScreen("signin");
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  function handleOtpChange(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  function back() {
    if (screen === "phone-verify") setScreen("phone");
    else if (screen === "forgot-password") setScreen("signin");
    else setScreen("landing");
  }

  return (
    <div className="min-h-screen bg-background text-foreground paper-grain">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 md:px-8">
        {screen === "landing" ? (
          <>
            <Link
              to="/"
              className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground hover:text-clay"
            >
              ← Back home
            </Link>

            <h1 className="mt-6 font-serif text-4xl leading-[1.05] text-ink">
              Create an <span className="italic text-clay">account</span>.
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {next
                ? "One quick step so we can save your delivery details and order history."
                : "Sign in to place orders, track your history, or manage the kitchen."}
            </p>

            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-ink/15 bg-background px-5 py-3 text-sm font-medium text-ink transition-all hover:bg-ink/[0.03] disabled:opacity-60"
              >
                <GoogleIcon /> Google
              </button>

              <button
                type="button"
                onClick={() => setScreen("email")}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-ink/15 bg-background px-5 py-3 text-sm font-medium text-ink transition-all hover:bg-ink/[0.03]"
              >
                Continue with Email
              </button>

              <button
                type="button"
                onClick={() => setScreen("phone")}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-ink/15 bg-background px-5 py-3 text-sm font-medium text-ink transition-all hover:bg-ink/[0.03]"
              >
                Continue with Phone
              </button>
            </div>

            <button
              type="button"
              onClick={() => setScreen("signin")}
              className="mt-8 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
            >
              Already have an account? Sign in
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground hover:text-clay"
            >
              <ArrowLeft className="h-3 w-3" /> All options
            </button>

            {screen === "email" && (
              <>
                <h1 className="mt-6 font-serif text-3xl leading-[1.05] text-ink">
                  Continue with <span className="italic text-clay">Email</span>
                </h1>

                <form onSubmit={handleEmailSignup} className="mt-6 grid gap-3">
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
                  />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
                  />
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number (e.g. +91...)"
                    className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
                  />
                  <input
                    type="text"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Delivery address (sector, flat / house)"
                    className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
                  />
                  <input
                    type="text"
                    autoComplete="off"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Landmark / hostel (e.g. NIT Hostel 7)"
                    className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
                  />
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Password (min 6 chars)"
                    autoComplete="new-password"
                    required
                    showStrength
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Create account
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setScreen("signin")}
                  className="mt-6 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
                >
                  Have an account? Sign in
                </button>
              </>
            )}

            {screen === "phone" && (
              <>
                <h1 className="mt-6 font-serif text-3xl leading-[1.05] text-ink">
                  Continue with <span className="italic text-clay">Phone</span>
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  We'll send you a one-time code.
                </p>

                <div className="mt-6 grid gap-3">
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number (e.g. +91...)"
                    className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Send OTP
                  </button>
                </div>
              </>
            )}

            {screen === "phone-verify" && (
              <>
                <h1 className="mt-6 font-serif text-3xl leading-[1.05] text-ink">
                  Enter the <span className="italic text-clay">code</span>
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a 6-digit code to <strong>{phoneToken}</strong>.
                </p>

                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={otp[i]}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="h-12 w-10 rounded-lg border border-input bg-background text-center text-lg font-bold outline-none focus:border-clay focus:ring-1 focus:ring-clay"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={busy || otp.join("").length !== 6}
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Verify
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={busy}
                  className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
                >
                  Resend code
                </button>
              </>
            )}

            {screen === "signin" && (
              <>
                <h1 className="mt-6 font-serif text-3xl leading-[1.05] text-ink">
                  Sign <span className="italic text-clay">in</span>
                </h1>

                <form onSubmit={handleEmailSignin} className="mt-6 grid gap-3">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
                  />
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    showStrength={false}
                  />
                  <button
                    type="button"
                    onClick={() => setScreen("forgot-password")}
                    className="justify-self-start text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Sign in
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setScreen("phone")}
                  className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
                >
                  Sign in with phone →
                </button>

                <button
                  type="button"
                  onClick={() => setScreen("landing")}
                  className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
                >
                  Need an account? Sign up
                </button>
              </>
            )}

            {screen === "forgot-password" && (
              <>
                <h1 className="mt-6 font-serif text-3xl leading-[1.05] text-ink">
                  Reset your <span className="italic text-clay">password</span>
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email and we'll send you a reset link.
                </p>

                <form onSubmit={handleForgotPassword} className="mt-6 grid gap-3">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Send reset link
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.75 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.18 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
