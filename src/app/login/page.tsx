"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated redirect to app
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/animales");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Completá todos los campos");
      return;
    }
    setError(null);
    setSubmitting(true);

    const result = await login(email.trim(), password);
    if (result.success) {
      router.replace("/animales");
    } else {
      setError(result.error ?? "Credenciales inválidas");
      setSubmitting(false);
    }
  };

  return (
    <div className="login-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      {/* Decorative blobs */}
      <div style={{
        position: "fixed", top: "-10%", right: "-5%",
        width: 400, height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,90,39,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-5%", left: "-5%",
        width: 300, height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,105,20,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "0 1.5rem",
        }}
      >
        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 20px 60px rgba(45, 90, 39, 0.12), 0 4px 16px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
              padding: "2rem 2rem 1.75rem",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Subtle pattern */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
            }} />

            <div
              style={{
                width: 56, height: 56,
                borderRadius: 16,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
                position: "relative",
              }}
            >
              <Leaf size={26} color="#fff" strokeWidth={1.75} />
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "0.25rem",
                position: "relative",
              }}
            >
              VaniApp
            </h1>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "rgba(197, 217, 194, 0.8)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                position: "relative",
              }}
            >
              Gestión Agropecuaria
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: "2rem" }}>
            <p style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted)",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}>
              Ingresá tus credenciales para continuar
            </p>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "1.25rem",
                  color: "var(--color-error)",
                  fontSize: "0.875rem",
                }}
                role="alert"
              >
                <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: "1.125rem" }}>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  disabled={submitting}
                />
              </div>

              <div style={{ marginBottom: "1.75rem" }}>
                <label htmlFor="password" className="label">
                  Contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={submitting}
                    style={{ paddingRight: "2.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-light)",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.75rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  opacity: submitting ? 0.75 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? (
                  <>
                    <span
                      style={{
                        width: 16, height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </button>
            </form>
          </div>
        </div>

        <p style={{
          textAlign: "center",
          marginTop: "1.5rem",
          fontSize: "0.8125rem",
          color: "var(--color-text-light)",
        }}>
          VaniApp &copy; {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
