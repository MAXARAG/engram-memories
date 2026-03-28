import React from "react";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export default function ComingSoon({
  title,
  description = "Este módulo está en construcción. Pronto vas a poder gestionar toda la información desde acá.",
  icon: Icon = Construction,
}: ComingSoonProps) {
  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">Módulo de gestión agropecuaria</p>
        </div>
      </div>

      {/* Coming soon card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <div
          className="animate-fade-in"
          style={{
            textAlign: "center",
            maxWidth: 440,
            padding: "3rem 2rem",
            background: "#fff",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "var(--color-primary-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <Icon size={36} color="var(--color-primary)" strokeWidth={1.5} />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
              marginBottom: "0.75rem",
            }}
          >
            {title}
          </h2>

          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              marginBottom: "1.75rem",
            }}
          >
            {description}
          </p>

          {/* Progress bar decorative */}
          <div
            style={{
              height: 4,
              background: "var(--color-border)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "40%",
                background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                borderRadius: 2,
                animation: "progressPulse 2s ease-in-out infinite",
              }}
            />
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-light)",
              marginTop: "0.5rem",
            }}
          >
            En desarrollo
          </p>
        </div>
      </div>

      <style>{`
        @keyframes progressPulse {
          0%, 100% { transform: translateX(-100%); }
          50%       { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
