import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedRole =
    searchParams.get("role") === "teacher" ? "teacher" : "student";

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleLabel = selectedRole === "teacher" ? "Teacher" : "Student";
  const RoleIcon = selectedRole === "teacher" ? GraduationCap : UserRound;

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetMessages();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@gmail\.com$/i.test(normalizedEmail)) {
      setError("Please use a valid @gmail.com email address.");
      return;
    }

    if (mode === "register" && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const payload =
        mode === "login"
          ? {
              email: normalizedEmail,
              password,
            }
          : {
              name: name.trim(),
              email: normalizedEmail,
              password,
              role: selectedRole,
            };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const detail = data.detail;

        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(" ")
          : typeof detail === "string"
            ? detail
            : "Something went wrong. Please try again.";

        throw new Error(message);
      }

      if (mode === "register") {
        setSuccess(
          `Account created successfully as a ${roleLabel.toLowerCase()}. You can now sign in.`
        );

        setMode("login");
        setPassword("");
        return;
      }

      if (!data.access_token || !data.user) {
        throw new Error("Login response was incomplete. Please try again.");
      }

      if (data.user.role !== selectedRole) {
        throw new Error(
          `This account is registered as a ${data.user.role}. Please select the ${data.user.role} workspace and try again.`
        );
      }

      localStorage.setItem("authentichek_token", data.access_token);
      localStorage.setItem("authentichek_user", JSON.stringify(data.user));

      navigate(selectedRole === "teacher" ? "/teacher" : "/student");
    } catch (submitError) {
      setError(
        submitError.message || "Unable to connect to AuthentiCheck."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F6FAFD]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="background-bubble bubble-float-1 -left-30 top-[8%] h-80 w-80" />

        <div className="background-bubble-light bubble-float-2 -right-25 top-[5%] h-96 w-96" />

        <div className="background-bubble-soft bubble-float-3 bottom-[3%] left-[5%] h-72 w-72" />

        <div className="background-bubble-light bubble-float-4 -bottom-25 right-[5%] h-80 w-80" />

        <span className="floating-dot left-[17%] top-[17%]" />
        <span className="floating-dot left-[30%] top-[25%]" />
        <span className="floating-dot right-[26%] top-[20%]" />
        <span className="floating-dot right-[12%] top-[47%]" />
        <span className="floating-dot bottom-[27%] left-[10%]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <button
          type="button"
          onClick={() => navigate("/roles")}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3FA]">
            <ShieldCheck className="h-5 w-5 text-[#1A3D63]" />
          </div>

          <div className="text-left">
            <div className="text-sm font-bold text-[#0A1931]">
              AuthentiCheck
            </div>

            <div className="text-[6px] font-bold uppercase tracking-[0.18em] text-[#4A7FA7]">
              Academic Intelligence
            </div>
          </div>
        </button>

        <div className="text-[9px] font-semibold text-[#4A7FA7]">
          Step 2 of 2
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-90px)] items-center justify-center px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B3C8E0]/60 bg-[#EAF3FA] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A3D63]">
              <RoleIcon className="h-3.5 w-3.5" />
              {roleLabel} Workspace
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#B3C8E0]/55 bg-white p-7 shadow-xl shadow-[#1A3D63]/10 sm:p-9">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#EAF3FA] blur-3xl" />

            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#B3C8E0]/20 blur-3xl" />

            <div className="relative">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA]">
                  <LockKeyhole className="h-7 w-7 text-[#1A3D63]" />
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#0A1931]">
                  {mode === "login"
                    ? "Welcome back"
                    : "Create your account"}
                </h1>

                <p className="mt-2 text-xs leading-6 text-[#1A3D63]/65">
                  {mode === "login"
                    ? "Sign in to continue to your academic workspace."
                    : `Create a secure ${roleLabel.toLowerCase()} account to get started.`}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium leading-5 text-green-700"
                >
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                {mode === "register" && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#1A3D63]"
                    >
                      Full name
                    </label>

                    <div className="relative">
                      <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A7FA7]" />

                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="Enter your name"
                        autoComplete="name"
                        className="w-full rounded-xl border border-[#B3C8E0]/70 bg-[#F6FAFD] py-3 pl-10 pr-4 text-sm text-[#0A1931] outline-none transition focus:border-[#1A3D63] focus:ring-2 focus:ring-[#1A3D63]/10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#1A3D63]"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A7FA7]" />

                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      maxLength={255}
                      placeholder="you@gmail.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-[#B3C8E0]/70 bg-[#F6FAFD] py-3 pl-10 pr-4 text-sm text-[#0A1931] outline-none transition focus:border-[#1A3D63] focus:ring-2 focus:ring-[#1A3D63]/10"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="auth-password"
                      className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#1A3D63]"
                    >
                      Password
                    </label>

                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/forgot-password?role=${selectedRole}`)
                        }
                        className="text-[10px] font-semibold text-[#4A7FA7] transition hover:text-[#0A1931]"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A7FA7]" />

                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Enter your password"
                      autoComplete={
                        mode === "login"
                          ? "current-password"
                          : "new-password"
                      }
                      className="w-full rounded-xl border border-[#B3C8E0]/70 bg-[#F6FAFD] py-3 pl-10 pr-11 text-sm text-[#0A1931] outline-none transition focus:border-[#1A3D63] focus:ring-2 focus:ring-[#1A3D63]/10"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A7FA7] transition hover:text-[#0A1931]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#0A1931] px-5 py-3.5 text-xs font-bold text-white shadow-lg shadow-[#0A1931]/15 transition hover:bg-[#1A3D63] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-[#1A3D63]/65">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}

                <button
                  type="button"
                  onClick={() => {
                    resetMessages();

                    setMode((current) =>
                      current === "login" ? "register" : "login"
                    );

                    setPassword("");
                  }}
                  className="ml-1.5 font-bold text-[#1A3D63] hover:underline"
                >
                  {mode === "login" ? "Create one" : "Sign in"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/roles")}
                className="mx-auto mt-6 flex items-center gap-1.5 text-[10px] font-semibold text-[#4A7FA7] transition hover:text-[#0A1931]"
              >
                <ArrowLeft className="h-3 w-3" />
                Change workspace
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[9px] text-[#4A7FA7]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Your credentials are securely handled by AuthentiCheck.
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default AuthPage;